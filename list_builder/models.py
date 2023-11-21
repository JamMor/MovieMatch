import shortuuid
from django.conf import settings
from django.db import IntegrityError, models, transaction

from .validators import UserInputValidator


# Create your models here.
class Persona(models.Model):
    uuid = models.CharField(max_length=255, unique=True)
    user_account = models.OneToOneField(
        settings.AUTH_USER_MODEL, related_name="persona", on_delete=models.CASCADE, null=True)
    nickname = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Optional. 20 characters or fewer. Letters, numbers, basic punctuation: , . ! ? : ' \" $ & + - ( ) characters.",
        validators=[UserInputValidator()],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        # return uuid and nickname if nickname exists
        return f'{self.uuid} - {self.nickname}' if self.nickname else self.uuid

    def save(self, *args, **kwargs):
        if not self.uuid:
            print("No uuid. Creating one.")

            for attempt in range(10):
                self.uuid = shortuuid.uuid()
                try:
                    with transaction.atomic():
                        super(Persona, self).save(*args, **kwargs)
                        break
                except IntegrityError:
                    print(f'Attempt {attempt}: This uuid already exists in the database.')
                    continue
            else:
                raise IntegrityError
        else:
            print("UUID exists. Not renewing.")
            super(Persona, self).save(*args, **kwargs)


# Local copy of info from TheMovieDB, https://www.themoviedb.org/
class Movie(models.Model):
    tmdb_id = models.IntegerField()  # ID in TheMovieDB, https://www.themoviedb.org/
    title = models.CharField(max_length=255)
    overview = models.TextField()
    poster_path = models.CharField(max_length=255)
    release_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class MovieListManager(models.Manager):
    def create_from_tmdb_ids(self, tmdb_ids, creator, **kwargs):
        """
        Creates a MovieList (temp, or saved) from list of themovieDB movie ids.
        Movies not in local database are not added or created.
        """
        print("Building new list")
        new_movie_list = self.create(created_by=creator, **kwargs)
        print("New List created! ID: ", new_movie_list.id)

        # Gets local movie id's for all tmdb tmdb_id's that exist locally
        tmdb_id_set = set(tmdb_ids)
        ids_in_db = Movie.objects.filter(
            tmdb_id__in=tmdb_id_set).values_list('id', flat=True)

        new_movie_list.movies.add(*ids_in_db)

        return new_movie_list


class MovieList(models.Model):
    created_by = models.ForeignKey(
        Persona, related_name="%(class)ss", on_delete=models.CASCADE, null=True)
    movies = models.ManyToManyField(Movie, related_name="in_%(class)ss")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = MovieListManager()

    class Meta:
        abstract = True


class SavedMovieList(MovieList):
    list_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="100 characters or fewer. Letters, numbers, basic punctuation: , . ! ? : ' \" $ & + - ( ) characters.",
        validators=[UserInputValidator()],
    )

    @property
    def display_name(self):
        return self.list_name if self.list_name else f'Movie List {self.created_at.strftime("%Y-%m-%d %H:%M")}'

    def __str__(self):
        return self.display_name


class TempMovieList(MovieList):
    def __str__(self):
        return f'Temp Movie List {self.created_at.strftime("%Y-%m-%d %H:%M")}'
