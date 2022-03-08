# chat/consumers.py
import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder

from display_app.models import SharedMovieList, SharedMovie, UserUUID, ShareRoomUser
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

        # Tell group of connection
        user_uuid = self.scope["session"]["uuid"]
        
        # Get user and share room to link
        user = UserUUID.objects.get(uuid = user_uuid)
        share_list = SharedMovieList.objects.get(sharecode = self.sharecode)
        
        #====================================
        room_user, created = ShareRoomUser.objects.get_or_create(
            user_uuid = user, 
            list = share_list
            )
        
        nickname = user.nickname
        print(f'User nickname in consumer is: {nickname}')

        if not nickname:
            print("User has no nick.")
            if not room_user.nickname:
                print("Set a generic roomuser name.")
                user_no = ShareRoomUser.objects.filter(list__sharecode = self.sharecode).count()
                print(f"Number of room users: {user_no}")
                nickname = f"User {user_no}"
            else:
                nickname = room_user.nickname
                print(f'Roomuser already has generic name: {nickname}')
        
        print(f'RoomUser nickname in consumer is: {nickname}')
        room_user.nickname = nickname
        room_user.save()
        
        #====================================
        print("Connecting User - Consumers")
        print({user_uuid : {'nickname' : room_user.nickname, 'is_ready' : room_user.is_ready}})
        async_to_sync(self.channel_layer.group_send)(
                self.match_group_name,
                {
                    'type': 'connect_message',
                    'connected_user': {user_uuid : {'nickname' : room_user.nickname, 'is_ready' : room_user.is_ready}}
                }
        )

        self.accept()

    def disconnect(self, close_code):
        print("Disconnecting User - Consumers")
        # Tell group of disconnect
        user_uuid = self.scope["session"]["uuid"]
        async_to_sync(self.channel_layer.group_send)(
                self.match_group_name,
                {
                    'type': 'disconnect_message',
                    'disconnected_uuid': user_uuid
                }
        )

        # Get and delete user from room
        room_user = ShareRoomUser.objects.get(user_uuid__uuid = user_uuid, list__sharecode = self.sharecode)
        room_user.delete()

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
            shared_movie_id = content['shared_movie_id']
            
            #Eliminate movie
            shared_movie = SharedMovie.objects.get(id=shared_movie_id)
            shared_movie.is_eliminated = True
            shared_movie.save()

            #Confirm Removal for Group
            send_content = {
            'command': 'eliminated',
            'status' : "success",
            'shared_movie_id' : shared_movie_id,
            'message': f'Movie ID {shared_movie_id} eliminated by {user_uuid}.'
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
                'command': 'initialized',
                'status' : 'success',
                'share_list': model_dict
            })
        
        else:
            self.send_json({
                'command': command,
                'status' : 'failed',
                'error_message' : f'Command failure: {command}.'
            })

    # Receive message from ChannelLayer
    def eliminate_message(self, event):
        content = event['content']

        # Send message to WebSocket Client
        self.send_json(content)
    
    # Receive message from ChannelLayer
    def update_message(self, event):
        model_dict = SharedListEncoder(self.sharecode)

        # Send message to WebSocket Client
        self.send_json({
            'command': 'updated',
            'status' : 'success',
            'share_list': model_dict
        })
    
    # Receive message from ChannelLayer
    def connect_message(self, event):
        connected_user = event['connected_user']

        # Send message to WebSocket Client
        self.send_json({
            'command': 'connected',
            'status' : 'success',
            'user': connected_user
        })
    # Receive message from ChannelLayer
    def disconnect_message(self, event):
        disconnected_uuid = event['disconnected_uuid']

        # Send message to WebSocket Client
        self.send_json({
            'command': 'disconnected',
            'status' : 'success',
            'uuid': disconnected_uuid
        })

    #Custom JSON coders (for dates)
    @classmethod
    def decode_json(cls, text_data):
        return json.loads(text_data)

    @classmethod
    def encode_json(cls, content):
        return json.dumps(content, cls=DjangoJSONEncoder)