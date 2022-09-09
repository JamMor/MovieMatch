from .base import *
from .diag import *

DEBUG = False

env_hosts = os.environ.get("ALLOWED_HOSTS", "").split(",")
ALLOWED_HOSTS = [] if not any(env_hosts) else env_hosts

# environ_status(f'{__name__} Environ')
# settings_status(f'Settings: {__name__}')
# dotenv_status(dotenv_values())