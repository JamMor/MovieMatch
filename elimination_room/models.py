import json
import shortuuid
from django.db import IntegrityError, models, transaction
from django.db.models import Q

# Create your models here.
class SharedMovieList(models.Model):
    sharecode = models.CharField(max_length=255, unique=True)
    created_by = models.ForeignKey('list_builder.Persona', related_name="created_shared_lists", on_delete = models.CASCADE, null=True)
    # FLAG: Is this needed with Rounds?
    started_eliminating = models.BooleanField(default=False)
    contributors = models.ManyToManyField('list_builder.Persona', related_name="shared_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_active = models.BooleanField(default=False)
    round = models.IntegerField(default=0)
    turn = models.IntegerField(default=0)
    
    def add_list_to_shared_list(self, movie_list):
        """
        Converts templist movies not already in shared list to SharedMovies 
        that are added to SharedList
        """
        this_persona = movie_list.created_by
        #Use transactions here FLAG
        self.contributors.add(this_persona)
        for each_movie in movie_list.movies.all():
            shared_movie, created = SharedMovie.objects.get_or_create(
                shared_list = self, 
                movie = each_movie)
            shared_movie.submitted_by.add(this_persona)
        self.save()

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
    submitted_by = models.ManyToManyField('list_builder.Persona', related_name="submitted_movies")
    shared_list = models.ForeignKey(SharedMovieList, related_name="shared_movies", on_delete = models.CASCADE, null=True)
    movie = models.ForeignKey('list_builder.Movie', related_name="shared_movies", on_delete = models.CASCADE, null=True)
    is_eliminated = models.BooleanField(default=False)

class ShareRoomUserQuerySet(models.QuerySet):
    def currently_eliminating(self):
        return self.filter(Q(status=ShareRoomUser.UserStatus.WAITING) | Q(status=ShareRoomUser.UserStatus.VOTED))
    def are_active(self):
        return self.exclude(status=ShareRoomUser.UserStatus.INACTIVE)
    def on_standby(self):
        return self.filter(status=ShareRoomUser.UserStatus.STANDBY)

class ShareRoomUser(models.Model):
    persona = models.ForeignKey('list_builder.Persona', related_name="in_room", on_delete = models.CASCADE)
    list = models.ForeignKey(SharedMovieList, related_name="room_users", on_delete = models.CASCADE)
    is_active = models.BooleanField(default=True)
    #FLAG: Is this used?
    is_users_turn = models.BooleanField(default=False)
    nickname = models.CharField(max_length=255, null=True)
    #FLAG: Is this used?
    last_active = models.DateTimeField(null=True)

    #FLAG: Planned for deprecation
    round = models.IntegerField(default=0)
    has_eliminated = models.BooleanField(default=False)
    
    position = models.IntegerField(default=0)

    class UserStatus(models.TextChoices):
        INACTIVE = "IA" # Not in room
        STANDBY = "SB"  # Waiting for next voting round
        VOTED = "VO"    # Voted to eliminate
        WAITING = "WA"  # Waiting to vote

    status = models.CharField(
        max_length=2,
        choices=UserStatus.choices,
        default=UserStatus.INACTIVE,
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ShareRoomUserQuerySet.as_manager()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['persona', 'list'], name='one_user_per_room')
        ]