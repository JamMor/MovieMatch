import json
from django.core.serializers.json import DjangoJSONEncoder
from .models import SharedMovieList, SharedMovie, UserUUID, Movie
from django.db.models import Prefetch

def SharedListEncoder(sharecode):
    shared_list = SharedMovieList.objects.prefetch_related(
                Prefetch('users', to_attr='pre_users'), 
                Prefetch('shared_movies', to_attr='pre_shared_movies'), 
                Prefetch('pre_shared_movies__submitted_by', to_attr='pre_submitted_by')).get(sharecode = sharecode)
    
    user_list = list({'uuid' : user.uuid, 'nickname' : user.nickname} for user in shared_list.pre_users)
    
    movie_list = []
    for shared_movie in shared_list.pre_shared_movies:
        movie_info = shared_movie.movie.__dict__
        del movie_info['_state']
        del movie_info['id']
        movie_info['shared_movie_id'] = shared_movie.id
        movie_info['is_eliminated'] = shared_movie.is_eliminated
        movie_info['submitted_by'] = list(user.uuid for user in shared_movie.pre_submitted_by)
        movie_list.append(movie_info)
        
    json_dict = {
        'user_list' : user_list, 
        'movie_list' : movie_list
        }

    return json_dict