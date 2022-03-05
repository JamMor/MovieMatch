import json
import shortuuid
from django.db import IntegrityError, models, transaction

# Create your models here.
class UserUUID(models.Model):
    uuid = models.CharField(max_length=255, unique=True)
    is_Registered = models.BooleanField(default = False)
    user_account = models.ForeignKey('app_login_and_reg.User', related_name="UUID", on_delete = models.CASCADE, null=True)
    nickname = models.CharField(max_length=255, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.uuid

    def save(self, *args, **kwargs):
        if not self.uuid:
            print("No uuid. Creating one.")

            for attempt in range(10):
                self.uuid = shortuuid.uuid()
                try:
                    with transaction.atomic():
                        super(UserUUID, self).save(*args, **kwargs)
                        break
                except IntegrityError:
                    print(f'Attempt {attempt}: This uuid already exists in the database.')
                    continue
            else:
                raise IntegrityError
        else:
            print("UUID exists. Not renewing.")

class Movie(models.Model):
    movie_id = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    description = models.TextField()
    poster_path = models.CharField(max_length=255)
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
    created_by = models.ForeignKey(UserUUID, related_name="temp_lists", on_delete = models.CASCADE, null=True)
    movies = models.ManyToManyField(Movie, related_name="in_temp_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class SharedMovieList(models.Model):
    sharecode = models.CharField(max_length=255, unique=True)
    users = models.ManyToManyField(UserUUID, related_name="shared_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.sharecode:
            print("No sharecode. Creating one.")
            su = shortuuid.ShortUUID(alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ')

            for attempt in range(10):
                self.sharecode = su.uuid()[:8]
                try:
                    with transaction.atomic():
                        super(SharedMovieList, self).save(*args, **kwargs)
                        break
                except IntegrityError:
                    print(f'Attempt {attempt}: A shared list with this sharecode already exists.')
                    continue
            else:
                raise IntegrityError
        else:
            print("Sharecode exists. Not renewing.")

class SharedMovie(models.Model):
    submitted_by = models.ManyToManyField(UserUUID, related_name="submitted_movies")
    shared_list = models.ForeignKey(SharedMovieList, related_name="shared_movies", on_delete = models.CASCADE, null=True)
    movie = models.ForeignKey(Movie, related_name="shared_movies", on_delete = models.CASCADE, null=True)
    is_eliminated = models.BooleanField(default=False)

    def __str__(self):
        return self.movie.title

class MatchRoom(models.Model):
    joined = models.ManyToManyField(UserUUID, related_name="joined_room", null=True)
    room = models.OneToOneField(SharedMovieList, related_name="match_room", on_delete = models.CASCADE)

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