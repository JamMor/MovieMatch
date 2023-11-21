from django.contrib.auth.models import AnonymousUser, User
from django.test import Client, RequestFactory, TestCase

from ..models import Movie, Persona
from ..moviedb_api_caller import add_movies_to_db_from_tmdb_ids
from ..persona_assigner import get_or_set_persona


class PersonaAssignerTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.request = RequestFactory().get('/')
        self.request.user = AnonymousUser()  # Default when user not logged in
        self.request.session = self.client.session
        self.test_user = User.objects.create(
            username="TestName", password="MovieMatch04")

    def test_not_authenticated_and_no_persona(self):
        get_or_set_persona(self.request)
        self.assertTrue(Persona.objects.count)

    def test_not_authenticated_but_has_persona(self):
        test_persona = Persona.objects.create()
        self.request.session['uuid'] = test_persona.uuid
        self.request.session.save()

        retrieved_persona = get_or_set_persona(self.request)
        self.assertEqual(test_persona.uuid, retrieved_persona.uuid)

    def test_user_with_persona(self):
        test_persona = Persona.objects.create(user_account=self.test_user)

        self.request.user = self.test_user

        retrieved_persona = get_or_set_persona(self.request)
        self.assertEqual(test_persona.uuid, retrieved_persona.uuid)

    def test_user_with_no_persona(self):
        self.request.user = self.test_user

        get_or_set_persona(self.request)
        self.assertTrue(Persona.objects.count)

    def test_user_with_wrong_persona_in_session(self):
        user_persona = Persona.objects.create(user_account=self.test_user)
        logged_persona = Persona.objects.create()

        self.request.session['uuid'] = logged_persona.uuid
        self.request.session.save()

        self.request.user = self.test_user

        retrieved_persona = get_or_set_persona(self.request)
        self.assertEqual(user_persona.uuid, retrieved_persona.uuid)


class MovieDbAPICallerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.tmdb_ids = {672, 673, 674, 675}

    def test_add_movies_to_db_from_tmdb_ids(self):
        add_movies_to_db_from_tmdb_ids(self.tmdb_ids)
        db_tmdb_ids = Movie.objects.values_list('tmdb_id', flat=True)
        self.assertCountEqual(self.tmdb_ids, db_tmdb_ids)
