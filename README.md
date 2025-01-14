# MovieMatch

<!-- What the project does -->
<!-- Why the project is useful -->
If you've ever had the joy of selecting a place to eat with people who can only contribute "I'm fine with anything" but also never fine with any choice, then you may have stumbled across the idea of offering a list of suggestions and letting each person eliminate the one they *don't* want to reach the most agreeable choice.

MovieMatch is essentially the movie equivalent.

Users can contribute movies to a group list where each will then have a turn to eliminate one movie until a final choice is left. The limitations to number of group participants or allowed siggestions per person are entirely open so the group can decide what works best for them. Someone can have no suggestions and still participate in eliminations. It is also not required to register, though doing so allows the user to save their list and view recent choices and grouplists.

---

<!-- How users can get started with the project -->
## Running the Project
The project runs on Django and is most easily deployed by running using the Docker compose file to setup the appropriate docker containers.
The needed components are:
 1. The Django project itself.
 2. A Redis server for Django channels (which is used for the websockets for the elimination process).
 3. A database for storing user data and (currently) cached movie data from The Movie Database.
 4. An ```.env``` file for setting Django environment variables.

---

### 1. The **```.env```** file
 Either the environment variables must be set, or there must be an ```.env``` file in the root directory upon startup of the servers, containing the following [Django Settings](https://docs.djangoproject.com/en/4.1/ref/settings/):
 - ```SECRET_KEY``` The secret key that Django uses for cryptographic signing.
- ```ALLOWED_HOSTS``` A comma separated list of hosts that are allowed to access the site. This should include the domain name of the site, and any subdomains that will be used. (Dev mode will default to localhost.)
```DJANGO_SETTINGS_MODULE``` Django settings can be split into modules. The available options for MovieMatch are ```movie_match.settings.dev```
and ```movie_match.settings.prod```.
---
- ```REDIS_HOST_NAME``` The Redis server host (container name if using Docker).
- ```REDIS_HOST_PORT``` The port that the Redis server is accessible on.
---
- ```DATABASE_ENGINE``` The database being used. (sqlite3 or postgresql)

SQLite should only be used for testing and requires no further configuration. If using PostgreSQL, the following additional variables are also required:
- ```POSTGRES_DB``` The database name.
- ```POSTGRES_USER``` The database user.
- ```POSTGRES_PASSWORD``` The database password.
- ```POSTGRES_HOST``` The database host (container name if using Docker).
- ```POSTGRES_PORT``` The port that the databse is accessible on.

> **Note:** Use single quotes for `.env` file values where necessary to prevent Docker from interpreting them. For example, set `SECRET_KEY` as `'your_secret_key'` instead of `your_secret_key` to avoid variable substitution for keys containing `$`.

---

### 2. **Docker**
Three compose configurations are available:
1. The 'production' configuration sets up a fully running instance consisting of the project container, a redis container, and a PostgreSQL container for the database. It runs Gunicorn to serve WSGI requests and Daphne to serve ASGI requests.

    Django is not set up to serve static files itself in a production environment. Therefore it is needed to serve these yourself. 

    Django's ['collect static'](https://docs.djangoproject.com/en/4.1/ref/contrib/staticfiles/#django-admin-collectstatic) must be run after building to collect all of the static files in one directory which will be pointed to by the ```/static/``` URL. There are many options to serve these — for example, the currently deployed project is behind an nginx reverse proxy which is also in charge of directing to the static file location.

    A compose ```.env``` file (**not the same as the django ```.env```**) should be created in the same directory as the compose file containing the following variables:
    - ```CONTAINER_STATIC_DIRECTORY``` - the container that the static files are collected to
    - ```LOCAL_STATIC_DIRECTORY``` - the chosen location of the volume to bind to the container's static directory which can then be served by the aforementioned reverse proxy

2. The 'deploy' configuration is for the currently running demo of the project. It is mostly identical to the production configuration, except it pulls the latest project image from AWS's Elastic Container Registry. It could still be used by specifying your own ECR repository and image tag, or changing the project image source entirely if you host it on Docker Hub or elsewhere.

    The compose ```.env``` file (**not the same as the django ```.env```**) for this configuration is the same as the production configuration, except it also requires the following variables:
    - ```REGISTRY``` - The AWS ECR registry
    - ```IMAGE_TAG``` - The image tag to use
    
    The ECR Repository is hardcoded to 'moviematch'

3. The 'dev' configuration runs the project in debug mode which uses Django's built in webserver. This is not recommended for production use, but will serve the static files itself, negating the need to run the ```collectstatic``` command.

---

### 3. **Without Docker**
The project can also be run without Docker. Running locally in dev mode is the simplest, given that static files will be served by Django's built in server. An ```.env``` file is still required, but the ```DJANGO_SETTINGS_MODULE``` variable should be set to ```movie_match.settings.dev```. 

It is also easiest to set the database engine to SQLite, though PostgreSQL can be used if desired. If using a database other than SQLite, the database must be configured and the appropriate connection information placed in the ```.env``` file.

A Redis server must be running under any configuration to use the elimination process. 

It is still possible to run the project outside of Docker, while running the database and/or Redis server in Docker containers themselves as long as the appropriate variables are set.

If using production mode, the static files must still be collected and served by a reverse proxy or other method, as Gunicorn and Daphne will not handle it themselves.
<!-- Where users can get help with your project -->
<!-- Who maintains and contributes to the project -->
