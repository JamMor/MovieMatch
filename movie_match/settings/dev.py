from .base import *
from .diag import *

DEBUG = True

# ALLOWED_HOSTS = []

# environ_status(f'{__name__} Environ')
# settings_status(f'Settings: {__name__}')
# dotenv_status(dotenv_values())

LOGGING = {
    'version': 1,
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        }
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'filters': ['require_debug_true'],
            'class': 'logging.StreamHandler',
        }
    },
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['console'],
        }
    }
}