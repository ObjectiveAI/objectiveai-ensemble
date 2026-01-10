import os
import hmac
import hashlib
import asyncio
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, Header
import discord
import uvicorn

load_dotenv()


def get_required_env(name: str) -> str:
    """Retrieve a required environment variable or raise a clear error."""
    value = os.environ.get(name)
    if value is None:
        raise RuntimeError(
            f"Required environment variable '{name}' is not set."
        )
    return value


DISCORD_TOKEN = get_required_env("DISCORD_TOKEN")
DISCORD_CHANNEL_ID = int(get_required_env("DISCORD_CHANNEL_ID"))
GITHUB_REPOSITORY_OWNER = get_required_env("GITHUB_REPOSITORY_OWNER")
GITHUB_REPOSITORY = get_required_env("GITHUB_REPOSITORY")
GITHUB_SECRET = get_required_env("GITHUB_SECRET")
PORT = int(get_required_env("PORT"))
ADDRESS = os.environ.get("ADDRESS", "0.0.0.0")
DISCORD_CHAR_LIMIT = 2000
ELLIPSIS = "..."

discord_client = discord.Client(intents=discord.Intents.default())
discord_ready = asyncio.Event()


@discord_client.event
async def on_ready():
    """Signal that Discord client is ready."""
    discord_ready.set()


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify GitHub webhook signature using HMAC SHA256."""
    if not signature.startswith("sha256="):
        return False
    expected = hmac.new(
        GITHUB_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


def format_message(
    owner: str,
    repo: str,
    url: str,
    event: str,
    title: str,
    description: str | None,
) -> str:
    """Format Discord notification message, truncating if necessary."""
    # Build the base message structure
    # Format: "[owner/repo](url) Event\nTitle\nDescription"
    prefix = f"[{owner}/{repo}]({url}) {event}\n"

    # Calculate available space for title and description
    # We need at least: prefix + title + newline
    available_for_title = DISCORD_CHAR_LIMIT - len(prefix)

    if len(title) > available_for_title:
        # Title is too long, truncate it and omit description
        truncated_title = title[: available_for_title - len(ELLIPSIS)] + ELLIPSIS
        return prefix + truncated_title

    message_with_title = prefix + title

    if not description:
        return message_with_title

    # Add newline before description
    message_with_title_and_newline = message_with_title + "\n"
    available_for_description = DISCORD_CHAR_LIMIT - len(message_with_title_and_newline)

    if available_for_description <= len(ELLIPSIS):
        # No room for description
        return message_with_title

    if len(description) > available_for_description:
        truncated_description = (
            description[: available_for_description - len(ELLIPSIS)] + ELLIPSIS
        )
        return message_with_title_and_newline + truncated_description

    return message_with_title_and_newline + description


async def send_discord_notification(message: str) -> None:
    """Send a message to the configured Discord channel."""
    await discord_client.wait_until_ready()
    channel = discord_client.get_channel(DISCORD_CHANNEL_ID)
    if channel is None:
        channel = await discord_client.fetch_channel(DISCORD_CHANNEL_ID)
    await channel.send(message)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage Discord client lifecycle."""
    asyncio.create_task(discord_client.start(DISCORD_TOKEN))
    await discord_ready.wait()
    print(f"Discord bot connected as {discord_client.user}")
    yield
    await discord_client.close()


app = FastAPI(lifespan=lifespan)


@app.post("/webhook")
async def handle_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None),
    x_github_event: str = Header(None),
):
    """Handle incoming GitHub webhook events."""
    payload = await request.body()

    # Validate signature
    if not x_hub_signature_256 or not verify_signature(payload, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()

    # Check repository owner and name
    repo_info = data.get("repository", {})
    owner = repo_info.get("owner", {}).get("login", "")
    repo = repo_info.get("name", "")

    if owner.lower() != GITHUB_REPOSITORY_OWNER.lower() or repo.lower() != GITHUB_REPOSITORY.lower():
        return {"status": "ignored", "reason": "repository mismatch"}

    # Determine event type and action
    action = data.get("action", "")
    event_type = None
    item = None
    url = None

    if x_github_event == "pull_request":
        if action == "opened":
            event_type = "Pull Request Opened"
        elif action == "closed":
            event_type = "Pull Request Closed"
        item = data.get("pull_request", {})
        url = item.get("html_url", "")
    elif x_github_event == "issues":
        if action == "opened":
            event_type = "Issue Opened"
        elif action == "closed":
            event_type = "Issue Closed"
        item = data.get("issue", {})
        url = item.get("html_url", "")

    if not event_type:
        return {"status": "ignored", "reason": "unsupported event or action"}

    title = item.get("title", "")
    description = item.get("body") or ""

    message = format_message(owner, repo, url, event_type, title, description)
    await send_discord_notification(message)

    return {"status": "notified", "event": event_type}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "discord_connected": discord_client.is_ready()}


if __name__ == "__main__":
    uvicorn.run(app, host=ADDRESS, port=PORT)
