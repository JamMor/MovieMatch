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
from list_builder.moviedb_api_caller import add_movies_to_db_from_tmdb_ids

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
    response = {"status": "failure"}
    user_uuid = get_or_set_uuid(request)
    data = json.loads(request.body)
    
    nickname = data.get("nickname")
    movie_ids = data.get("movie_ids")
    sharecode = data.get("sharecode", "").upper()
    
    print(('Sharecode: {sharecode}') if sharecode else "No sharecode.")
    #Gets SharedList if sharecode, or creates new one
    if sharecode:
        try:
            shared_list = SharedMovieList.objects.get(sharecode = sharecode)
        except SharedMovieList.DoesNotExist as err:
            print(err)
            response.update({"errors": repr(err),"message": "SharedList not found.", "sharecode": sharecode})
            return JsonResponse(response)
    else:
        try:
            shared_list = SharedMovieList.objects.create(created_by = user_uuid)
        except IntegrityError as err:
            print(err)
            response.update({"errors": repr(err),"message": "Could not create SharedList.", "sharecode": sharecode})
            return JsonResponse(response)

    try:
        # Create temp_list from movie_ids
        all_in_db, ids_in_db, failed_ids = add_movies_to_db_from_tmdb_ids(movie_ids)
        print("All in DB!" if all_in_db else f'Failed: {list(failed_ids)}')
        temp_list = TempMovieList.objects.create_from_movie_ids(movie_ids=ids_in_db, creator=user_uuid)

        # Add TempList movies to SharedList
        shared_list.add_list_to_shared_list(temp_list)
    except Exception as err:
        print(err)
        response.update({"errors" : repr(err)})
        return JsonResponse(response)
    
    #Push updates to channel users.
    update_shared_list_channels(shared_list.sharecode)

    #Set Nickname
    user_uuid.nickname = nickname
    user_uuid.save(update_fields=['nickname'])

    response.update({"status": "success", "sharecode": shared_list.sharecode})
    return JsonResponse(response)

def join_match(request, sharecode):
    user_uuid = get_or_set_uuid(request)
    context = {
        'sharecode' : sharecode,
        'uuid' : user_uuid.uuid
        }
    return render(request, 'elimination_room/match.html', context)