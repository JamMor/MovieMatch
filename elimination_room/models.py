import json
import shortuuid
from django.db import IntegrityError, models, transaction

# Create your models here.
class SharedMovieList(models.Model):
    sharecode = models.CharField(max_length=255, unique=True)
    created_by = models.ForeignKey('list_builder.UserUUID', related_name="created_shared_lists", on_delete = models.CASCADE, null=True)
    started_eliminating = models.BooleanField(default=False)
    #Is this field ever needed?
    contributors = models.ManyToManyField('list_builder.UserUUID', related_name="shared_lists")
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
            super(SharedMovieList, self).save(*args, **kwargs)

class SharedMovie(models.Model):
    submitted_by = models.ManyToManyField('list_builder.UserUUID', related_name="submitted_movies")
    shared_list = models.ForeignKey(SharedMovieList, related_name="shared_movies", on_delete = models.CASCADE, null=True)
    movie = models.ForeignKey('list_builder.Movie', related_name="shared_movies", on_delete = models.CASCADE, null=True)
    is_eliminated = models.BooleanField(default=False)

class ShareRoomUser(models.Model):
    user_uuid = models.ForeignKey('list_builder.UserUUID', related_name="in_room", on_delete = models.CASCADE)
    list = models.ForeignKey(SharedMovieList, related_name="room_users", on_delete = models.CASCADE)
    is_active = models.BooleanField(default=True)
    is_users_turn = models.BooleanField(default=False)
    nickname = models.CharField(max_length=255, null=True)
    last_active = models.DateTimeField(null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user_uuid', 'list'], name='one_user_per_room')
        ]