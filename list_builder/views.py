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
from .uuid_assigner import get_or_set_uuid

# Displays main page
def index(request):
    user_uuid = get_or_set_uuid(request)
    return render(request, 'list_builder/index.html')