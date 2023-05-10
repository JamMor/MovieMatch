from random import randint
import random
from asgiref.sync import async_to_sync

from elimination_room.models import SharedMovieList, SharedMovie, ShareRoomUser
from .serializer import SharedListEncoder as SharedListJsonEncoder
from .consumer_utils import find_next_index
from .json_response import SuccessfulCommandResponse, FailedCommandResponse
from .queue_management import assign_round_order

def request_eliminate(sharecode, persona_uuid, content):
    """
    Request to eliminate a movie from the list.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    On succesful elimination, response will include 
    "shared_movie_id, eliminating_uuid, and next_eliminating_uuid".
    May include "final_shared_movie_id" if last elimination
    """

    command = "eliminated"

    active_share_users_qs = ShareRoomUser.objects.filter(list__sharecode = sharecode, is_active = True).order_by('created_at')

    # Error handling
    # If it isn't any user's turn, elimination hasn't started. Return failed msg
    if active_share_users_qs.filter(is_users_turn = True).count() == 0:
        return FailedCommandResponse(command=command, errors=["List not set to allow elimination."])

    # If it isn't THIS user's turn. Return failed msg
    this_user = active_share_users_qs.get(persona__uuid = persona_uuid)
    if not this_user.is_users_turn:
        return FailedCommandResponse(command=command, errors=["Not this users turn."])
    
    
    # If elimination has started:
    shared_movie_id = content['shared_movie_id']
    uneliminated_movies_qs = SharedMovie.objects.filter(shared_list__sharecode = sharecode, is_eliminated = False)
    movies_left = uneliminated_movies_qs.count()

    successful_response = SuccessfulCommandResponse(command=command)

    # If available movies > 1
    if movies_left > 1:
        #Eliminate movie
        try:
            shared_movie = uneliminated_movies_qs.get(id=shared_movie_id)
        except SharedMovie.DoesNotExist:
            print("Can't find selected movie (probably already eliminated).")
            return FailedCommandResponse(command=command, errors=["Shared movie not found in uneliminated movies."])
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

        successful_response.add_data({
            "shared_movie_id": shared_movie_id,
            "eliminating_uuid": persona_uuid,
            "next_eliminating_uuid": next_user.persona.uuid
        })

    # If last possible elimination
    if movies_left == 1:
        final_movie = SharedMovie.objects.filter(shared_list__sharecode = sharecode, is_eliminated = False).first()

        successful_response.add_data({"final_shared_movie_id": final_movie.id})

        #Set all to no one's turn
        active_share_users_qs.filter(is_users_turn = True).update(is_users_turn = False)
        
    return successful_response
    
def request_initialize(sharecode):
    """
    Request to intialize a movie from the list.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    Successful response returns the shareroom state of users and movies as "share_list".
    """

    command = "initialized"

    try:
        model_dict = SharedListJsonEncoder(sharecode)
        return SuccessfulCommandResponse(command=command, data={"share_list": model_dict})
    except:
        return FailedCommandResponse(command=command, errors=["Error initializing list."])
    
def request_elimination_start(sharecode):
    """
    Request to start elimination in a share room.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    Successful response returns the "eliminating_uuid" of the first selecting user.
    """

    command = "elimination_started"
    # active_share_users_qs = ShareRoomUser.objects.filter(list__sharecode = sharecode, is_active = True)
    
    #======================================================================
    shared_list = SharedMovieList.objects.get(sharecode = sharecode)

    #If elimination already in progress, return failed response
    if shared_list.round > 0:
        return FailedCommandResponse(command=command, errors=["Elimination already in progress."])
    
    # If less than 2 movies in list, return failed response
    if SharedMovie.objects.filter(shared_list__sharecode = sharecode).count() < 2:
        return FailedCommandResponse(command=command, errors=["Must be at least 2 movies in list to begin eliminating."])

    # Assign User Order and Retrieve First User (and unused round)
    eliminating_user, returned_round = assign_round_order(shared_list)
    
    shared_list.round = 1
    shared_list.turn = 1
    shared_list.save()

    return SuccessfulCommandResponse(command=command, data={
        "eliminating_uuid": eliminating_user.persona.uuid, 
        "current_round": 1
        })

    #==============================================================


    # users_eliminating = active_share_users_qs.filter(is_users_turn = True).count()
    # if users_eliminating > 0:
    #     return FailedCommandResponse(command=command, errors=["Elimination already in progress."])

    # if SharedMovie.objects.filter(shared_list__sharecode = sharecode).count() < 2:
    #     return FailedCommandResponse(command=command, errors=["Must be at least 2 movies in list to begin eliminating."])

    # #Randomly pick user to start
    # eliminating_user = random.choice(active_share_users_qs)
    # eliminating_user.is_users_turn = True
    # eliminating_user.save()
                    
    # return SuccessfulCommandResponse(command=command, data={"eliminating_uuid": eliminating_user.persona.uuid})

def request_refresh_list(sharecode):
    """
    Request to refresh a share room to redo elimination.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    Successful response returns the shareroom state of users and all movies un-eliminated as "share_list".
    """

    command = "refreshed"

    SharedMovie.objects.filter(shared_list__sharecode = sharecode).update(is_eliminated = False)

    try:
        model_dict = SharedListJsonEncoder(sharecode)
        return SuccessfulCommandResponse(command=command, data={"share_list": model_dict})
    except:
        return FailedCommandResponse(command=command, errors=["Error refreshing list."])
    