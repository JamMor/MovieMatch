from list_builder.models import Persona

from .json_socket_response_models import (
    FailedCommandResponse,
    SuccessfulCommandResponse,
)
from .models import EliminationSession, EliminationSessionUser, SharedMovie
from .queue_management import (
    assign_anonymous_nickname,
    assign_round_order,
    end_of_queue_position,
    select_next_eliminating_user,
)
from .serializer import elimination_session_encoder


def request_connect(sharecode, persona_uuid):
    """
    Request to connect to elimination session.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable 
    dictionary. Successful response returns the uuid, round, position, and 
    nickname of the connecting user.
    """

    command = "connected"

    # Get this user persona and elimination session
    this_persona = Persona.objects.get(uuid=persona_uuid)
    elimination_session = EliminationSession.objects.get(sharecode=sharecode)

    # Activate inactive user, or create new active user if hasn't joined yet
    session_user, created = EliminationSessionUser.objects.get_or_create(
        persona=this_persona,
        elimination_session=elimination_session
    )

    # If a returning user, determine position and round placement
    if not created:

        # For users rejoining before the end of the current round who missed
        #   their turn, move to end of queue
        if (
            (not session_user.has_eliminated)
            and (session_user.position > 0)
            and (session_user.position < elimination_session.turn)
        ):
            session_user.position = end_of_queue_position(elimination_session)
        # For users rejoining before the end of the current round who have not
        #   yet taken their turn, do nothing
        # For users rejoining before the end of the current round who have
        #   already taken their turn, do nothing

    if not session_user.nickname:
        # Set nickname to this_persona.nickname if any, or run assign_nickname
        nickname = this_persona.nickname if this_persona.nickname else assign_anonymous_nickname(elimination_session)
        session_user.nickname = nickname

    session_user.is_active = True
    session_user.save()

    # Tell group of connection
    user_data = {
        'uuid': persona_uuid,
        'nickname': session_user.nickname,
        'position': session_user.position
    }

    return SuccessfulCommandResponse(command=command, data=user_data)


def request_disconnect(sharecode, persona_uuid):
    """
    Request to disconnect from elimination session.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    Successful response returns the disconnected uuid. If disconnecting user was 
    in the middle of their turn, a successful response will also include the 
    next eliminating uuid and the round.
    """

    command = "disconnected"

    disconnect_data = {"disconnected_uuid": persona_uuid}

    # Get the session and user
    session_user = EliminationSessionUser.objects.select_related("elimination_session").get(
        persona__uuid=persona_uuid, elimination_session__sharecode=sharecode)
    elimination_session = session_user.elimination_session

    # If last active user, then set elimination session to inactive
    active_session_users_count = EliminationSessionUser.objects.filter(
        elimination_session=elimination_session, is_active=True).count()
    if active_session_users_count == 1:
        elimination_session.is_active = False
        elimination_session.save()
        EliminationSessionUser.objects.filter(elimination_session=elimination_session).update(
            is_active=False,
            has_eliminated=False,
            position=0
        )

    elif active_session_users_count > 1:
        # If it was the user's turn and they had not eliminated, assign the next user to turn
        if (
            (elimination_session.is_active == True)
            and (session_user.position == elimination_session.turn)
            and (session_user.has_eliminated == False)
        ):
            next_eliminating_user, updated_positions = select_next_eliminating_user(
                elimination_session)
            disconnect_data.update(
                {"next_eliminating_uuid": next_eliminating_user.persona.uuid})

            # Send new order if any
            if updated_positions != None:
                disconnect_data.update({
                    "updated_positions": updated_positions
                })

        session_user.is_active = False
        session_user.save()

    return SuccessfulCommandResponse(command=command, data=disconnect_data)


def request_eliminate(sharecode, persona_uuid, shared_movie_id):
    """
    Request to eliminate a movie from the list.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    On succesful elimination, response will include 
    "shared_movie_id, eliminating_uuid, and next_eliminating_uuid".
    May include "final_shared_movie_id" if last elimination
    """

    command = "eliminated"

    elimination_session = EliminationSession.objects.get(sharecode=sharecode)
    active_session_users_qs = EliminationSessionUser.objects.filter(
        elimination_session=elimination_session, is_active=True)
    # .order_by('created_at')

    # Error handling
    # If elimination hasn't started. Return failed msg
    if elimination_session.is_active == False:
        return FailedCommandResponse(command=command, errors=["Not set to allow elimination."])

    # If it isn't THIS user's turn. Return failed msg
    this_user = active_session_users_qs.get(persona__uuid=persona_uuid)
    if this_user.position != elimination_session.turn:
        return FailedCommandResponse(command=command, errors=["Not this users turn."])
    if this_user.has_eliminated == True:
        return FailedCommandResponse(command=command, errors=["Already voted this round."])

    # If elimination has started:
    uneliminated_movies_qs = SharedMovie.objects.filter(
        elimination_session=elimination_session, is_eliminated=False)
    movies_left = uneliminated_movies_qs.count()

    successful_response = SuccessfulCommandResponse(command=command)

    # If still movies to eliminate
    if movies_left > 1:
        # Eliminate movie
        try:
            shared_movie = uneliminated_movies_qs.get(id=shared_movie_id)
        except SharedMovie.DoesNotExist:
            print("Can't find selected movie (probably already eliminated).")
            return FailedCommandResponse(command=command, errors=["Shared movie not found in uneliminated movies."])
        shared_movie.is_eliminated = True
        shared_movie.save()
        this_user.has_eliminated = True
        this_user.save()
        movies_left -= 1
        successful_response.add_data({
            "eliminating_uuid": persona_uuid,
            "shared_movie_id": shared_movie_id})

        # If still potential movies to eliminate, pick next user
        if movies_left > 1:
            next_eliminating_user, updated_positions = select_next_eliminating_user(elimination_session)
            successful_response.add_data({
                "next_eliminating_uuid": next_eliminating_user.persona.uuid
            })

            # Send new order if any
            if updated_positions != None:
                successful_response.add_data({
                    "updated_positions": updated_positions
                })

    # If last movie eliminated
    if movies_left == 1:
        final_movie = uneliminated_movies_qs.first()
        successful_response.add_data({"final_shared_movie_id": final_movie.id})

    return successful_response


def request_initialize(sharecode):
    """
    Request to intialize an elimination session.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable 
    dictionary. Successful response returns the elimination session state with 
    active users and movies as "elimination_session".
    """

    command = "initialized"

    try:
        session_dict = elimination_session_encoder(sharecode)
        return SuccessfulCommandResponse(command=command, data={"elimination_session": session_dict})
    except:
        return FailedCommandResponse(command=command, errors=["Error initializing session."])


def request_elimination_start(sharecode):
    """
    Request to start elimination in an elimination session.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable 
    dictionary. Successful response returns the "eliminating_uuid" of the first 
    selecting user and a dictionary of active users with positions.
    """

    command = "elimination_started"

    elimination_session = EliminationSession.objects.get(sharecode=sharecode)

    # If elimination already in progress, return failed response
    if elimination_session.is_active:
        return FailedCommandResponse(command=command, errors=["Elimination already in progress."])

    # If less than 2 movies in list, return failed response
    if SharedMovie.objects.filter(elimination_session=elimination_session).count() < 2:
        return FailedCommandResponse(
            command=command,
            errors=["Must be at least 2 movies in list to begin eliminating."]
        )

    # Assign User Order and Retrieve First User
    eliminating_user, updated_positions = assign_round_order(elimination_session)

    return SuccessfulCommandResponse(command=command, data={
        "eliminating_uuid": eliminating_user.persona.uuid,
        "updated_positions": updated_positions
    })


def request_refresh_list(sharecode):
    """
    Request to refresh an elimination session to redo elimination.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable 
    dictionary. Successful response returns the elimination session state of users and all 
    movies un-eliminated as "elimination_session".
    """

    command = "refreshed"

    # Set elimination session to inactive
    elimination_session = EliminationSession.objects.get(sharecode=sharecode)
    elimination_session.is_active = False
    elimination_session.turn = 0
    elimination_session.save()

    # Un-eliminate all movies
    SharedMovie.objects.filter(
        elimination_session=elimination_session).update(is_eliminated=False)

    try:
        session_dict = elimination_session_encoder(sharecode)
        return SuccessfulCommandResponse(command=command, data={"elimination_session": session_dict})
    except:
        return FailedCommandResponse(command=command, errors=["Error refreshing list."])
