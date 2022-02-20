from hmac import new
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

#Creates a Temporary list and returns the list
def create_temp_list(movie_list, uuid57):
    print("Building new temp list")
    new_temp_list = TempMovieList.objects.create()
    print("New Temp List created! ID: ", new_temp_list.id)
    # Stores movie in database if it exists
    for this_movie in movie_list:
        print("Assessing: ", this_movie["title"])
        new_movie, created = Movie.objects.get_or_create(
            movie_id = this_movie["id"],
            title = this_movie["original_title"],
            description = this_movie["overview"],
            poster = this_movie["poster_path"],
            release_date = this_movie["release_date"]
        )
        if created:
            print ("Added new movie to database.")
        elif not created:
            print ("Already exists in database")
        new_temp_list.movies.add(new_movie)
        print(this_movie["title"], " added to temp list!")
    new_temp_list.created_by = uuid57
    
    return new_temp_list

def create_shared_list():
    for attempt in range(10):
        try:
            shared_list = SharedMovieList.objects.create()
        except IntegrityError:
            print("Shared List already exists with that code.")
            continue
        else:
            return shared_list.sharecode

def add_to_shared_list(shared_list, temp_list):
    user_uuid = temp_list.created_by
    for each_movie in temp_list:
        shared_movie, created = SharedMovie.objects.get_or_create(
            shared_list = shared_list, 
            movie = each_movie)
        if created:
            shared_movie.submitted_by = user_uuid
        elif not created:
            shared_movie.submitted_by = json.dumps(json.loads(F('submitted_by')).append(user_uuid))
        shared_movie.save()
    return


# Create your views here.
# Displays main page
def index(request):
    return render(request, 'display_app/index.html')

def new_match(request):
    if request.session['uuid'] is None:
        request.session['uuid'] = shortuuid.uuid()
    data = json.loads(request.body)
    
    temp_list = create_temp_list(data['movie_list'], request.session['uuid'])
    
    sharecode = "SOMETHING HERE PLEASE"
    
    return JsonResponse({"sharecode": sharecode})

def join_match(request, sharecode=0):
    print("YOU IN THE JOIN MATCHA")
    # data = json.loads(request.body)
    # print ("Join_match request.body data")
    # print (data)
    context = {'sharecode' : sharecode}
    return render(request, 'display_app/match.html', context)