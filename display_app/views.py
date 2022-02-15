from django.shortcuts import render
from django.http import JsonResponse
from .models import Movie, MovieList, SharedList
from app_login_and_reg.models import User
import json

#Saves a new MovieList of movies, adding any movies that aren't already in database
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
# Displays main page
def index(request):
    return render(request, 'display_app/index.html')

# Creates new SharedList, or adds to already existing one.
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

#Pushes updated share list data to clients
def update_shared(request):
    response = {}
    data = json.loads(request.body)
    print("Data from update POST: ", data)
    shared_list = SharedList.objects.get(id=data['sharecode'])
    
    #Updates to users of ShareList
    shared_users = shared_list.users.split(",")
    print(shared_users)
    if len(shared_users) > data['user_num']:
        print("New users!")
        response['new_users'] = shared_users[data['user_num']:]
    
    #Updates to movies in ShareList
    shared_ids = list(shared_list.movies.values_list("movie_id", flat=True))
    movie_ids = data['movie_ids']
    added_ids = list((set(shared_ids).difference(movie_ids)))
    print("IDs that have been added: ", added_ids)
    added = list(Movie.objects.filter(movie_id__in=added_ids).values("movie_id", "title", "release_date", "poster"))
    deleted_ids = list((set(movie_ids).difference(shared_ids)))
    print("IDs that have been deleted: ", deleted_ids)
    if len(added) > 0:
        response['added'] = added
        
        #updates to matching selections when new user adds movies AKA chosen
        matched_ids = list(set(shared_ids).intersection(movie_ids))
        print("Movies have been added. Here are the ones that already exist: ==================================================")
        for each_id in matched_ids:
            print(Movie.objects.get(movie_id=each_id))
        if len(matched_ids) > 0:
            response['chosen'] = matched_ids

    if len(deleted_ids) > 0:
        response['deleted'] = deleted_ids

    # print("Update Data to client: ",response)
    return JsonResponse(response)

def delete_shared(request):
    data = json.loads(request.body)
    print("I DARE YOU TO DELETE ME: ",data["to_delete"])
    delete_movie = Movie.objects.get(movie_id=data["to_delete"][6:])
    share_list = SharedList.objects.get(id=data["sharecode"])
    share_list.movies.remove(delete_movie)
    return JsonResponse({"status":"deleted"})