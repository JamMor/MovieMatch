from .base import *

DEBUG = False

env_hosts = os.environ.get("ALLOWED_HOSTS", "").split(",")
ALLOWED_HOSTS = [] if not any(env_hosts) else env_hosts

