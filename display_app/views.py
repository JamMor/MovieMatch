from random import randint
from django.db import IntegrityError
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.urls import reverse
from .models import UserUUID, Movie, SavedMovieList, TempMovieList, SharedMovieList, SharedMovie
from app_login_and_reg.models import User
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Creates a Temporary list and returns the list, Adds new movies to DB
def create_temp_list(movie_list, user_uuid):
    print("Building new temp list")
    temp_list = TempMovieList.objects.create(created_by = user_uuid)
    print("New Temp List created! ID: ", temp_list.id)
    # Updates or stores movie in database if it exists
    for movie_item in movie_list:
        print("Assessing: ", movie_item["title"])
        movie_object, created = Movie.objects.update_or_create(
            movie_id = movie_item["id"],
            title = movie_item["original_title"],
            release_date = movie_item["release_date"],
            defaults = {'description' : movie_item["overview"], 'poster_path' : movie_item["poster_path"]}
        )
        if created:
            print ("Added new movie to database.")
        elif not created:
            print ("Already exists in database")
        temp_list.movies.add(movie_object)
        print(movie_item["title"], " added to temp list!")
    temp_list.save()
    
    return temp_list

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

# Adds Shared movie objects to a shared list or updates the users who chose it.
def add_to_shared_list(shared_list, temp_list):
    user_uuid = temp_list.created_by
    #Use transactions here
    shared_list.contributors.add(user_uuid)
    for each_movie in temp_list.movies.all():
        shared_movie, created = SharedMovie.objects.get_or_create(
            shared_list = shared_list, 
            movie = each_movie)
        shared_movie.submitted_by.add(user_uuid)
        shared_movie.save()
    shared_list.save()
    update_shared_list_channels(shared_list.sharecode)

def get_or_set_uuid(request):
    #Checks to see if uuid key exists and is set in session
    if 'uuid' in request.session and request.session['uuid']:
        user_uuid = UserUUID.objects.get(uuid = request.session['uuid'])
        print(f'GET uuid: {request.session["uuid"]} =================================')
    else:
        user_uuid = UserUUID.objects.create()
        request.session['uuid'] = user_uuid.uuid
        print(f'CREATE uuid: {user_uuid.uuid} =================================')
    return user_uuid

# Displays main page
def index(request):
    user_uuid = get_or_set_uuid(request)
    return render(request, 'display_app/index.html')

def new_match(request):
    user_uuid = get_or_set_uuid(request)
    data = json.loads(request.body)
    
    nickname = data['nickname']
    print(f'Submitted Nickname is: {nickname}')
    user_uuid.nickname = data['nickname']

    user_uuid.save(update_fields=['nickname'])
    print("Nickname set: ")
    print(user_uuid.nickname)

    temp_list = create_temp_list(data['movie_list'], user_uuid)
    
    sharecode = data['sharecode']
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
    
    add_to_shared_list(shared_list, temp_list)
    
    return JsonResponse({"status": "success", "sharecode": shared_list.sharecode})

def join_match(request, sharecode):
    user_uuid = get_or_set_uuid(request)
    context = {
        'sharecode' : sharecode,
        'uuid' : user_uuid.uuid
        }
    return render(request, 'display_app/match.html', context)