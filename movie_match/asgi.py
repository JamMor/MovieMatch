"""
ASGI config for movie_match project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://channels.readthedocs.io/en/stable/installation.html
"""

import os

import django
from channels.auth import AuthMiddlewareStack
from channels.http import AsgiHandler
from channels.routing import ProtocolTypeRouter, URLRouter

import elimination_room.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'movie_match.settings')
django.setup()

application = ProtocolTypeRouter({
  "http": AsgiHandler(),
  "websocket": AuthMiddlewareStack(
        URLRouter(
            elimination_room.routing.websocket_urlpatterns
        )
    ),
})