from sys import prefix
from django.http import JsonResponse, HttpResponseNotAllowed 
from django.shortcuts import redirect, render, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from movie_match.custom_decorators import login_required_json
from django.contrib.auth.password_validation import validate_password
from .forms import RegistrationForm, PersonaForm
from list_builder.models import Persona
from list_builder.persona_assigner import get_or_set_persona
from movie_match.json_response_models import SuccessJsonClassObject, FailedJsonClassObject, FailedFormResponse

@require_http_methods(['GET', 'POST'])
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

@require_POST
def login_view(request):
    login_form = AuthenticationForm(data=request.POST)

    if login_form.is_valid():
        user = login_form.get_user()
        if user is not None:
            # A backend authenticated the credentials
            login(request, user)
            return JsonResponse(SuccessJsonClassObject().to_dict())
        else:
            # No backend authenticated the credentials
            pass
    else:
        # The form is not valid
        pass
    
    return JsonResponse(FailedFormResponse(form_errors=login_form.errors).to_dict())

@require_GET
@login_required_json(error_msg = "Only logged in users can logout.")
def logout_view(request):
    logout(request)
    return redirect('list_builder:default_redirect')

@require_GET
@login_required(redirect_field_name='default_redirect', login_url='list_builder:default_redirect')
def account_settings_view(request):
    this_persona = get_or_set_persona(request)
    context = { 
        'nickname': this_persona.nickname,
        'change_nickname_form' : PersonaForm(instance=this_persona),
        'change_password_form' : PasswordChangeForm(request.user)
    }
    return render(request, 'login_and_reg/account_settings.html', context)

@require_POST
@login_required_json(error_msg = "Only logged in users can change their nickname.")
def change_nickname_view(request):    
    this_persona = get_or_set_persona(request)
    
    change_nickname_form = PersonaForm(request.POST, instance=this_persona)
    
    if change_nickname_form.is_valid():
        try:
            updated_persona = change_nickname_form.save()
            return JsonResponse(SuccessJsonClassObject(message="Nickname changed.", data={"nickname":updated_persona.nickname}).to_dict())
        except Exception as err:
            return JsonResponse(FailedJsonClassObject(message="An unknown error occurred.", errors=[err]))

    return JsonResponse(FailedFormResponse(form_errors=change_nickname_form.errors).to_dict())

@require_POST
@login_required_json(error_msg = "Only logged in users can change their password.")
def change_password_view(request):    
    this_persona = get_or_set_persona(request)
    
    change_password_form = PasswordChangeForm(request.user, request.POST)
    if change_password_form.is_valid():
        user = change_password_form.save()
        update_session_auth_hash(request, user) # Keeps user logged in.
        return JsonResponse(SuccessJsonClassObject(message="Password changed.").to_dict())
    
    return JsonResponse(FailedFormResponse(form_errors=change_password_form.errors).to_dict())


@require_POST
@login_required_json(error_msg = "Only logged in users can delete their account.")
def delete_account_view(request):    
    verification_check = request.POST.get('account-delete-verification-check')
    verification_password = request.POST.get('account-delete-verification-password')

    if verification_check != 'on':
        return JsonResponse(FailedJsonClassObject(errors=["Account delete verification check failed"]).to_dict())
    elif not request.user.check_password(verification_password):
        return JsonResponse(FailedJsonClassObject(errors=["Incorrect password"]).to_dict())
    else:
        request.user.delete()
        logout(request)
        return JsonResponse(SuccessJsonClassObject(message="Account deleted.").to_dict())
