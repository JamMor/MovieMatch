import json
from django.core.serializers.json import DjangoJSONEncoder
from django.core import serializers
from list_builder.models import Persona, Movie
from list_builder.models import SavedMovieList
from django.db.models import Prefetch
from django.forms.models import model_to_dict

def MovieListEncoder(movie_list):
    """
    Takes a list of Movie model objects and returns a json serializable list.
    """
        
    json_movie_list = []
    for movie in movie_list:
        json_movie_list.append(
            model_to_dict(movie,
                fields=['tmdb_id', 'title', 'overview', 'poster_path', 'release_date']
        ))

    return json_movie_list