from random import randint
from django.db import IntegrityError
from django.shortcuts import redirect, render
from django.views.decorators.http import require_GET, require_POST
from django.http import JsonResponse
from django.urls import reverse
from list_builder.models import Persona, Movie, TempMovieList
from elimination_room.models import SharedMovieList, SharedMovie, ShareRoomUser
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from list_builder.persona_assigner import get_or_set_persona
from list_builder.moviedb_api_caller import add_movies_to_db_from_tmdb_ids
from movie_match.json_response_models import SuccessJsonClassObject, FailedJsonClassObject, FailedFormResponse
from .forms import SharecodeForm, ShareRoomUserForm, MovieTmdbIdsForm

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
@require_POST
def new_match(request):
    this_persona = get_or_set_persona(request)
    
    shareroomuser_form = ShareRoomUserForm(request.POST, prefix="share")
    sharecode_form = SharecodeForm(request.POST, prefix="share")
    movie_tmdb_ids_form = MovieTmdbIdsForm(request.POST)

    shareroomuser_form.is_valid()
    sharecode_form.is_valid()
    movie_tmdb_ids_form.is_valid()

    if not (shareroomuser_form.is_valid() and sharecode_form.is_valid() and movie_tmdb_ids_form.is_valid()):
        failed_form = FailedFormResponse()
        for form in [shareroomuser_form, sharecode_form]:
            if not form.is_valid():
                failed_form.combine_form_errors(
                    form_error_dict=form.errors,
                    prefix=form.prefix
                )
        # Assign any movie id errors as non-field errors
        if not movie_tmdb_ids_form.is_valid():
            for error in movie_tmdb_ids_form.errors.values():
                failed_form.add_to_field_errors('__all__', error)
        return JsonResponse(failed_form.to_dict())

    sharecode = sharecode_form.cleaned_data['sharecode']
    #Gets SharedList if sharecode, or creates new one
    if sharecode:
        try:
            shared_list = SharedMovieList.objects.get(sharecode = sharecode)
        except SharedMovieList.DoesNotExist as err:
            print(err)
            sharecode_form.add_error('sharecode', 'Sharecode not found.')
            return JsonResponse(FailedFormResponse(form_errors=sharecode_form.errors).to_dict())
    else:
        try:
            shared_list = SharedMovieList.objects.create(created_by = this_persona)
        except IntegrityError as err:
            print(err)
            sharecode_form.add_error(None, 'Server error: Could not create Elimination Room.')
            return JsonResponse(FailedFormResponse(form_errors=sharecode_form.errors).to_dict())

    tmdb_ids = movie_tmdb_ids_form.cleaned_data['tmdb_ids']
    try:
        # Create temp_list from tmdb_ids
        all_in_db, ids_in_db, failed_ids = add_movies_to_db_from_tmdb_ids(tmdb_ids)
        print("All in DB!" if all_in_db else f'Failed: {list(failed_ids)}')
        temp_list = TempMovieList.objects.create_from_tmdb_ids(tmdb_ids=ids_in_db, creator=this_persona)
        
        # Add TempList movies to SharedList
        shared_list.add_list_to_shared_list(temp_list)
    except Exception as err:
        print(err)
        movie_tmdb_ids_form.add_error(None, 'Server error: Could not add your list to Elimination Room.')
        return JsonResponse(FailedFormResponse(form_errors=movie_tmdb_ids_form.errors).to_dict())
    
    #Push updates to channel users.
    update_shared_list_channels(shared_list.sharecode)

    nickname = shareroomuser_form.cleaned_data['nickname']
    #Create or Update ShareRoomUser for this user with nickname
    ShareRoomUser.objects.update_or_create(
        persona = this_persona, 
        list = shared_list,
        defaults = {"nickname": nickname}
        )

    return JsonResponse(SuccessJsonClassObject(data={"sharecode": shared_list.sharecode}).to_dict())

@require_GET
def join_match(request, sharecode):
    this_persona = get_or_set_persona(request)
    #Tests to see if sharecode is exists
    if SharedMovieList.objects.filter(sharecode = sharecode).exists():
        context = {
            'sharecode' : sharecode,
            'uuid' : this_persona.uuid
            }
        return render(request, 'elimination_room/match.html', context)
    else:
        return redirect(reverse('list_builder:default_redirect'))