from datetime import datetime
from django import test
from django.db import IntegrityError
from django.test import TestCase
from ..models import Persona, TempMovieList, Movie

class PersonaTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        Persona.objects.create()

    def test_persona_uuid_created(self):
        test_persona = Persona.objects.first()
        test_uuid = test_persona.uuid
        print(f'Persona UUID: {test_uuid}')
        self.assertTrue(test_uuid)
    
    def test_persona_uuid_unique(self):
        test_persona = Persona.objects.first()
        test_uuid = test_persona.uuid
        print(f'Persona UUID to duplicate: {test_uuid}')
        with self.assertRaises(Exception) as raises:
            Persona.objects.create(uuid = test_uuid)
        self.assertEqual(IntegrityError, type(raises.exception))

class MovieListTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        Persona.objects.create()

        cls.tmdb_ids = [11,22,33,44,55,66,9999]
        for tmdb_id in cls.tmdb_ids:
            Movie.objects.create(
                tmdb_id = tmdb_id,
                title = f'Movie #{tmdb_id}',
                release_date = datetime.now()
            )

    def test_templist_create_from_tmdb_ids(self):
        test_persona = Persona.objects.first()
        test_list = TempMovieList.objects.create_from_tmdb_ids(self.tmdb_ids, test_persona)
        related_movie_ids = test_list.movies.values_list('tmdb_id', flat=True)
        self.assertCountEqual(self.tmdb_ids, list(related_movie_ids))