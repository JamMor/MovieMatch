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

class MovieList(models.Model):
    list_name = models.CharField(max_length=255, null=True)
    created_by = models.ForeignKey('app_login_and_reg.User', related_name="created_lists", on_delete = models.CASCADE, null=True)
    movies = models.ManyToManyField(Movie, related_name="in_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class SharedList(models.Model):
    users = models.TextField()
    movies = models.ManyToManyField(Movie, related_name="in_shared_lists")
    chosen = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# class Friends(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     friends_of = models.ManyToManyField('User', related_name="friends")
#     friend_requests = 


# class Recommendations(models.Model):
#     movies = models.ManyToManyField('Movie', related_name="in_lists")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)