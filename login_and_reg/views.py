from sys import prefix
from django.http import JsonResponse, HttpResponseNotAllowed 
from django.shortcuts import redirect, render, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
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
        'nickname': this_persona.nickname
    }
    return render(request, 'login_and_reg/account_settings.html', context)
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