# Docker

This directory contains Docker-related files for setting up and running the project in a Docker container. 

## Running the Project

- Dev mode:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

When not running in development mode, Django will not serve the static files itself. Production and deployment mode mount the static directory to the host where you may decide on how to serve the static files. Docker will also not initiate bundling of the static files, which is needed for production mode. Refer to the Webpack component's [README.md](../webpack/README.md) for the commands to do this.

The current deployment uses nginx which serves the static files. For running locally in these modes, an easy option is to run an nginx container, mount the static directory to it, and configure it to serve static files. All docker-compose files create a network called `moviematch_network` which you may use to connect the containers.

- Production mode:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
- Deployment mode:
```bash
docker-compose -f docker-compose.deploy.yml up -d
```




## File Structure

- `Dockerfile`: This file contains instructions for Docker to build the Django project.

---

- `docker-compose.yml`: This is a **base** compose file that contains common instructions for every environment. 
    Along with the django container, it includes 
    - a basic redis instance, 
    - points to the `.env` file for the django project, 
    - and optionally sets the static directory path to be used in the container. 
    
    It should be run in combination with one of these two files:
    - `docker-compose.dev.yml`: 
        - Runs the Django project in debug mode, 
        - sets the `DJANGO_SETTINGS_MODULE` environment variable to `movie_match.settings.dev`, 
        - and sets the command to run the Django development server.
    - `docker-compose.prod.yml`: 
        - Runs the Django project with DEBUG set to False,
        - sets the `DJANGO_SETTINGS_MODULE` environment variable to `movie_match.settings.prod`,
        - adds a Postgres database container with associated volume,
        - and sets the command to run the Django with gunicorn for wsgi and daphne for asgi.
- `docker-compose.deploy.yml`: This is similar to the compiled production compose (including the base) tailored for the deployment environment.
    - Sets the `restart` policy to `always` so that the containers will restart if they crashes.
    - Includes variables for tagging the django container with the AWS ECR registry url and the git commit hash for this deployment.

---

- `.env`: This **.env** file is for Docker compose, mainly for use in running the containers locally. It has two variables used to:
    - `LOCAL_STATIC_DIRECTORY`: This is the path on the host machine where the static directory is to be mounted.
    - `CONTAINER_STATIC_DIRECTORY`: This is the path to the static directory in the container. It is set to `staticfiles/` by default if not given.

- `.env.deploy`: This **.env** file contains the same variables for the deployment environment, with the additional variables:
    - `IMAGE_TAG`: This is the tag to use for the django app image. It is intended to be the git commit hash of the commit being used.
    - `REGISTRY`: This is the AWS ECR registry url which is incorporated into the image name.

> **Note:** Use single quotes for `.env` file values where necessary to prevent Docker from interpreting them. For example, set `SECRET_KEY` as `'your_secret_key'` instead of `your_secret_key` to avoid variable substitution for keys containing `$`.