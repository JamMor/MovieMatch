# chat/consumers.py
import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder

from display_app.models import SharedMovieList
from .serializer import SharedListEncoder

class MatchConsumer(JsonWebsocketConsumer):
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
    def receive_json(self, content):
        print(content)
        command = content['command']
        user_uuid = self.scope["session"]["uuid"]

        if command == 'eliminate':
            movie_id = content['movie_id']
            #Eliminate movie
            #----logic----

            #Confirm Removal for Group
            send_content = {
            'command': 'eliminate',
            'status' : "success",
            'message': f'Movie ID {movie_id} eliminated by {user_uuid}.'
            }

            async_to_sync(self.channel_layer.group_send)(
                self.match_group_name,
                {
                    'type': 'eliminate_message',
                    'content': send_content
                }
            )

        elif command == 'initialize':
            print("Sharecode from Receive: " + self.sharecode)
            model_dict = SharedListEncoder(self.sharecode)

            self.send_json({
                'command': 'initialize',
                'status' : 'success',
                'share_list': model_dict
            })
        
        else:
            self.send_json({
                'command': command,
                'status' : 'failed',
                'error_message' : "Command not found."
            })

    # Receive message from ChannelLayer
    def eliminate_message(self, event):
        content = event['content']

        # Send message to WebSocket Client
        self.send_json(content)

    #Custom JSON coders (for dates)
    @classmethod
    def decode_json(cls, text_data):
        return json.loads(text_data)

    @classmethod
    def encode_json(cls, content):
        return json.dumps(content, cls=DjangoJSONEncoder)