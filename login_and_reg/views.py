from sys import prefix
from django.http import JsonResponse
from django.shortcuts import redirect, render, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from .forms import RegistrationForm
from list_builder.models import UserUUID
from list_builder.uuid_assigner import get_or_set_uuid

#Make class based
def register_view(request):
    if request.method == 'POST':
        user_form = RegistrationForm(request.POST, prefix='user')
        if user_form.is_valid():
            user = user_form.save()
            login(request, user)
            print("USER created from form")

            # FLAG maybe use get_or_set_uuid here to preserve temp data so far
            # FLAG maybe use signals to create useruuid on user creation
            user_uuid = UserUUID.objects.create(user_account = user)
            print(f'CREATED uuid: {user_uuid.uuid}')
            request.session['uuid'] = user_uuid.uuid

            return redirect('list_builder:default_redirect')
    elif request.method== "GET":
        user_form = RegistrationForm(prefix='user')
    return render(request, 'login_and_reg/register.html', {'user_form': user_form})

def login_view(request):
    if request.method == 'POST':
        sentUser = request.POST.get("username")
        sentPass = request.POST.get("password")
        print(f'Username: {sentUser}, Password: {sentPass}')

        login_form = AuthenticationForm(data=request.POST)
        print(f'AuthForm User: {login_form.get_user()}')
        status = "failure"
        if login_form.is_valid():
            username = login_form.cleaned_data["username"]
            password = login_form.cleaned_data["password"]
            user = login_form.get_user()
            if user is not None:
                # A backend authenticated the credentials
                login(request, user)
                status = "success"
            else:
                # No backend authenticated the credentials
                status = "failure"
        else:
            status = "failure"
            print(f'AuthForm User: {login_form.get_invalid_login_error()}')
    
    response = {"status": status}
    response.update({"errors" : login_form.errors})

    return JsonResponse(response)

def logout_view(request):
    logout(request)
    print("Logout SUCCESS")
    return redirect('list_builder:default_redirect')

# @login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')