# chat/consumers.py
import json
from random import randint
import random
from datetime import timedelta
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder

from list_builder.models import Persona
from elimination_room.models import SharedMovie, ShareRoomUser, SharedMovieList
from .serializer import SharedListEncoder
from .consumer_utils import find_next_index
from .json_response import SuccessJsonClassObject, FailedJsonClassObject, SuccessfulCommandResponse, FailedCommandResponse
from .command_requests import request_eliminate, request_initialize, request_elimination_start, request_refresh_list

class MatchConsumer(JsonWebsocketConsumer):
    def connect(self):
        
        self.sharecode = self.scope['url_route']['kwargs']['sharecode']
        self.match_group_name = 'match_%s' % self.sharecode
        self.persona_uuid = self.scope["session"]["uuid"]

        # Join group
        async_to_sync(self.channel_layer.group_add)(
            self.match_group_name,
            self.channel_name
        )

        # Get user and share room to link
        this_persona = Persona.objects.get(uuid = self.persona_uuid)
        share_list = SharedMovieList.objects.get(sharecode = self.sharecode)
        
        #Activate inactive user, or create new active user if hasn't joined yet
        room_user, created = ShareRoomUser.objects.update_or_create(
            persona = this_persona, 
            list = share_list,
            defaults={'is_active' : True}
        )
        
        #If an inactive room user becomes active again within enough time, 
        #keeps position (created_at time) in user list. If too much time 
        # has passed, treated as new connection and moved to end of queue.
        # if not created and (not room_user.last_active or timezone.now()-timedelta(minutes=1) < room_user.last_active):
        #     room_user.created_at = timezone.now()
        #     room_user.is_users_turn = False
            
        #====================================
        #If roomuser has no name, set usernick as nick. Else make anonymous
        if created:
            if this_persona.nickname:
                nickname = this_persona.nickname
            else:
                room_user_count = ShareRoomUser.objects.filter(list__sharecode = self.sharecode).count()
                print(f"Number of room users: {room_user_count}")
                nickname = f"User {room_user_count}"
            
            room_user.nickname = nickname

        room_user.save()
                
        #====================================
        # Tell group of connection
        user_data = {
            'uuid' : self.persona_uuid,
            'nickname' : room_user.nickname,
            'is_users_turn' : room_user.is_users_turn
        }
        json_response_obj = SuccessfulCommandResponse(command = "connected", data= user_data)

        self.forward_command_response_to_group(json_response_obj.to_dict())
        
        self.accept()

    def disconnect(self, close_code):
        #FLAG - Add prefetch, select_related
        #Query all active users in share list
        active_share_users_qs = ShareRoomUser.objects.filter(list__sharecode = self.sharecode, is_active = True).order_by('created_at')
        current_user = active_share_users_qs.get(persona__uuid = self.persona_uuid)
        
        json_response_obj = SuccessfulCommandResponse(command="disconnected", data= {"disconnected_uuid" : self.persona_uuid})

        #If it is users turn, assign next user to turn
        if current_user.is_users_turn:
            current_user.is_users_turn = False
            next_index = find_next_index(self.persona_uuid, list(active_share_users_qs.values_list('persona__uuid', flat=True)))
            next_user = active_share_users_qs[next_index]
            next_user.is_users_turn = True
            next_user.save()
            #SEND MESSAGE to channels update turn for all clients
            json_response_obj.add_data({"next_eliminating_uuid": next_user.persona.uuid})

        #Set current user inactive
        current_user.is_active = False
        current_user.last_active = timezone.now()
        current_user.save()


        # Tell group of disconnect
        self.forward_command_response_to_group(json_response_obj.to_dict())

        # Leave group
        async_to_sync(self.channel_layer.group_discard)(
            self.match_group_name,
            self.channel_name
        )

    # Receive message from WebSocket Client
    def receive_json(self, content):
        command = content['command']
        #ELIMINATE
        if command == 'eliminate':

            json_response_obj = request_eliminate(self.sharecode, self.persona_uuid, content)

            if json_response_obj.status == "success":
                self.forward_command_response_to_group(json_response_obj.to_dict())
            elif json_response_obj.status == "failure":
                self.send_json(json_response_obj.to_dict())
            else:
                print("Invalid status from request_eliminate")
                
        #INITIALIZE
        elif command == 'initialize':
            
            json_response_obj = request_initialize(self.sharecode)

            self.send_json(json_response_obj.to_dict())
        
        #START ELIMINATING
        elif command == 'elimination_start':
            
            json_response_obj = request_elimination_start(self.sharecode)
            
            if json_response_obj.status == "success":
                self.forward_command_response_to_group(json_response_obj.to_dict())
            elif json_response_obj.status == "failure":
                self.send_json(json_response_obj.to_dict())
            else:
                print("Invalid status from request_elimination_start")

        #REFRESH LIST
        elif command == 'refresh':
            
            json_response_obj = request_refresh_list(self.sharecode)
            
            if json_response_obj.status == "success":
                self.forward_command_response_to_group(json_response_obj.to_dict())
            elif json_response_obj.status == "failure":
                self.send_json(json_response_obj.to_dict())
            else:
                print("Invalid status from request_refresh_list")
        
        #FAILED COMMAND
        else:
            print(f'Command failure: {command}.')
            
            json_response_obj = FailedCommandResponse(command=command, errors=[f'Command failure: {command}.'])
            self.send_json(json_response_obj.to_dict())

    # Receive message from ChannelLayer
    def update_message(self, event):
        command="updated"

        try:
            model_dict = SharedListEncoder(self.sharecode)
            json_response_object = SuccessfulCommandResponse(command=command, data={"share_list": model_dict})
        except:
            json_response_object = FailedCommandResponse(command=command, errors=["Error updating list."])
        
        self.send_json(json_response_object.to_dict())
        

    # Receive json encoded message from ChannelLayer and forward to client
    def send_command_response_to_client(self, event):
        json_response = event.get("json_response")

        # Send message to WebSocket Client
        self.send(text_data=json_response)

    # Send json encoded message to ChannelLayer (group send)
    def forward_command_response_to_group(self, json_response):
        encoded_json_response = self.encode_json(json_response)
        async_to_sync(self.channel_layer.group_send)(
            self.match_group_name,
            {
                'type': 'send_command_response_to_client',
                'json_response': encoded_json_response
            }
        )


    #Custom JSON coders (for dates)
    @classmethod
    def decode_json(cls, text_data):
        return json.loads(text_data)

    @classmethod
    def encode_json(cls, content):
        return json.dumps(content, cls=DjangoJSONEncoder)