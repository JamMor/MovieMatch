from .base import *
from .diag import *

DOCKER = True
DEBUG = False

env_hosts = os.environ.get("ALLOWED_HOSTS", "").split(",")
ALLOWED_HOSTS = [] if not any(env_hosts) else env_hosts

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],
        },
    },
}

environ_status(f'{__name__} Environ')
settings_status(f'Settings: {__name__}')
dotenv_status(dotenv_values())