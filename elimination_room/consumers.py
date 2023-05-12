# chat/consumers.py
import json
from random import randint
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder

from list_builder.models import Persona
from elimination_room.models import ShareRoomUser, SharedMovieList
from .serializer import SharedListEncoder
from .consumer_utils import find_next_index
from .json_response import SuccessfulCommandResponse, FailedCommandResponse
from .command_requests import request_connect, request_eliminate, request_initialize, request_elimination_start, request_refresh_list

from django.db.models import Max
from .queue_management import end_of_queue_position, select_next_eliminating_user

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

        json_response_obj = request_connect(self.sharecode, self.persona_uuid)

        if json_response_obj.status == "success":
            self.forward_command_response_to_group(json_response_obj.to_dict())
            self.accept()
        elif json_response_obj.status == "failure":
            print("Failed to connect.")
        else:
            print("Invalid status from request_connect")
            

    def disconnect(self, close_code):

        json_response_obj = SuccessfulCommandResponse(command="disconnected", data= {"disconnected_uuid" : self.persona_uuid})
        
        # Get this user persona and share room
        this_persona = Persona.objects.get(uuid = self.persona_uuid)
        share_list = SharedMovieList.objects.get(sharecode = self.sharecode)
        room_user = ShareRoomUser.objects.get(persona = this_persona, list = share_list)

        # Get current round and turn
        current_round = share_list.round
        current_turn = share_list.turn

        # If last active user, then set list to default round 0
        active_share_users_count = ShareRoomUser.objects.filter(list__sharecode = self.sharecode, is_active = True).count()
        if active_share_users_count == 1:
            share_list.round = 0
            share_list.save()

        elif active_share_users_count > 1:
            #If it was the user's turn and they had not eliminated, assign the next user to turn
            if room_user.position == current_turn and room_user.has_eliminated == False:
                next_share_user, current_round = select_next_eliminating_user(share_list)
                json_response_obj.add_data({"next_eliminating_uuid": next_share_user.persona.uuid})

            json_response_obj.add_data({"round" : current_round})

        room_user.is_active = False
        room_user.save()

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