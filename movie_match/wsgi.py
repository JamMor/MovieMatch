"""
WSGI config for movie_match project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

#Load .env variables
from dotenv import load_dotenv
load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'movie_match.settings.base')

application = get_wsgi_application()
