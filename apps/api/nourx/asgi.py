"""
ASGI config for NOURX project.
"""
import os
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nourx.settings.dev")

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    # WebSocket routing will be added later
    # "websocket": AuthMiddlewareStack(
    #     URLRouter([
    #         # WebSocket URL patterns will be added here
    #     ])
    # ),
})
