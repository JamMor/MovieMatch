from .base import *
from .diag import *

DOCKER = True

DEBUG = True

ALLOWED_HOSTS =[]

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],
        },
    },
}

# environ_status(f'{__name__} Environ')
# settings_status(f'Settings: {__name__}')
# dotenv_status(dotenv_values())