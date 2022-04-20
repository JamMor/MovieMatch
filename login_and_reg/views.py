from sys import prefix
from django.http import JsonResponse
from django.shortcuts import redirect, render, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from .forms import RegistrationForm

#Make class based
def register_view(request):
    if request.method == 'POST':
        user_form = RegistrationForm(request.POST, prefix='user')
        if user_form.is_valid():
            user = user_form.save()
            login(request, user)
            print("USER created from form")
            return redirect('list_builder:default_redirect')
    elif request.method== "GET":
        user_form = RegistrationForm(prefix='user')
    return render(request, 'login_and_reg/register.html', {'user_form': user_form})

def login_view(request):
    if request.method == 'POST':
        login_form = AuthenticationForm(request.POST)
        print(login_form)
        if login_form.is_valid():
            print("USER form valid")
            username = login_form.cleaned_data["username"]
            password = login_form.cleaned_data["password"]
            user = authenticate(username = username, password = password)
            if user is not None:
                # A backend authenticated the credentials
                login(request, user)
                print("Login SUCCESS")
                success = True
            else:
                # No backend authenticated the credentials
                print("Login FAILED")
                success = False
    print(f'Success: {success}')
    return JsonResponse({'success': success})

def logout_view(request):
    logout(request)
    print("Logout SUCCESS")
    return redirect('list_builder:default_redirect')

# @login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')