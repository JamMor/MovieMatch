import json
from random import randint
import random
from datetime import timedelta
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder

from list_builder.models import Persona
from elimination_room.models import SharedMovie, ShareRoomUser, SharedMovieList
from .serializer import SharedListEncoder as SharedListJsonEncoder
from .consumer_utils import find_next_index
from .json_response import SuccessJsonClassObject, FailedJsonClassObject

def request_eliminate(sharecode, persona_uuid, content):
    """
    Request to eliminate a movie from the list.
    Returns object with 
    """

    active_share_users_qs = ShareRoomUser.objects.filter(list__sharecode = sharecode, is_active = True).order_by('created_at')

    #If it isn't any user's turn, elimination hasn't started. Return failed msg
    if active_share_users_qs.filter(is_users_turn = True).count() == 0:
        response_object = FailedJsonClassObject(errors=["List not set to allow elimination."])
        return response_object
    
    #If it isn't THIS user's turn. Return failed msg
    this_user = active_share_users_qs.get(persona__uuid = persona_uuid)
    if not this_user.is_users_turn:
        response_object = FailedJsonClassObject(errors=["Not this users turn."])
        return response_object
    #If elimination has started:
    shared_movie_id = content['shared_movie_id']
    uneliminated_movies_qs = SharedMovie.objects.filter(shared_list__sharecode = sharecode, is_eliminated = False)
    movies_left = uneliminated_movies_qs.count()

    #If available movies > 1
    if movies_left > 1:
        #Eliminate movie
        try:
            shared_movie = uneliminated_movies_qs.get(id=shared_movie_id)
        except SharedMovie.DoesNotExist:
            print("Can't find selected movie (probably already eliminated).")
            response_object = FailedJsonClassObject(errors=["Shared movie not found in uneliminated movies."])
            return response_object
        shared_movie.is_eliminated = True
        shared_movie.save()
        movies_left -= 1
        
        #Pick next user
        current_user = active_share_users_qs.get(persona__uuid = persona_uuid)
        current_user.is_users_turn = False
        current_user.save()
        next_index = find_next_index(persona_uuid, list(active_share_users_qs.values_list('persona__uuid', flat=True)))
        if next_index == None:
            #FLAG handle error
            print("No available user for turn.")
            return
        next_user = active_share_users_qs[next_index]
        next_user.is_users_turn = True
        next_user.save()

        #Confirm Removal for Group
        response_object = SuccessJsonClassObject(data={
            "shared_movie_id": shared_movie_id,
            "eliminating_uuid": persona_uuid,
            "next_eliminating_uuid": next_user.persona.uuid
        })
        return response_object

    #If last possible elimination
    if movies_left == 1:
        final_movie = SharedMovie.objects.filter(shared_list__sharecode = sharecode, is_eliminated = False).first()
        response_object = SuccessJsonClassObject(data={
            "final_shared_movie_id": final_movie.id,
        })

        #Set all to no one's turn
        active_share_users_qs.filter(is_users_turn = True).update(is_users_turn = False)
        
        return response_object
    
def request_initialize(sharecode):
    try:
        model_dict = SharedListJsonEncoder(sharecode)
        return SuccessJsonClassObject(data=model_dict)
    except:
        return FailedJsonClassObject(errors=["Error initializing list."])