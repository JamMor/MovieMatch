# For more information, please refer to https://aka.ms/vscode-docker-python
FROM astral/uv:python3.12-bookworm-slim
EXPOSE 8000

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get -y install libpq5 build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy project and lock files, and install dependencies
WORKDIR /app
COPY ./pyproject.toml ./uv.lock ./
RUN uv sync --locked

# Copy the application code to the container
COPY . /app

# Ensure the virtualenv is used:
ENV PATH="/app/.venv/bin:$PATH"

# Creates a non-root user with an explicit UID and adds permission to access the /app folder
# For more info, please refer to https://aka.ms/vscode-docker-python-configure-containers
RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# During debugging, this entry point will be overridden. For more information, please refer to https://aka.ms/vscode-docker-python-debug
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "movie_match.wsgi"]


# Build name style /$PROJECT/$ENVIRONMENT:$SHA1