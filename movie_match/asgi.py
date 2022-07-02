"""
ASGI config for movie_match project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://channels.readthedocs.io/en/stable/installation.html
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'movie_match.settings')
# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

import elimination_room.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                elimination_room.routing.websocket_urlpatterns
            )
        )
    ),
})