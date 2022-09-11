import math
import os
from django.conf import settings

def debug_pretty_print(debug_heading="", debug_lines=[]):
    # 6 for minimum of 3 flanking '*' and 2 for ': '
    heading_min_length = len(debug_heading) + 2 + 6
    if debug_lines:
        max_line_length = len(max(debug_lines,key=len))
    else:
        max_line_length = 0

    text_length = max(heading_min_length, max_line_length)
    even_length = int(math.ceil(text_length/2)*2)
    heading_length = int((even_length - (len(debug_heading) + 2))/2)

    print('\n' + '*'*heading_length + f' {debug_heading}: ' + '*'*heading_length)
    for x in debug_lines:
        print(x)
    print('*'*even_length + '\n')

env_variables = [
    'DJANGO_SETTINGS_MODULE',
    'SECRET_KEY',
    'ALLOWED_HOSTS',
    'DEBUG',
    'DATABASE_ENGINE',
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_HOST',
    'POSTGRES_PORT'
]

def environ_status(header="Current Environment"):
    debug_lines = [f'DJANGO_SETTINGS_MODULE: {str(os.environ.get("DJANGO_SETTINGS_MODULE", "Not Given"))}']
    for env_var in env_variables:
        debug_lines.append(f'{env_var}: {str(os.environ.get(env_var, "Not Given"))}')
    debug_pretty_print(header, debug_lines)

def settings_status(settings_name = "Current Settings:"):
    debug_lines = []
    for env_var in env_variables:
        env_value = getattr(settings, env_var, "Not set.")
        debug_lines.append(f'{env_var}: {env_value}')
    debug_pretty_print(settings_name, debug_lines)

def dotenv_status(dotenv_vars):
    debug_lines = []
    for k,v in dotenv_vars.items():
        debug_lines.append(f'{k}: {v}')
    debug_pretty_print("DotEnv Values", debug_lines)
