# chat/consumers.py
import json
from random import randint
from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder

from display_app.models import SharedMovieList, SharedMovie, UserUUID, ShareRoomUser
from .serializer import SharedListEncoder
from .consumer_utils import find_next_index

class MatchConsumer(JsonWebsocketConsumer):
    def connect(self):
        
        self.sharecode = self.scope['url_route']['kwargs']['sharecode']
        self.match_group_name = 'match_%s' % self.sharecode
        self.user_uuid = self.scope["session"]["uuid"]

        # Join group
        async_to_sync(self.channel_layer.group_add)(
            self.match_group_name,
            self.channel_name
        )

        # Tell group of connection
        user_uuid = self.scope["session"]["uuid"]
        
        # Get user and share room to link
        user = UserUUID.objects.get(uuid = self.user_uuid)
        share_list = SharedMovieList.objects.get(sharecode = self.sharecode)
        
        #Activate inactive user, or create new active user if hasn't joined yet
        room_user, created = ShareRoomUser.objects.update_or_create(
            user_uuid = user, 
            list = share_list,
            defaults={'is_active' : True}
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
        #FLAG - Add prefetch, select_related
        #Query all active users in share list
        share_users_qs = ShareRoomUser.objects.filter(list__sharecode = self.sharecode, is_active = True).order_by('created_at')
        current_user = share_users_qs.get(user_uuid__uuid = self.user_uuid)
        

        #If it is users turn, assign next user to turn
        if current_user.is_users_turn:
            current_user.is_users_turn = False
            next_index = find_next_index(self.user_uuid, list(share_users_qs.values_list('user_uuid__uuid', flat=True)))
            next_user = share_users_qs[next_index]
            next_user.is_users_turn = True
            next_user.save()
            #SEND MESSAGE to channels update turn for all clients
            channel_msg['next_eliminating_uuid'] = next_user.user_uuid.uuid

        #Set current user inactive
        current_user.is_active = False
        current_user.last_active = timezone.now()
        current_user.save()


        # Tell group of disconnect
        async_to_sync(self.channel_layer.group_send)(
                self.match_group_name,
                {
                    'type': 'disconnect_message',
                    'disconnected_uuid': user_uuid
                }
        )

        # Leave group
        async_to_sync(self.channel_layer.group_discard)(
            self.match_group_name,
            self.channel_name
        )

    # Receive message from WebSocket Client
    def receive_json(self, content):
        print(content)
        command = content['command']
        print(f'COMMAND RECEIVED - Consumers: {command}')
        #ELIMINATE
        if command == 'eliminate':
            
            share_users_qs = ShareRoomUser.objects.filter(list__sharecode = self.sharecode, is_active = True).order_by('created_at')
            #If it isn't any user's turn, elimination hasn't started. Return failed msg
            if share_users_qs.filter(is_users_turn = True).count() == 0:
                self.send_json({
                        'type': 'eliminate_message',
                        'status' : 'failed',
                        'error_message' : "List not set to allow elimination."
                })
                return
            #If it isn't THIS user's turn. Return failed msg
            this_user = share_users_qs.get(user_uuid__uuid = self.user_uuid)
            if not this_user.is_users_turn:
                self.send_json({
                        'type': 'eliminate_message',
                        'status' : 'failed',
                        'error_message' : "Not this users turn."
                })
                return
            #If elimination has started:
            shared_movie_id = content['shared_movie_id']
            uneliminated_movies_qs = SharedMovie.objects.filter(shared_list__sharecode = self.sharecode, is_eliminated = False)
            movies_left = uneliminated_movies_qs.count()

            #If available movies > 1
            if movies_left > 1:
                #Eliminate movie
                shared_movie = uneliminated_movies_qs.get(id=shared_movie_id)
                shared_movie.is_eliminated = True
                shared_movie.save()
                movies_left -= 1
                
                #Pick next user
                current_user = share_users_qs.get(user_uuid__uuid = self.user_uuid)
                current_user.is_users_turn = False
                next_index = find_next_index(self.user_uuid, list(share_users_qs.values_list('user_uuid__uuid', flat=True)))
                next_user = share_users_qs[next_index]
                next_user.is_users_turn = True
                next_user.save()

                #Confirm Removal for Group
                async_to_sync(self.channel_layer.group_send)(
                    self.match_group_name,
                    {
                        'type': 'eliminate_message',
                        'shared_movie_id' : shared_movie_id,
                        'eliminating_uuid' : self.user_uuid,
                    }
                )

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
            share_users_qs = ShareRoomUser.objects.filter(list__sharecode = self.sharecode, is_active = True)
            users_eliminating = share_users_qs.filter(is_users_turn = True).count()
            if users_eliminating > 0:
                print("Elimination already in progress.")
                return
                
            #Randomly pick user to start
            eliminating_user = random.choice(share_users_qs)
            eliminating_user.is_users_turn = True
            eliminating_user.save()
                        
            async_to_sync(self.channel_layer.group_send)(
                    self.match_group_name,
                    {
                        'type': 'elimination_start',
                        'eliminating_uuid': eliminating_user.user_uuid.uuid
                    }
                )
        
        #REFRESH LIST
        elif command == 'refresh':
            
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