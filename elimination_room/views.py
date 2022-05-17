from random import randint
from django.db import IntegrityError
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.urls import reverse
from list_builder.models import UserUUID, Movie, TempMovieList
from elimination_room.models import SharedMovieList, SharedMovie
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from list_builder.uuid_assigner import get_or_set_uuid


# When Shared List is updated, sends updated list to appropriate channel
def update_shared_list_channels(sharecode):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        print("No channel layer.")
        return

    group_name = 'match_%s' % sharecode
    async_to_sync(channel_layer.group_send)(
        group_name, 
        {"type": "update_message"})
    print("New ShareList information sent.")

#Views
def new_match(request):
    user_uuid = get_or_set_uuid(request)
    data = json.loads(request.body)
    
    nickname = data['nickname']
    print(f'Submitted Nickname is: {nickname}')
    user_uuid.nickname = data['nickname']

    user_uuid.save(update_fields=['nickname'])
    print("Nickname set: ")
    print(user_uuid.nickname)

    # temp_list = create_temp_list(data['movie_list'], user_uuid)
    temp_list = TempMovieList.objects.create_from_movie_list(list_of_movies = data['movie_list'], creator = user_uuid)
    
    sharecode = data['sharecode'].upper()
    print("Sharecode: " + sharecode)

    #Gets SharedList if sharecode, or creates new one
    if sharecode:
        try:
            shared_list = SharedMovieList.objects.get(sharecode = sharecode)
        except SharedMovieList.DoesNotExist:
            return JsonResponse({"status": "SharedList not found.", "sharecode": ''})
    else:
        try:
            shared_list = SharedMovieList.objects.create(created_by = user_uuid)
        except IntegrityError:
            return JsonResponse({"status": "Could not create SharedList.", "sharecode": ''})
    
    # add_to_shared_list(shared_list, temp_list)
    shared_list.add_list_to_shared_list(temp_list)
    update_shared_list_channels(shared_list.sharecode)

    return JsonResponse({"status": "success", "sharecode": shared_list.sharecode})

def join_match(request, sharecode):
    user_uuid = get_or_set_uuid(request)
    context = {
        'sharecode' : sharecode,
        'uuid' : user_uuid.uuid
        }
    return render(request, 'elimination_room/match.html', context)