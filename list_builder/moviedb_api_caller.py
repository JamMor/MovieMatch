from list_builder.models import Movie
import requests

def add_movies_to_db_from_tmdb_ids(movie_id_list):
    """
    Takes a list of movieDB ID's as integers, and checks which are in local DB.
    Ones that aren't in local database have info retrieved by API call to movieDB,
    and added to local DB.

    Returns tuple: Whether all movies were saved, id's saved, id's not saved.
    """
    api_key = "f4f5f258379baf10796e1d3aeb5add05"

    #Determines which movies are not in local DB
    movie_id_set = set(movie_id_list)
    movies_in_db = set(Movie.objects.filter(
        movie_id__in=movie_id_set).values_list("movie_id", flat=True))
    movies_not_in_db = movie_id_set - movies_in_db
    
    new_movie_list = []

    #Retrieves info for each movie not in local DB
    for movie_id in movies_not_in_db:
        response = requests.get(
            f'https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}&language=en-US')
        
        if response.status_code == requests.codes.ok:
            data = response.json()

            new_movie_list.append(
                Movie(movie_id = data.get("id"),
                      title = data.get("title"),
                      overview = data.get("overview"),
                      poster_path = data.get("poster_path"),
                      release_date = data.get("release_date")
                      )
            )

        else:
            print(f'Could not retrieve data for: {movie_id}')
            print(response.json())

    #Saves movies with retrieved data to DB
    try:
        Movie.objects.bulk_create(new_movie_list)
        print(("Added to DB:"+", ".join(movie.title for movie in new_movie_list))
              if new_movie_list
              else "Nothing added to DB.")
        movies_in_db.update([movie.movie_id for movie in new_movie_list])
    except Exception as err:
        print("Movie bulk creation failed.")
        print(err)
    
    if movie_id_set == movies_in_db:
        return True, movies_in_db, []
    else:
        return False, movies_in_db, movie_id_set - movies_in_db