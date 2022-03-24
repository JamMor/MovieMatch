# chat/consumers.py
import json
from random import randint
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
        print(f'COMMAND RECEIVED - Consumers: {command}')
        #ELIMINATE
        if command == 'eliminate':
            shared_list = SharedMovieList.objects.get(sharecode = self.sharecode)
            if shared_list.started_eliminating == False:
                self.send_json({
                        'type': 'eliminate_message',
                        'status' : 'failed',
                        'error_message' : "List not set to allow elimination."
                })
            else:
                shared_movie_id = content['shared_movie_id']
                movies_in_list = SharedMovie.objects.filter(shared_list__sharecode = self.sharecode, is_eliminated = False).count()
                print(f"There are {movies_in_list} in shared list {self.sharecode}.")
                
                if movies_in_list > 1:
                    #Eliminate movie
                    shared_movie = SharedMovie.objects.get(id=shared_movie_id)
                    shared_movie.is_eliminated = True
                    shared_movie.save()
                    movies_in_list -= 1

                    #Get next eliminating user
                    share_users = list(ShareRoomUser.objects.filter(list = shared_list).order_by('created_at'))
                    user_count = len(share_users)
                    for i in range(-user_count, 0):
                        if share_users[i].user_uuid.uuid == content['uuid']:
                            print(f'User {content["uuid"]} is at index {i}')
                            next_index = i + 1
                            break
                    next_eliminating_uuid = share_users[next_index].user_uuid.uuid
                    
                    #Test if sent uuid = json uuid from socket message (Sould be true)
                    print(f'UUIDS are {self.scope["session"]["uuid"] == content["uuid"]}')
                    
                    #Confirm Removal for Group
                    async_to_sync(self.channel_layer.group_send)(
                        self.match_group_name,
                        {
                            'type': 'eliminate_message',
                            'shared_movie_id' : shared_movie_id,
                            'eliminating_uuid' : content['uuid'],
                            'next_eliminating_uuid' : next_eliminating_uuid
                        }
                    )
                if movies_in_list == 1:
                    final_movie = SharedMovie.objects.filter(shared_list__sharecode = self.sharecode, is_eliminated = False).first()
                    async_to_sync(self.channel_layer.group_send)(
                        self.match_group_name,
                        {
                            'type': 'final_message',
                            'shared_movie_id' : final_movie.id
                        }
                    )
                else:
                    print(f"Movie List Error. {movies_in_list} in list.")

        #INITIALIZE
        elif command == 'initialize':
            print("Sharecode from Receive: " + self.sharecode)
            model_dict = SharedListEncoder(self.sharecode)

            self.send_json({
                'command': 'initialized',
                'status' : 'success',
                'share_list': model_dict
            })
        
        #START ELIMINATING
        elif command == 'elimination_start':
            shared_list = SharedMovieList.objects.get(sharecode = self.sharecode)
            if shared_list.started_eliminating:
                print("Elimination already started.")
                return
            shared_list.started_eliminating = True
            shared_list.save()

            share_users = list(ShareRoomUser.objects.filter(list = shared_list).order_by('created_at'))
            
            #Randomly pick user to start
            user_count = len(share_users)
            eliminating_user = share_users[randint(0,user_count-1)]
            eliminating_user.is_users_turn = True
            #Consider making start eliminating only able to be pressed when false in JS
            #and python
            #Reset movies option before final movie??
            
            async_to_sync(self.channel_layer.group_send)(
                    self.match_group_name,
                    {
                        'type': 'elimination_start',
                        'eliminating_uuid': eliminating_user.user_uuid.uuid
                    }
                )
        
        #REFRESH LIST
        elif command == 'refresh':
            shared_list = SharedMovieList.objects.get(sharecode = self.sharecode)
            shared_list.started_eliminating = False
            shared_list.save()
            
            SharedMovie.objects.filter(shared_list__sharecode = self.sharecode).update(is_eliminated = False)

            async_to_sync(self.channel_layer.group_send)(
                    self.match_group_name,
                    {
                        'type': 'refresh_message'
                    }
                )
        
        #FAILED COMMAND
        else:
            print(f'Command failure: {command}.')
            self.send_json({
                'command': command,
                'status' : 'failed',
                'error_message' : f'Command failure: {command}.'
            })

    # Receive message from ChannelLayer
    def eliminate_message(self, event):
        shared_movie_id = event['shared_movie_id']
        eliminating_uuid = event['eliminating_uuid']
        next_eliminating_uuid = event['next_eliminating_uuid']

        # Send message to WebSocket Client
        self.send_json({
            'command': 'eliminated',
            'status' : "success",
            'shared_movie_id' : shared_movie_id,
            'eliminating_uuid' : eliminating_uuid,
            'next_eliminating_uuid' : next_eliminating_uuid
        })
    
    def final_message(self, event):
        shared_movie_id = event['shared_movie_id']

        # Send message to WebSocket Client
        self.send_json({
            'command': 'finalized',
            'status' : "success",
            'shared_movie_id' : shared_movie_id
        })
    
    def elimination_start(self, event):
        eliminating_uuid = event['eliminating_uuid']

        # Send message to WebSocket Client
        self.send_json({
                'command': 'elimination_started',
                'status' : 'success',
                'eliminating_uuid' : eliminating_uuid
            })
    
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
    def refresh_message(self, event):
        model_dict = SharedListEncoder(self.sharecode)

        # Send message to WebSocket Client
        self.send_json({
            'command': 'refreshed',
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