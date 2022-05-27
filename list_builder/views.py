from random import randint
from django.db import IntegrityError
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.db.models import Count

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

@login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')
def list_manager(request):
    this_persona = get_or_set_persona(request)

    saved_lists = SavedMovieList.objects.filter(created_by = this_persona
        ).prefetch_related('movies').all()

    context = {
        "saved_lists" : list(saved_lists)
    }
    return render(request, 'list_builder/list_manager.html', context)

def save(request):
    response = {"status": "failure"}

    if not request.user.is_authenticated:
        response.update({"errors" : "Only logged in users can be saved."})

    else:
        data = json.loads(request.body)
        list_name = data.get("list_name")
        tmdb_ids = data.get("tmdb_ids")

        if not tmdb_ids:
            response.update({"errors" : "Cannot save empty list."})
        else:
            try:
                this_persona = get_or_set_persona(request)
                all_in_db, ids_in_db, failed_ids = add_movies_to_db_from_tmdb_ids(tmdb_ids)
                print("All in DB!" if all_in_db else f'Failed: {list(failed_ids)}')
                saved_list = SavedMovieList.objects.create_from_tmdb_ids(tmdb_ids=ids_in_db, creator=this_persona, list_name=list_name)
                response.update({"status" : "success"})
            except Exception as err:
                print(err)
                response.update({"errors" : repr(err)})

    return JsonResponse(response)

def delete(request, list_id):
    response = {"status": "failure"}

    if not request.user.is_authenticated:
        response.update({"errors" : "Only logged in users can delete list."})

    else:
        try:
            this_persona = get_or_set_persona(request)
            saved_list = SavedMovieList.objects.get(id = list_id, created_by = this_persona)
            list_name = saved_list.list_name
            deleted_data = saved_list.delete()
            print("deleted_data:")
            print(deleted_data)
            response.update({"status" : "success", "data" : list_name})
        except Exception as err:
            print(err)
            response.update({"errors" : repr(err)})

    return JsonResponse(response)

#Display sample icons
def test(request):
    return render(request,'list_builder/test.html')