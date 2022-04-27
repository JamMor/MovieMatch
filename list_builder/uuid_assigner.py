from .models import UserUUID

def get_or_set_uuid(request):
    """
    Returns the UserUUID instance for logged user, or uuid currently in session.
    If none exists, then creates and sets in session.
    """
    if request.user.is_authenticated:
        print("Logged in. Getting account UUID")
        try:
            logged_uuid = request.user.user_uuid
        except Exception as err:
            print(err)
            print("No UUID for user. Assigning one.")
            logged_uuid = UserUUID.objects.create(user_account = request.user)
        request.session['uuid'] = logged_uuid.uuid
        return logged_uuid

    elif not request.user.is_authenticated:
        session_uuid = request.session.get("uuid")
        #Checks to see if uuid key exists and is set in session
        if session_uuid:
            print(f'UUID in session. Getting uuid: {session_uuid}')
            try:
                user_uuid = UserUUID.objects.get(uuid = session_uuid)
                return user_uuid
            except UserUUID.DoesNotExist:
                print("Can't find UserUUID stored in session.")

        # If no uuid in session, or UserUUID in session doesn't exist, create one
        user_uuid = UserUUID.objects.create()
        print(f'CREATED uuid: {user_uuid.uuid}')
        request.session['uuid'] = user_uuid.uuid
        return user_uuid