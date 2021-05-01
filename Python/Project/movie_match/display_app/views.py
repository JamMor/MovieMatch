from django.shortcuts import render
from django.http import JsonResponse
from .models import Movie, MovieList, SharedList
from app_login_and_reg.models import User
import json

def save_list(post_data):
    print("We in ya save function")
    new_list = MovieList.objects.create()
    print("New List created! ID: ", new_list.id)
    for this_movie in post_data:
        print("about to create: ", this_movie["title"])
        new_movie, created = Movie.objects.get_or_create(
            movie_id = this_movie["id"],
            title = this_movie["original_title"],
            description = this_movie["overview"],
            poster = this_movie["poster_path"],
            release_date = this_movie["release_date"]
        )
        if created:
            print ("New Movie: ", this_movie["title"])
        elif not created:
            print ("Already Exists: ", this_movie["title"])
        print("About to add movie to list...")
        new_list.movies.add(new_movie)
        print(this_movie["title"], " added to list!")
    return new_list.id

# Create your views here.
def index(request):
    return render(request, 'index.html')

def new_list(request):
    data = json.loads(request.body)
    print (data)
    list_id = save_list(data['results'])
    print("We made it out of the save function. Hooray!")

    if len(data['sharecode']) == 0:
        print("No share code")
        request.session["order"] = 1
        if len(data['nickname']) > 0:
            nickname = data['nickname']
        else:
            nickname = "User 1"
        shared_list = SharedList.objects.create(users = "turn*"+nickname)

        chosen =[]
        for movie in MovieList.objects.get(id=list_id).movies.all():
            shared_list.movies.add(movie)
            chosen.append(movie.movie_id + ",1")
        shared_list.chosen = ",".join(chosen)
        print("Chosen List: ", shared_list.chosen)
        print("Shared movies: ", shared_list.movies.all())

    else:
        print("Has share code")
        shared_list = SharedList.objects.get(id=data['sharecode'])
        user_num = len(shared_list.users.split(',')) + 1
        request.session["order"]= user_num
        if len(data['nickname']) > 0:
            nickname = data['nickname']
        else:
            nickname = "User "+str(user_num)
        shared_list.users = shared_list.users + ",wait*"+nickname

        chosen = shared_list.chosen.split(",")
        for movie in MovieList.objects.get(id=list_id).movies.all():
            if movie in shared_list.movies.all():
                for i in range(0,len(chosen),2):
                    if chosen[i] == movie.movie_id:
                        chosen[i+1] = str(int(chosen[i+1])+1)
                        break
            else:
                shared_list.movies.add(movie)
                chosen.extend([movie.movie_id,"1"])

        shared_list.chosen = ",".join(chosen)
        print("Chosen List: ", shared_list.chosen)
        print("Shared movies: ", shared_list.movies.all())

    shared_list.save()

    shared_movies = list(shared_list.movies.values("movie_id", "title", "release_date", "poster"))
    print("Shared movies listified: ", shared_movies)
    return JsonResponse({"sharecode":shared_list.id, "users":shared_list.users, "order":request.session["order"], "chosen":shared_list.chosen, "movies":shared_movies}, safe=False)

def update_shared(request):
    response = {}
    data = json.loads(request.body)
    print("Data from update POST: ", data)
    shared_list = SharedList.objects.get(id=data['sharecode'])
    shared_users = shared_list.users.split(",")
    print(shared_users)
    if len(shared_users) > data['user_num']:
        print("New users!")
        response['new_users'] = shared_users[data['user_num']:]
    
    shared_ids = list(shared_list.movies.values_list("movie_id", flat=True))
    print("Current Shared List ID's: ",shared_ids)
    movie_ids = data['movie_ids']
    print("Current Client ID's: ", movie_ids)
    added_ids = list((set(shared_ids).difference(movie_ids)))
    print("IDs that have been added: ", added_ids)
    added = list(Movie.objects.filter(movie_id__in=added_ids).values("movie_id", "title", "release_date", "poster"))
    print("List of added movie values: ", added)
    deleted_ids = list((set(movie_ids).difference(shared_ids)))
    print("IDs that have been deleted: ", deleted_ids)
    # deleted = list(Movie.objects.filter(id__in=deleted_ids).values("movie_id", "title", "release_date", "poster"))

    if len(added) > 0:
        response['added'] = added
    if len(deleted_ids) > 0:
        response['deleted'] = deleted_ids

    print("We made it to the return at least!")
    print(response)
    return JsonResponse(response)

def delete_shared(request):
    data = json.loads(request.body)
    print("I DARE YOU TO DELETE ME: ",data["to_delete"])
    delete_movie = Movie.objects.get(movie_id=data["to_delete"][6:])
    share_list = SharedList.objects.get(id=data["sharecode"])
    share_list.movies.remove(delete_movie)
    return JsonResponse({"status":"deleted"})