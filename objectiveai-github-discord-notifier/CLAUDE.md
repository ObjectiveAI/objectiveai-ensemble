# Task
The assistant will create a server application written in Python which listens for GitHub Webhooks, validates their 'X-Hub-Signature-256' header, and, if they are relevant, delivers a notification to a specified Discord channel.

# Secrets
All secrets will be provided as environment variables. In some cases, they will be exported to the environment prior to running the application. In other cases, they will only be present in a .env file. The assistant will ensure that the .env file is loaded into the environment first and foremost with .env. These secrets include:
- DISCORD_TOKEN
- DISCORD_CHANNEL_ID
- GITHUB_REPOSITORY_OWNER
- GITHUB_REPOSITORY
- GITHUB_SECRET
If the assistant believes that additional secrets are needed, it will update this file accordingly.

# Events
Only events which match the requirements should be delivered to DISCORD_CHANNEL_ID:
- Pull Request Opened
- Pull Request Closed
- Issue Opened
- Issue Closed
- Owner must match GITHUB_REPOSITORY_OWNER
- Repository name must match GITHUB_REPOSITORY
- 'X-Hub-Signature-256' header must be valid against GITHUB_SECRET

# Notifications
Discord Notifications should match the specified format:
"[{GITHUB_REPOSITORY_OWNER}/{GITHUB_REPOSITORY}]({actual_url}) {Event}
{Issue/PR Title}
{Issue/PR Description}"
{Event} refers to "Pull Request Opened", "Issue Closed", etc.
The complete message MUST fit within the Discord character limit, which is 2000 characters. If the Description is too long, it should be cut off with trailing ellipsis (...). Make sure to consider the extra 3 characters from the Ellipsis when computing length.
Very rarely, the title may be extraordinarily long and trigger the 2000 character limit. In this case, it too should be cut off with trailing ellipsis (...) and the Description should be omitted.

# Environment
The assistant will use python .venv, and will run the relevant activation script prior to other actions.

# Docker
The application can be run via Docker. The Dockerfile uses ARG and ENV directives for each secret:
```
ARG DISCORD_TOKEN
ENV DISCORD_TOKEN=${DISCORD_TOKEN}
```
Build with:
```
docker build \
  --build-arg DISCORD_TOKEN=<token> \
  --build-arg DISCORD_CHANNEL_ID=<channel_id> \
  --build-arg GITHUB_REPOSITORY_OWNER=<owner> \
  --build-arg GITHUB_REPOSITORY=<repo> \
  --build-arg GITHUB_SECRET=<secret> \
  -t github-discord-notifier .
```
Run with:
```
docker run -p 8000:8000 github-discord-notifier
```

# Libraries
The assistant will download, import, and use the Python libraries:
- fastapi
- uvicorn
- httpx
- python-dotenv
- discord.py
The assistant will ensure that the latest versions are in requirements.txt
If other libraries are needed, the assistant will update this file accordingly.
