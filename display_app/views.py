from random import randint
from urllib import request
from django.db import IntegrityError
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.urls import reverse
from .models import Movie, SavedMovieList, TempMovieList, SharedMovieList, SharedMovie
from app_login_and_reg.models import User
import json
import shortuuid
from django.db.models import F
from django.core.exceptions import ObjectDoesNotExist

# Creates a Temporary list and returns the list
def create_temp_list(movie_list, uuid):
    print("Building new temp list")
    temp_list = TempMovieList.objects.create(created_by = uuid)
    print("New Temp List created! ID: ", temp_list.id)
    # Updates or stores movie in database if it exists
    for movie_item in movie_list:
        print("Assessing: ", movie_item["title"])
        movie_object, created = Movie.objects.update_or_create(
            movie_id = movie_item["id"],
            title = movie_item["original_title"],
            release_date = movie_item["release_date"],
            defaults = {'description' : movie_item["overview"], 'poster' : movie_item["poster_path"]}
        )
        if created:
            print ("Added new movie to database.")
        elif not created:
            print ("Already exists in database")
        temp_list.movies.add(movie_object)
        print(movie_item["title"], " added to temp list!")
    
    return temp_list

# Attempts to create and return a shared list with a unique Sharecode
def create_shared_list():
    for attempt in range(10):
        try:
            shared_list = SharedMovieList.objects.create()
        except IntegrityError:
            print(f'Attempt {attempt}: A SharedMovieList already exists with that code.')
            continue
        else:
            print(f'New shared list({shared_list.sharecode}) created!')
            return shared_list
    raise IntegrityError("Couldn't create new share list.")

# Adds Shared movie objects to a shared list or updates the users who chose it.
def add_to_shared_list(shared_list, temp_list):
    user_uuid = temp_list.created_by
    shared_list.users = json.dumps(json.loads(F('users')).append(user_uuid))
    for each_movie in temp_list.movies:
        shared_movie, created = SharedMovie.objects.get_or_create(
            shared_list = shared_list, 
            movie = each_movie)
        if created:
            shared_movie.submitted_by = user_uuid
        elif not created:
            shared_movie.submitted_by = json.dumps(json.loads(F('submitted_by')).append(user_uuid))
        shared_movie.save()
    return True


# Create your views here.
# Displays main page
def index(request):
    return render(request, 'display_app/index.html')

def new_match(request):
    if 'uuid' not in request.session:
        request.session['uuid'] = shortuuid.uuid()
    data = json.loads(request.body)
    
    temp_list = create_temp_list(data['movie_list'], request.session['uuid'])
    sharecode = data['sharecode']
    print("Sharecode: " + sharecode)
    if sharecode:
        print("sharecode is True")

    if len(sharecode) == 0:
        try:
            shared_list = create_shared_list()
        except IntegrityError:
            return JsonResponse({"status": "Could not create SharedList.", "sharecode": ''})
    else:
        try:
            shared_list = SharedMovieList.objects.get(sharecode = sharecode)
        except ObjectDoesNotExist:
            return JsonResponse({"status": "SharedList not found.", "sharecode": ''})
    
    add_to_shared_list(shared_list, temp_list)
    
    return JsonResponse({"status": "success", "sharecode": sharecode})

def join_match(request, sharecode):
    print("YOU IN THE JOIN MATCHA")
    # data = json.loads(request.body)
    # print ("Join_match request.body data")
    # print (data)
    context = {'sharecode' : sharecode}
    return render(request, 'display_app/match.html', context)