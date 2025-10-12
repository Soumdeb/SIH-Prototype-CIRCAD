# circad/backend/api/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class AnalysisConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("analysis_updates", self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({
            "type": "connection_status",
            "message": "⚡ Real-time connection active"
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("analysis_updates", self.channel_name)

    async def receive(self, text_data):
        # Optional - handle messages from client
        pass

    async def analysis_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "analysis_update",
            "message": event["message"],
            "data": event.get("data", {}),
        }))

class UpdateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(json.dumps({"message": "⚡ Real-time connection active"}))

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        print("Received:", text_data)