from random import randint
from django.db import IntegrityError
from django.shortcuts import redirect, render
from django.http import HttpResponseNotAllowed, JsonResponse
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.db.models import Prefetch
from django.core import serializers
from django.urls import reverse

from list_builder.models import Persona, SavedMovieList, Movie
# from app_login_and_reg.models import User
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .persona_assigner import get_or_set_persona
from .moviedb_api_caller import add_movies_to_db_from_tmdb_ids
from movie_match.json_response_models import SuccessJsonClassObject, FailedJsonClassObject

# Displays main page
def index(request):
    this_persona = get_or_set_persona(request)
    return render(request, 'list_builder/list_builder_creator.html')

@login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')
def list_manager(request):
    this_persona = get_or_set_persona(request)

    saved_lists = SavedMovieList.objects.filter(created_by = this_persona
        ).prefetch_related('movies').all()

    context = {
        "saved_lists" : list(saved_lists)
    }
    return render(request, 'list_builder/list_manager.html', context)

@login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')
def edit(request, list_id):
    this_persona = get_or_set_persona(request)
    saved_list = SavedMovieList.objects.get(id = list_id, created_by = this_persona)
    movie_list = Movie.objects.filter(
        in_savedmovielists = saved_list).values(
        'tmdb_id', 'title', 'overview', 'poster_path', 'release_date')
    
    context = {"saved_list" : saved_list, "movie_list" : list(movie_list)}
    return render(request, 'list_builder/list_builder_editor.html', context)

def save(request, list_id = None):
    if not request.method == "POST":
        return HttpResponseNotAllowed(["POST"])

    if not request.user.is_authenticated:
        return JsonResponse(FailedJsonClassObject(errors=["Only logged in users can save."]).to_dict())

    # If user is authenticated, try adding movies to db and saving list.
    data = json.loads(request.body)
    list_name = data.get("list_name")
    tmdb_ids = data.get("tmdb_ids")

    if not tmdb_ids:
        return JsonResponse(FailedJsonClassObject(errors=["Cannot save empty list."]).to_dict())
    
    try:
        this_persona = get_or_set_persona(request)
        all_in_db, ids_in_db, failed_ids = add_movies_to_db_from_tmdb_ids(tmdb_ids)
        print("All in DB!" if all_in_db else f'Failed: {list(failed_ids)}')
        response_data = {}
        # If no list_id provided, then save a new list.
        if not list_id:
            saved_list = SavedMovieList.objects.create_from_tmdb_ids(tmdb_ids=ids_in_db, creator=this_persona, list_name=list_name)
        # If list_id provided, overwrite that list.
        else:
            # Only gets list if also created by this user.
            saved_list = SavedMovieList.objects.get(id=list_id, created_by=this_persona)
            new_ids =list(Movie.objects.filter(tmdb_id__in=ids_in_db).values_list("id", flat=True))
            saved_list.movies.set(new_ids)
            response_data = {"nextUrl" : reverse('list_builder:list_manager')}
        response_data.update({"list_name" : saved_list.display_name})
        return JsonResponse(SuccessJsonClassObject(data=response_data).to_dict())
    except Exception as err:
        print(err)
        return JsonResponse(FailedJsonClassObject(errors=["An error occured attempting to save the list."]).to_dict())

def delete(request, list_id):
    if not request.method == "DELETE":
        return HttpResponseNotAllowed(["DELETE"])

    if not request.user.is_authenticated:
        return JsonResponse(FailedJsonClassObject(errors=["Only logged in users can delete list."]).to_dict())

    try:
        this_persona = get_or_set_persona(request)
        saved_list = SavedMovieList.objects.get(id = list_id, created_by = this_persona)
        list_name = saved_list.list_name
        list_id = saved_list.id
        deleted_data = saved_list.delete()
        print("deleted_data:")
        print(deleted_data)
        return JsonResponse(SuccessJsonClassObject(data={"list_name" : list_name, "list_id" : list_id}).to_dict())
    except Exception as err:
        print(err)
        return JsonResponse(FailedJsonClassObject(errors=["An error occured attempting to delete the list."]).to_dict())
    
def get_list(request, list_id):
    this_persona = get_or_set_persona(request)
    try:
        saved_list = SavedMovieList.objects.get(id = list_id, created_by = this_persona)
    except:
        return JsonResponse(FailedJsonClassObject(errors=["Could not find list."]).to_dict())
    movie_list = Movie.objects.filter(
        in_savedmovielists = saved_list).values(
        'tmdb_id', 'title', 'overview', 'poster_path', 'release_date')

    return JsonResponse(SuccessJsonClassObject(data={"movies" : list(movie_list)}).to_dict())

@login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')
def get_list_overview(request):
    this_persona = get_or_set_persona(request)

    #Get page number,and sort parameter from request.
    page_num = int(request.GET.get("page", 1))
    sort_param = request.GET.get("sort", "updated-at:desc").split(":")
    sort_field = sort_param[0]
    sort_order = sort_param[1]

    order_keys = {
        "updated-at" : "updated_at",
        "name" : "list_name",
        "count" : "movie_count",
        "created-at" : "created_at"
    }

    order_field = order_keys.get(sort_field, "updated_at")
    order_field = f"-{order_field}" if sort_order == "desc" else order_field

    items_per_page = 10
    startIndex = (page_num - 1) * items_per_page
    endIndex = startIndex + items_per_page
    
    #Count of all saved movie lists created by this user.
    num_saved_lists = SavedMovieList.objects.filter(
        created_by = this_persona
        ).count()
    
    #Get saved lists created by this user with the titles of their movies.
    movie_prefetch = Prefetch('movies', queryset=Movie.objects.only('title'), to_attr='movie_titles')
    saved_lists = SavedMovieList.objects.filter(
        created_by = this_persona
        ).annotate(movie_count=Count("movies") ).order_by(order_field).only('list_name').prefetch_related(movie_prefetch)[startIndex:endIndex]
    
    data = {
        "page_number" : page_num,
        "items_per_page" : items_per_page,
        "total_count" : num_saved_lists
    }

    lists = {}
    for saved_list in saved_lists:
        lists[saved_list.id] = {
            "list_id": saved_list.id,
            "list_name": saved_list.list_name,
            "movie_count": saved_list.movie_count,
            "movies": [movie.title for movie in saved_list.movie_titles]
        }

    data.update({"lists" : lists})
    
    return JsonResponse(SuccessJsonClassObject(data=data).to_dict())