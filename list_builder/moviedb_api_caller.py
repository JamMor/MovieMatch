from list_builder.models import Movie
import requests

def add_movies_to_db_from_tmdb_ids(tmdb_id_list):
    """
    Takes a list of movieDB ID's as integers, and checks which are in local DB.
    Ones that aren't in local database have info retrieved by API call to movieDB,
    and added to local DB.

    Returns tuple: Whether all movies were saved, id's saved, id's not saved.
    """
    api_key = "f4f5f258379baf10796e1d3aeb5add05"

    #Determines which movies are not in local DB
    tmdb_id_set = set(tmdb_id_list)
    tmdb_ids_in_db = set(Movie.objects.filter(
        tmdb_id__in=tmdb_id_set).values_list("tmdb_id", flat=True))
    tmdb_ids_not_in_db = tmdb_id_set - tmdb_ids_in_db
    
    new_movie_list = []

    #Retrieves info for each movie not in local DB
    for tmdb_id in tmdb_ids_not_in_db:
        response = requests.get(
            f'https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={api_key}&language=en-US')
        
        if response.status_code == requests.codes.ok:
            data = response.json()

            new_movie_list.append(
                Movie(tmdb_id = data.get("id"),
                      title = data.get("title"),
                      overview = data.get("overview"),
                      poster_path = data.get("poster_path"),
                      release_date = data.get("release_date")
                      )
            )

        else:
            print(f'Could not retrieve data for: {tmdb_id}')
            print(response.json())

    #Saves movies with retrieved data to DB
    try:
        Movie.objects.bulk_create(new_movie_list)
        print(("Added to DB:"+", ".join(movie.title for movie in new_movie_list))
              if new_movie_list
              else "Nothing added to DB.")
        tmdb_ids_in_db.update([movie.tmdb_id for movie in new_movie_list])
    except Exception as err:
        print("Movie bulk creation failed.")
        print(err)
    
    if tmdb_id_set == tmdb_ids_in_db:
        return True, tmdb_ids_in_db, []
    else:
        return False, tmdb_ids_in_db, tmdb_id_set - tmdb_ids_in_db