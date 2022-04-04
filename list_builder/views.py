from random import randint
from django.db import IntegrityError
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.urls import reverse
from list_builder.models import UserUUID
# from app_login_and_reg.models import User
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def get_or_set_uuid(request):
    #Checks to see if uuid key exists and is set in session
    if 'uuid' in request.session and request.session['uuid']:
        print("UUID in session.")
        print(f'GET uuid: {request.session["uuid"]} =================================')
        try:
            user_uuid = UserUUID.objects.get(uuid = request.session['uuid'])
            return user_uuid
        except UserUUID.DoesNotExist:
            print("Can't find UserUUID stored in session.")
    # If no uuid in session, or UserUUID doesn't exist
    user_uuid = UserUUID.objects.create()
    print(f'CREATED uuid: {user_uuid.uuid} =================================')
    request.session['uuid'] = user_uuid.uuid
    return user_uuid

# Displays main page
def index(request):
    user_uuid = get_or_set_uuid(request)
    return render(request, 'list_builder/index.html')