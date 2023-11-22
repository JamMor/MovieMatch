from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from elimination_room.models import EliminationSession, EliminationSessionUser


class Command(BaseCommand):
    help = 'Resets all EliminationSessionUsers and Sessions to Inactive'

    def reset_session_users(self):
        EliminationSessionUser.objects.all().update(is_active=False)
        if EliminationSessionUser.objects.filter(is_active=True).exists():
            raise CommandError("EliminationSessionUsers still active!")

    def reset_elimination_sessions(self):
        EliminationSession.objects.all().update(is_active=False)
        if EliminationSession.objects.filter(is_active=True).exists():
            raise CommandError("EliminationSessions still active!")

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                self.reset_session_users()
                self.reset_elimination_sessions()
        except Exception as e:
            raise CommandError(
                f'Error resetting EliminationSessionUsers and EliminationSessions: {str(e)}')

        self.stdout.write(self.style.SUCCESS(
            'Users and sessions reset successfully'))
