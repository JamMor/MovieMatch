import json
from django.core.serializers.json import DjangoJSONEncoder
from list_builder.models import Persona, Movie
from elimination_room.models import SharedMovieList, SharedMovie, ShareRoomUser
from django.db.models import Prefetch

def SharedListEncoder(sharecode):
    active_queryset = ShareRoomUser.objects.filter(is_active = True)
    shared_list = SharedMovieList.objects.prefetch_related(
                # Prefetch('contributors', to_attr='pre_contributors'), 
                Prefetch('room_users', queryset=active_queryset, to_attr='pre_active_room_users'), 
                Prefetch('pre_active_room_users__persona', to_attr='pre_persona'), 
                Prefetch('shared_movies', to_attr='pre_shared_movies'), 
                Prefetch('pre_shared_movies__submitted_by', to_attr='pre_submitted_by')).get(sharecode = sharecode)
    
    # contributor_list = list({'uuid' : user.uuid, 'nickname' : user.nickname} for user in shared_list.pre_contributors)
    # active_user_list = list(
    #     {
    #         'uuid' : user.pre_uuid.uuid, 
    #         'nickname' : user.pre_uuid.nickname, 
    #         'is_ready' : user.is_ready
    #     } 
    #     for user in shared_list.pre_active_users)
    active_user_dict = {
        persona.pre_persona.uuid : { 
            'nickname' : persona.nickname, 
            'is_users_turn' : persona.is_users_turn
            }
        for persona in shared_list.pre_active_room_users}
    
    movie_list = []
    for shared_movie in shared_list.pre_shared_movies:
        movie_info = shared_movie.movie.__dict__
        del movie_info['_state']
        del movie_info['id']
        movie_info['shared_movie_id'] = shared_movie.id
        movie_info['is_eliminated'] = shared_movie.is_eliminated
        movie_info['submitted_by'] = list(persona.uuid for persona in shared_movie.pre_submitted_by)
        movie_list.append(movie_info)
        
    json_dict = {
        'active_user_dict' : active_user_dict,
        'movie_list' : movie_list
        }

    return json_dict