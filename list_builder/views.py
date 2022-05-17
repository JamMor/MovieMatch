from random import randint
from django.db import IntegrityError
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.urls import reverse
from list_builder.models import Persona, SavedMovieList
# from app_login_and_reg.models import User
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .persona_assigner import get_or_set_persona
from .moviedb_api_caller import add_movies_to_db_from_tmdb_ids

# Displays main page
def index(request):
    this_persona = get_or_set_persona(request)
    return render(request, 'list_builder/index.html')

def save(request):
    response = {"status": "failure"}

    if not request.user.is_authenticated:
        response.update({"errors" : "Only logged in users can be saved."})

    else:
        data = json.loads(request.body)
        list_name = data.get("list_name")
        movie_ids = data.get("movie_ids")

        if not movie_ids:
            response.update({"errors" : "Cannot save empty list."})
        else:
            try:
                this_persona = get_or_set_persona(request)
                print("All in DB!" if all_in_db else f'Failed: {list(failed_ids)}')
                saved_list = SavedMovieList.objects.create_from_tmdb_ids(movie_ids=ids_in_db, creator=this_persona, list_name=list_name)
                response.update({"status" : "success"})
            except Exception as err:
                print(err)
                response.update({"errors" : repr(err)})

    return JsonResponse(response)