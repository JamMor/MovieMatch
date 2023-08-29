import json
import shortuuid
from django.db import IntegrityError, models, transaction
from django.db.models import Q

class SharedMovieList(models.Model):
    sharecode = models.CharField(max_length=255, unique=True)
    created_by = models.ForeignKey('list_builder.Persona', related_name="created_shared_lists", on_delete = models.CASCADE, null=True)
    contributors = models.ManyToManyField('list_builder.Persona', related_name="shared_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_active = models.BooleanField(default=False)
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

class ShareRoomUser(models.Model):
    persona = models.ForeignKey('list_builder.Persona', related_name="in_room", on_delete = models.CASCADE)
    list = models.ForeignKey(SharedMovieList, related_name="room_users", on_delete = models.CASCADE)
    is_active = models.BooleanField(default=False)
    nickname = models.CharField(max_length=255, null=True, blank=True)
    has_eliminated = models.BooleanField(default=False)
    
    position = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['persona', 'list'], name='one_user_per_room')
        ]