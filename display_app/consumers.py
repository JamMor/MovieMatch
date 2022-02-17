# chat/consumers.py
import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

class MatchConsumer(WebsocketConsumer):
    def connect(self):
        self.sharecode = self.scope['url_route']['kwargs']['sharecode']
        self.match_group_name = 'match_%s' % self.sharecode

        # Join group
        async_to_sync(self.channel_layer.group_add)(
            self.match_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave group
        async_to_sync(self.channel_layer.group_discard)(
            self.match_group_name,
            self.channel_name
        )

    # Receive message from WebSocket Client
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)

        # Send message to ChannelLayer
        async_to_sync(self.channel_layer.group_send)(
            self.match_group_name,
            {
                'type': 'match_message',
                'message': "Message returned: " + message
            }
        )

    # Receive message from ChannelLayer
    def match_message(self, event):
        message = event['message']

        # Send message to WebSocket Client
        self.send(text_data=json.dumps({
            'message': message
        }))