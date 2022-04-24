import json
import shortuuid
from django.db import IntegrityError, models, transaction

# Create your models here.
class UserUUID(models.Model):
    uuid = models.CharField(max_length=255, unique=True)
    #Is is_registered needed? Maybe just test for user_account null
    is_registered = models.BooleanField(default = False)
    is_Registered = models.BooleanField(default = False)
    # user_account = models.ForeignKey('app_login_and_reg.User', related_name="UUID", on_delete = models.CASCADE, null=True)
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
    # created_by = models.ForeignKey('app_login_and_reg.User', related_name="saved_lists", on_delete = models.CASCADE, null=True)
    movies = models.ManyToManyField(Movie, related_name="in_saved_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class TempMovieList(models.Model):
    created_by = models.ForeignKey(UserUUID, related_name="temp_lists", on_delete = models.CASCADE, null=True)
    movies = models.ManyToManyField(Movie, related_name="in_temp_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)