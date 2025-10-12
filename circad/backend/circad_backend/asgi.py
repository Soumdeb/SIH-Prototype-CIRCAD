# circad_backend/asgi.py
import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from api import routing as api_routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "circad_backend.settings")
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(api_routing.websocket_urlpatterns)
    ),
})
