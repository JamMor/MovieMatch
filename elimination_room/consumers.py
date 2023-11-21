import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder

from .command_requests import (
    request_connect,
    request_disconnect,
    request_eliminate,
    request_elimination_start,
    request_initialize,
    request_refresh_list,
)
from .json_socket_response_models import (
    FailedCommandResponse,
    SuccessfulCommandResponse,
)
from .serializer import SharedListEncoder


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

        json_response_obj = request_disconnect(self.sharecode, self.persona_uuid)

        if json_response_obj.status == "success":
            self.forward_command_response_to_group(json_response_obj.to_dict())
            # Leave group
            async_to_sync(self.channel_layer.group_discard)(
                self.match_group_name,
                self.channel_name
            )
        elif json_response_obj.status == "failure":
            print("Failed to disconnect.")
        else:
            print("Invalid status from request_disconnect")

    # Receive message from WebSocket Client
    def receive_json(self, content):
        command = content['command']
        # ELIMINATE
        if command == 'eliminate':

            json_response_obj = request_eliminate(
                self.sharecode, self.persona_uuid, content['shared_movie_id'])

            if json_response_obj.status == "success":
                self.forward_command_response_to_group(json_response_obj.to_dict())
            elif json_response_obj.status == "failure":
                self.send_json(json_response_obj.to_dict())
            else:
                print("Invalid status from request_eliminate")

        # INITIALIZE
        elif command == 'initialize':

            json_response_obj = request_initialize(self.sharecode)

            self.send_json(json_response_obj.to_dict())

        # START ELIMINATING
        elif command == 'elimination_start':

            json_response_obj = request_elimination_start(self.sharecode)

            if json_response_obj.status == "success":
                self.forward_command_response_to_group(json_response_obj.to_dict())
            elif json_response_obj.status == "failure":
                self.send_json(json_response_obj.to_dict())
            else:
                print("Invalid status from request_elimination_start")

        # REFRESH LIST
        elif command == 'refresh':

            json_response_obj = request_refresh_list(self.sharecode)

            if json_response_obj.status == "success":
                self.forward_command_response_to_group(json_response_obj.to_dict())
            elif json_response_obj.status == "failure":
                self.send_json(json_response_obj.to_dict())
            else:
                print("Invalid status from request_refresh_list")

        # FAILED COMMAND
        else:
            print(f'Command failure: {command}.')

            json_response_obj = FailedCommandResponse(
                command=command, errors=[f'Command failure: {command}.'])
            self.send_json(json_response_obj.to_dict())

    # Receive message from ChannelLayer
    def update_message(self, event):
        command = "updated"

        try:
            model_dict = SharedListEncoder(self.sharecode)
            json_response_object = SuccessfulCommandResponse(
                command=command, data={"share_list": model_dict})
        except:
            json_response_object = FailedCommandResponse(
                command=command, errors=["Error updating list."])

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


    # Custom JSON coders (for dates)
    @classmethod
    def decode_json(cls, text_data):
        return json.loads(text_data)

    @classmethod
    def encode_json(cls, content):
        return json.dumps(content, cls=DjangoJSONEncoder)
