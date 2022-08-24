# For more information, please refer to https://aka.ms/vscode-docker-python
FROM python:3.9-alpine

EXPOSE 8000

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# Install temporary dependencies 'gcc' and 'musl-dev' that aren't in alpine
# Install project pip requirements
COPY ./requirements_base.txt .
RUN apk add --update --no-cache --virtual .tmp-deps \
        gcc musl-dev && \
    python -m pip install --upgrade pip && \
    python -m pip install -r requirements_base.txt && \
    apk del .tmp-deps

WORKDIR /app
COPY .. /app

# Creates a non-root user with an explicit UID and adds permission to access the /app folder
# For more info, please refer to https://aka.ms/vscode-docker-python-configure-containers
RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# During debugging, this entry point will be overridden. For more information, please refer to https://aka.ms/vscode-docker-python-debug
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "movie_match.wsgi"]


# Build name style /$PROJECT/$ENVIRONMENT:$SHA1