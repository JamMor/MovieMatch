from .models import Persona


def get_or_set_persona(request):
    """
    Returns the Persona instance for logged user or uuid currently in session.
    If none exists, then creates and sets in session.
    """
    if request.user.is_authenticated:
        print("Logged in. Getting account Persona")
        try:
            logged_persona = request.user.persona
        except Exception as err:
            print(err)
            print("No Persona for user. Assigning one.")
            logged_persona = Persona.objects.create(user_account=request.user)
        request.session['uuid'] = logged_persona.uuid
        return logged_persona

    elif not request.user.is_authenticated:
        session_uuid = request.session.get("uuid")
        # Checks to see if uuid key exists and is set in session
        if session_uuid:
            print(f'UUID in session. Getting persona: {session_uuid}')
            try:
                return Persona.objects.get(uuid=session_uuid, user_account=None)
            except Persona.DoesNotExist:
                print("Can't find Persona stored in session.")

        # If no uuid in session, or Persona in session doesn't exist, create one
        new_persona = Persona.objects.create()
        print(f'CREATED uuid: {new_persona.uuid}')
        request.session['uuid'] = new_persona.uuid
        return new_persona
