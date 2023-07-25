import json
from django.core.serializers.json import DjangoJSONEncoder
from list_builder.models import Persona, Movie
from elimination_room.models import SharedMovieList, SharedMovie, ShareRoomUser
from django.db.models import Prefetch
from django.forms.models import model_to_dict

def SharedListEncoder(sharecode):
    """
    Takes a SharedList sharecode and returns a json serializable dictionary of 
    shared list with associated users and shared movies.
    Return is not already serialized.
    """
    active_queryset = ShareRoomUser.objects.filter(is_active = True)
    shared_list = SharedMovieList.objects.prefetch_related(
                # Prefetch('contributors', to_attr='pre_contributors'), 
                Prefetch('room_users', queryset=active_queryset, to_attr='pre_active_room_users'), 
                Prefetch('pre_active_room_users__persona', to_attr='pre_persona'), 
                Prefetch('shared_movies', to_attr='pre_shared_movies'), 
                Prefetch('pre_shared_movies__submitted_by', to_attr='pre_submitted_by')).get(sharecode = sharecode)
    
    active_user_dict = {
        room_user.pre_persona.uuid : { 
            'position' : room_user.position,
            'nickname' : room_user.nickname,
            }
        for room_user in shared_list.pre_active_room_users}
    
    movie_list = []
    for shared_movie in shared_list.pre_shared_movies:
        movie_info = model_to_dict(shared_movie.movie,
                fields=['tmdb_id', 'title', 'overview', 'poster_path', 'release_date']
        )
        movie_info['shared_movie_id'] = shared_movie.id
        movie_info['is_eliminated'] = shared_movie.is_eliminated
        movie_info['submitted_by'] = list(persona.uuid for persona in shared_movie.pre_submitted_by)
        movie_list.append(movie_info)
        
    json_dict = {
        'active_user_dict' : active_user_dict,
        'movie_list' : movie_list,
        'is_active' : shared_list.is_active
        }

    if (shared_list.is_active) & (shared_list.turn > 0):
        # selects the user whose position equals the shared_list.turn
        # and returns the uuid of the persona associated with that user
        eliminator_uuid = None
        for room_user in shared_list.pre_active_room_users:
            if room_user.position == shared_list.turn:
                eliminator_uuid = room_user.pre_persona.uuid
                break
        if eliminator_uuid != None:
            json_dict['eliminating_uuid'] = eliminator_uuid

    return json_dict