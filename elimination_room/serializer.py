from django.db.models import Prefetch
from django.forms.models import model_to_dict

from .models import EliminationSession, EliminationSessionUser, SharedMovie


def elimination_session_encoder(sharecode):
    """
    Takes a EliminationSession sharecode and returns a json serializable dictionary of 
    the session consisting of active state, active users, and shared movies.
    Return is not already serialized.
    """
    session_users_prefetch = Prefetch('session_users', queryset=EliminationSessionUser.objects.filter(
        is_active=True).select_related('persona'))
    shared_movies_prefetch = Prefetch(
        'shared_movies', queryset=SharedMovie.objects.select_related('movie'))
    submitted_by_prefetch = Prefetch('shared_movies__submitted_by')

    elimination_session = EliminationSession.objects.prefetch_related(
        session_users_prefetch,
        shared_movies_prefetch,
        submitted_by_prefetch
    ).get(sharecode=sharecode)

    active_user_dict = {
        session_user.persona.uuid: {
            'position': session_user.position,
            'nickname': session_user.nickname,
        }
        for session_user in elimination_session.session_users.all()}

    movie_list = []
    for shared_movie in elimination_session.shared_movies.all():
        movie_info = model_to_dict(shared_movie.movie,
                                   fields=[
                                       'tmdb_id',
                                       'title',
                                       'overview',
                                       'poster_path',
                                       'release_date'
                                   ])
        movie_info['shared_movie_id'] = shared_movie.id
        movie_info['is_eliminated'] = shared_movie.is_eliminated
        movie_info['submitted_by'] = list(
            persona.uuid for persona in shared_movie.submitted_by.all())
        movie_list.append(movie_info)

    json_dict = {
        'active_user_dict': active_user_dict,
        'movie_list': movie_list,
        'is_active': elimination_session.is_active
    }

    if (elimination_session.is_active) & (elimination_session.turn > 0):
        # selects the user whose position equals the elimination_session.turn
        # and returns the uuid of the persona associated with that user
        eliminator_uuid = None
        for session_user in elimination_session.session_users.all():
            if session_user.position == elimination_session.turn:
                eliminator_uuid = session_user.persona.uuid
                break
        if eliminator_uuid != None:
            json_dict['eliminating_uuid'] = eliminator_uuid

    return json_dict
