from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

from list_builder.forms import SavedMovieListForm
from list_builder.models import TempMovieList
from list_builder.moviedb_api_caller import add_movies_to_db_from_tmdb_ids
from list_builder.persona_assigner import get_or_set_persona
from movie_match.json_response_models import (
    FailedFormResponse,
    SuccessJsonClassObject,
)

from .forms import EliminationSessionUserForm, MovieTmdbIdsForm, SharecodeForm
from .models import EliminationSession, EliminationSessionUser


# When Elimination Session is updated, sends update command to appropriate channel
def update_elimination_session_channels(sharecode):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        print("No channel layer.")
        return

    group_name = 'match_%s' % sharecode
    async_to_sync(channel_layer.group_send)(
        group_name,
        {"type": "update_message"})
    print("Send update elimination session command.")


# Views
@require_POST
def submit_to_elimination_session(request):
    this_persona = get_or_set_persona(request)

    elimination_user_form = EliminationSessionUserForm(request.POST, prefix="share")
    sharecode_form = SharecodeForm(request.POST, prefix="share")
    movie_tmdb_ids_form = MovieTmdbIdsForm(request.POST)

    elimination_user_form.is_valid()
    sharecode_form.is_valid()
    movie_tmdb_ids_form.is_valid()

    if not (elimination_user_form.is_valid() and sharecode_form.is_valid() and movie_tmdb_ids_form.is_valid()):
        failed_form = FailedFormResponse()
        for form in [elimination_user_form, sharecode_form]:
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
    # Gets EliminationSession if sharecode, or creates new one
    if sharecode:
        try:
            elimination_session = EliminationSession.objects.get(sharecode=sharecode)
        except EliminationSession.DoesNotExist as err:
            print(err)
            sharecode_form.add_error('sharecode', 'Sharecode not found.')
            return JsonResponse(FailedFormResponse(form_errors=sharecode_form.errors).to_dict())
    else:
        try:
            elimination_session = EliminationSession.objects.create(created_by=this_persona)
        except IntegrityError as err:
            print(err)
            sharecode_form.add_error(None, 'Server error: Could not create Elimination Session.')
            return JsonResponse(FailedFormResponse(form_errors=sharecode_form.errors).to_dict())

    tmdb_ids = movie_tmdb_ids_form.cleaned_data['tmdb_ids']
    try:
        # Create temp_list from tmdb_ids
        all_in_db, ids_in_db, failed_ids = add_movies_to_db_from_tmdb_ids(tmdb_ids)
        print("All in DB!" if all_in_db else f'Failed: {list(failed_ids)}')
        temp_list = TempMovieList.objects.create_from_tmdb_ids(
            tmdb_ids=ids_in_db, creator=this_persona)

        # Add TempList movies to EliminationSession
        elimination_session.add_movie_list(temp_list)
    except Exception as err:
        print(err)
        movie_tmdb_ids_form.add_error(
            None, 'Server error: Could not add your list to Elimination Session.')
        return JsonResponse(FailedFormResponse(form_errors=movie_tmdb_ids_form.errors).to_dict())

    # Push updates to channel users.
    update_elimination_session_channels(elimination_session.sharecode)

    nickname = elimination_user_form.cleaned_data['nickname']

    # Create or Update EliminationSessionUser for this user with nickname
    EliminationSessionUser.objects.update_or_create(
        persona=this_persona,
        elimination_session=elimination_session,
        defaults={"nickname": nickname}
    )

    return JsonResponse(SuccessJsonClassObject(data={"sharecode": elimination_session.sharecode}).to_dict())


@require_GET
def join_elimination_session(request, sharecode):
    this_persona = get_or_set_persona(request)
    # Tests to see if sharecode is exists
    if EliminationSession.objects.filter(sharecode=sharecode).exists():
        context = {
            'sharecode': sharecode,
            'uuid': this_persona.uuid,
            'savedmovielist_form': SavedMovieListForm(prefix="save"),
        }
        return render(request, 'elimination_room/match.html', context)
    else:
        return redirect(reverse('list_builder:default_redirect'))
