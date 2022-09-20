from .base import *
from .diag import *

DEBUG = False

env_hosts = os.environ.get("ALLOWED_HOSTS", "").split(",")
ALLOWED_HOSTS = [] if not any(env_hosts) else env_hosts

env_cookie_domains = os.environ.get("CSRF_COOKIE_DOMAIN", "").split(",")
CSRF_COOKIE_DOMAIN = [] if not any(env_cookie_domains) else env_cookie_domains

# environ_status(f'{__name__} Environ')
# settings_status(f'Settings: {__name__}')
# dotenv_status(dotenv_values())