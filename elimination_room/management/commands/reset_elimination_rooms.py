from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from elimination_room.models import ShareRoomUser, SharedMovieList

class Command(BaseCommand):
    help = 'Resets all ShareRoomUsers and sets Rooms to Inactive'

    def reset_share_room_users(self):
        ShareRoomUser.objects.all().update(is_active=False)
        if ShareRoomUser.objects.filter(is_active=True).exists():
            raise CommandError("ShareRoomUsers still active!")

    def reset_shared_movie_lists(self):
        SharedMovieList.objects.all().update(is_active=False)
        if SharedMovieList.objects.filter(is_active=True).exists():
            raise CommandError("SharedMovieLists still active!")

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                self.reset_share_room_users()
                self.reset_shared_movie_lists()
        except Exception as e:
            raise CommandError(f'Error resetting ShareRoomUsers and SharedMovieLists: {str(e)}')

        self.stdout.write(self.style.SUCCESS('User and rooms reset successfully'))