from list_builder.models import Movie
import requests

def movie_updater(movie_id_list):
    api_key = "f4f5f258379baf10796e1d3aeb5add05"

    movie_id_set = set(movie_id_list)
    movies_in_db = set(Movie.objects.filter(
        movie_id__in=movie_id_set).values_list("movie_id", flat=True))
    movies_not_in_db = movie_id_set - movies_in_db
    
    print("In DB: ", movies_in_db)
    print("Not in DB: ", movies_not_in_db)

    for movie_id in movies_not_in_db:
        print(f'FOR: {movie_id}')
        print(f'URL = https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}&language=en-US')
        response = requests.get(
            f'https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}&language=en-US')
        print(response.status_code)
        
        if response.status_code == requests.codes.ok:
            print(response.json().get('title'))
        else:
            print(response.json())

    print("Done querying movies.")
    return