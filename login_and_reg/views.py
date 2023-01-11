from sys import prefix
from django.http import JsonResponse, HttpResponseNotAllowed 
from django.shortcuts import redirect, render, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from .forms import RegistrationForm, PersonaForm
from list_builder.models import Persona
from list_builder.persona_assigner import get_or_set_persona

#FLAG Make class based
def register_view(request):
    if request.method == 'POST':
        user_form = RegistrationForm(request.POST, prefix='user')
        persona_form = PersonaForm(request.POST, prefix='persona')
        if user_form.is_valid() and persona_form.is_valid():
            user = user_form.save()
            persona = persona_form.save(commit=False)
            persona.user_account = user
            persona.save()

            login(request, user)
            print(f'CREATED user: <<{user.username}>> from form')
            print(f'CREATED persona: {persona.uuid} for {user.username}')

            #Set uuid in session
            request.session['uuid'] = persona.uuid

            return redirect('list_builder:default_redirect')
    elif request.method== "GET":
        user_form = RegistrationForm(prefix='user')
        persona_form = PersonaForm(prefix='persona')
    return render(request, 'login_and_reg/register.html', {'user_form': user_form, 'persona_form': persona_form})

def login_view(request):
    if request.method == 'POST':
        sentUser = request.POST.get("username")
        sentPass = request.POST.get("password")
        print(f'Username: {sentUser}, Password: {sentPass}')

        login_form = AuthenticationForm(data=request.POST)
        print(f'AuthForm User: {login_form.get_user()}')
        status = "failure"
        if login_form.is_valid():
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

@login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')
def account_settings_view(request):
    this_persona = get_or_set_persona(request)
    context = { 
        'nickname': this_persona.nickname,
        'change_password_form' : PasswordChangeForm(request.user)
    }
    return render(request, 'login_and_reg/account_settings.html', context)

@login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')
def change_nickname_view(request):
    this_persona = get_or_set_persona(request)
    if request.method == 'POST':
        json_response = {"status":"error", "message":"An unknown error occurred.", "errors":[]} #Default response
        nickname = request.POST.get('change-nickname-input')
        nickname = nickname.strip()

        if nickname != this_persona.nickname:
            this_persona.nickname = nickname
            try:
                this_persona.full_clean()
                this_persona.save()
                json_response.update({"status":"success", "message":"Nickname changed.", "data": {"nickname":f"{nickname}"}})
            except Exception as err:
                json_response.update({"status":"failure", "message":"Nickname not changed.", "errors":[repr(err)]})
        else:
            json_response.update({"status":"failure", "message":"Nickname not changed.", "errors":["Already the current nickname."]})
        return JsonResponse(json_response)

    return HttpResponseNotAllowed(['POST'])

@login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')
def change_password_view(request):
    this_persona = get_or_set_persona(request)
    if request.method == 'POST':
        json_response = {"status":"error", "message":"An unknown error occurred.", "errors":[]} #Default response
        print(request.POST)
        change_password_form = PasswordChangeForm(request.user, request.POST)
        if change_password_form.is_valid():
            user = change_password_form.save()
            update_session_auth_hash(request, user) # Keeps user logged in.
            json_response.update({"status":"success", "message":"Password changed."})
        else:
            json_response.update({"status":"failure", "message":"Password not changed.", "errors":change_password_form.errors})

        return JsonResponse(json_response)

    return HttpResponseNotAllowed(['POST'])
@login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')
def delete_account_view(request):
    if request.method == 'POST':
        verification_check = request.POST.get('account-delete-verification-check')
        verification_password = request.POST.get('account-delete-verification-password')
        json_response = {"status":"error", "message":"An unknown error occurred.", "errors":[]}

        if verification_check != 'on':
            json_response.update({"status":"failure", "message":"Account not deleted.", "errors":["Account delete verification check failed."]})
        elif not request.user.check_password(verification_password):
            json_response.update({"status":"failure", "message":"Account not deleted.", "errors":["Incorrect password."]})
        else:
            json_response.update({"status":"success", "message":"Account deleted."})
            del json_response['errors']
            request.user.delete()
            logout(request)

        return JsonResponse(json_response)

    return HttpResponseNotAllowed(['POST'])