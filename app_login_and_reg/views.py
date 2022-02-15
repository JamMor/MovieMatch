from django.shortcuts import render, redirect
from django.contrib import messages
from .models import User
import bcrypt

# Create your views here.
def index(request):
    return render(request, 'app_login_and_reg/index.html')

def register(request):
    errors = User.objects.registration_validator(request.POST)
    if len(errors) > 0:
        for key, value in errors.items():
            messages.error(request,value)
        return redirect("/")
    else:
        hashed_pass = bcrypt.hashpw(request.POST['password'].encode(), bcrypt.gensalt()).decode()
        User.objects.create(
            name = request.POST['name'],
            email = request.POST['email'],
            password = hashed_pass,
        )
        request.session['user'] = User.objects.filter(email=request.POST['email'])[0].id
        return redirect('/trips')

def login(request):
    errors = User.objects.login_validator(request.POST)
    if len(errors) > 0:
        for key, value in errors.items():
            messages.error(request,value)
        return redirect("/")
    else:
        request.session['user'] = User.objects.filter(email=request.POST['email'])[0].id
        return redirect('/trips')

def logout(request):
    del request.session['user']
    return redirect('/')