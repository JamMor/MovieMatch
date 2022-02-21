import json
import shortuuid
from django.db import models

# Create your models here.
class Movie(models.Model):
    movie_id = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    description = models.TextField()
    poster = models.CharField(max_length=255)
    release_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class SavedMovieList(models.Model):
    list_name = models.CharField(max_length=255, null=True)
    created_by = models.ForeignKey('app_login_and_reg.User', related_name="saved_lists", on_delete = models.CASCADE, null=True)
    movies = models.ManyToManyField(Movie, related_name="in_saved_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class TempMovieList(models.Model):
    # created_by will have a base 57 encoded uuid
    created_by = models.CharField(max_length=255, null=True)
    movies = models.ManyToManyField(Movie, related_name="in_temp_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class SharedMovieList(models.Model):
    sharecode = models.CharField(max_length=255, unique=True, default=shortuuid.uuid()[:9])
    # users will have a list of base 57 encoded uuid
    users = models.TextField(default='[]')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def set_users(self, x):
        self.users = json.dumps(x)
    def get_users(self):
        return json.loads(self.users)

class SharedMovie(models.Model):
    # submitted_by will be a list of base 57 encoded uuids
    submitted_by = models.TextField(default='[]')
    shared_list = models.ForeignKey(SharedMovieList, related_name="shared_movies", on_delete = models.CASCADE, null=True)
    movie = models.ForeignKey(Movie, related_name="shared_movies", on_delete = models.CASCADE, null=True)

    def set_submitted_by(self, x):
        self.submitted_by = json.dumps(x)
    def get_submitted_by(self):
        return json.loads(self.submitted_by)

    def __str__(self):
        return self.movie.title

# class Friends(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     friends_of = models.ManyToManyField('User', related_name="friends")
#     friend_requests = 


# class Recommendations(models.Model):
#     movies = models.ManyToManyField('Movie', related_name="in_lists")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)