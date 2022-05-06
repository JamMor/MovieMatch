from random import randint
from django.db import IntegrityError
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.urls import reverse
from list_builder.models import UserUUID, SavedMovieList
# from app_login_and_reg.models import User
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .uuid_assigner import get_or_set_uuid

# Displays main page
def index(request):
    user_uuid = get_or_set_uuid(request)
    return render(request, 'list_builder/index.html')

def save(request):
    response = {"status": "failure"}

    if not request.user.is_authenticated:
        response.update({"errors" : "Only logged in users can be saved."})

    else:
        data = json.loads(request.body)
        list_name = data.get("list_name")
        movie_list = data.get("movie_list")
        if not movie_list:
            response.update({"errors" : "Cannot save empty list."})
        else:
            try:
                user_uuid = get_or_set_uuid(request)
                print("Would save list:", list_name)
                print([movie["title"] for movie in movie_list])
                saved_list = SavedMovieList.objects.create_from_movie_list(list_of_movies=movie_list, creator=user_uuid, list_name=list_name)
                response.update({"status" : "success"})
            except Exception as err:
                print(err)
                response.update({"errors" : repr(err)})

    return JsonResponse(response)