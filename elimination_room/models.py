import shortuuid
from django.db import IntegrityError, models, transaction

from list_builder.validators import UserInputValidator


class EliminationSession(models.Model):
    sharecode = models.CharField(max_length=8, unique=True)
    created_by = models.ForeignKey(
        'list_builder.Persona', related_name="created_elimination_sessions", on_delete=models.CASCADE, null=True)
    contributors = models.ManyToManyField(
        'list_builder.Persona', related_name="elimination_sessions")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=False)
    turn = models.IntegerField(default=0)

    def add_movie_list(self, movie_list):
        """
        For every movie in the movie_list that is not already in the elimination 
        session, creates a new SharedMovie and adds it to the session.
        """
        for attempt in range(5):
            try:
                with transaction.atomic():
                    this_persona = movie_list.created_by
                    self.contributors.add(this_persona)
                    for each_movie in movie_list.movies.all():
                        shared_movie, created = SharedMovie.objects.get_or_create(
                            elimination_session=self,
                            movie=each_movie)
                        shared_movie.submitted_by.add(this_persona)
                    self.save()
                    break
            except IntegrityError:
                print(f'Attempt {attempt}: Error adding temp list to elimination session.')
                continue
        else:
            raise IntegrityError

    def __str__(self):
        return f'{self.id} - {self.sharecode}'

    def save(self, *args, **kwargs):
        if not self.sharecode:
            print("No sharecode. Creating one.")
            su = shortuuid.ShortUUID(
                alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ')

            for attempt in range(10):
                self.sharecode = su.uuid()[:8]
                try:
                    with transaction.atomic():
                        super(EliminationSession, self).save(*args, **kwargs)
                        break
                except IntegrityError:
                    print(f'Attempt {attempt}: An elimination session with this sharecode already exists.')
                    continue
            else:
                raise IntegrityError
        else:
            print("Sharecode exists. Not renewing.")
            super(EliminationSession, self).save(*args, **kwargs)


class SharedMovie(models.Model):
    submitted_by = models.ManyToManyField(
        'list_builder.Persona', related_name="submitted_movies")
    elimination_session = models.ForeignKey(
        EliminationSession, related_name="shared_movies", on_delete=models.CASCADE, null=True)
    movie = models.ForeignKey(
        'list_builder.Movie', related_name="shared_movies", on_delete=models.CASCADE, null=True)
    is_eliminated = models.BooleanField(default=False)


class EliminationSessionUser(models.Model):
    persona = models.ForeignKey(
        'list_builder.Persona', related_name="in_session", on_delete=models.CASCADE)
    elimination_session = models.ForeignKey(
        EliminationSession, related_name="session_users", on_delete=models.CASCADE)
    is_active = models.BooleanField(default=False)
    nickname = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Optional. 20 characters or fewer. Letters, numbers, basic punctuation: , . ! ? : ' \" $ & + - ( ) characters.",
        validators=[UserInputValidator()],
    )
    has_eliminated = models.BooleanField(default=False)

    position = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['persona', 'elimination_session'], name='one_user_per_session')
        ]
