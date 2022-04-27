import json
import shortuuid
from django.db import IntegrityError, models, transaction
from django.conf import settings

# Create your models here.
class UserUUID(models.Model):
    uuid = models.CharField(max_length=255, unique=True)
    #Is is_registered needed? Maybe just test for user_account null
    is_registered = models.BooleanField(default = False)
    user_account = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="user_uuid", on_delete = models.CASCADE, null=True)
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
            super(UserUUID, self).save(*args, **kwargs)

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
    created_by = models.ForeignKey(UserUUID, related_name="saved_lists", on_delete = models.CASCADE, null=True)
    movies = models.ManyToManyField(Movie, related_name="in_saved_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class TempMovieListManager(models.Manager):
    def create_from_movie_list(self, movie_list, creator):
        """
        Creates  a temp list from list of movies (dictionaries from themovieDB 
        data), while adding new movies to local database.
        """
        print("Building new temp list")
        temp_list = self.create(created_by = creator)
        print("New Temp List created! ID: ", temp_list.id)
        # Updates or stores movie in database if it exists
        for movie_item in movie_list:
            print("Assessing: ", movie_item["title"])
            movie_object, created = Movie.objects.update_or_create(
                movie_id = movie_item["id"],
                title = movie_item["original_title"],
                release_date = movie_item["release_date"],
                defaults = {'description' : movie_item["overview"], 'poster_path' : movie_item["poster_path"]}
            )
            if created:
                print ("Added new movie to database.")
            elif not created:
                print ("Already exists in database")
            temp_list.movies.add(movie_object)
            print(movie_item["title"], " added to temp list!")
        temp_list.save()
        
        return temp_list

class TempMovieList(models.Model):
    created_by = models.ForeignKey(UserUUID, related_name="temp_lists", on_delete = models.CASCADE, null=True)
    movies = models.ManyToManyField(Movie, related_name="in_temp_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = TempMovieListManager()