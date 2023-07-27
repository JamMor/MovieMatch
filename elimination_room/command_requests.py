from random import randint
import random
from asgiref.sync import async_to_sync

from list_builder.models import Persona
from elimination_room.models import SharedMovieList, SharedMovie, ShareRoomUser
from .serializer import SharedListEncoder as SharedListJsonEncoder
from .json_response import SuccessfulCommandResponse, FailedCommandResponse
from .queue_management import assign_round_order, end_of_queue_position, select_next_eliminating_user

def request_connect(sharecode, persona_uuid):
    """
    Request to connect to elimination room
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    Successful response returns the uuid, round, position, and nickname of the connecting user.
    """

    command = "connected"

    # Get this user persona and share room
    this_persona = Persona.objects.get(uuid = persona_uuid)
    share_list = SharedMovieList.objects.get(sharecode = sharecode)
    
    # Activate inactive user, or create new active user if hasn't joined yet
    room_user, created = ShareRoomUser.objects.get_or_create(
        persona = this_persona, 
        list = share_list
    )
        
    # If a returning user, determine position and round placement
    if not created:

        # For users rejoining before the end of the current round who missed their turn, move to end of queue
        if (not room_user.has_eliminated) and (room_user.position > 0) and (room_user.position < share_list.turn):
                room_user.position = end_of_queue_position(share_list)
        # For users rejoining before the end of the current round who have not yet taken their turn, do nothing
        # For users rejoining before the end of the current round who have already taken their turn, do nothing
    
    # If a new user, set nickname
    else:
        if this_persona.nickname:
            nickname = this_persona.nickname
        # Set generic nickname if none already set
        else:
            room_user_count = ShareRoomUser.objects.filter(list = share_list).count()
            print(f"Number of room users: {room_user_count}")
            nickname = f"User {room_user_count}"
                    
        room_user.nickname = nickname
    
    room_user.is_active = True
    room_user.save()

    # Tell group of connection
    user_data = {
        'uuid' : persona_uuid,
        'nickname' : room_user.nickname,
        'position' : room_user.position
    }

    return SuccessfulCommandResponse(command = command, data = user_data)
    
def request_disconnect(sharecode, persona_uuid):
    """
    Request to disconnect from elimination room.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    Successful response returns the disconnected uuid. If disconnecting user was 
    in the middle of their turn, a successful response will also include the 
    next eliminating uuid and the round.
    """

    command = "disconnected"

    disconnect_data= {"disconnected_uuid" : persona_uuid}

    # Get this user persona and share room
    room_user = ShareRoomUser.objects.select_related("list").get(persona__uuid = persona_uuid, list__sharecode = sharecode)
    share_list = room_user.list

    # If last active user, then set list to inactive
    active_share_users_count = ShareRoomUser.objects.filter(list = share_list, is_active = True).count()
    if active_share_users_count == 1:
        share_list.is_active = False
        share_list.save()
        ShareRoomUser.objects.filter(list=share_list).update(
            is_active=False,
            has_eliminated=False,
            position=0
        )

    elif active_share_users_count > 1:
        #If it was the user's turn and they had not eliminated, assign the next user to turn
        if (share_list.is_active == True) and (room_user.position == share_list.turn) and (room_user.has_eliminated == False):
            next_share_user, user_positional_dict = select_next_eliminating_user(share_list)
            disconnect_data.update({"next_eliminating_uuid": next_share_user.persona.uuid})

            # Send new order if any
            if user_positional_dict != None:
                disconnect_data.update({
                    "updated_positions": user_positional_dict
                })

        room_user.is_active = False
        room_user.save()

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

    share_list = SharedMovieList.objects.get(sharecode = sharecode)
    active_share_users_qs = ShareRoomUser.objects.filter(list = share_list, is_active = True)
    # .order_by('created_at')

    # Error handling
    # If elimination hasn't started. Return failed msg
    if share_list.is_active == False:
        return FailedCommandResponse(command=command, errors=["List not set to allow elimination."])
    
    # If it isn't THIS user's turn. Return failed msg
    this_user = active_share_users_qs.get(persona__uuid = persona_uuid)
    if this_user.position != share_list.turn:
        return FailedCommandResponse(command=command, errors=["Not this users turn."])
    if this_user.has_eliminated == True:
        return FailedCommandResponse(command=command, errors=["Already voted this round."])
    
    

    # If elimination has started:
    uneliminated_movies_qs = SharedMovie.objects.filter(shared_list= share_list, is_eliminated = False)
    movies_left = uneliminated_movies_qs.count()

    successful_response = SuccessfulCommandResponse(command=command)

    # If still movies to eliminate
    if movies_left > 1:
        #Eliminate movie
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
            next_eliminating_user, user_positional_dict = select_next_eliminating_user(share_list)
            successful_response.add_data({
                "next_eliminating_uuid": next_eliminating_user.persona.uuid
            })

            # Send new order if any
            if user_positional_dict != None:
                successful_response.add_data({
                    "updated_positions": user_positional_dict
                })

    # If last movie eliminated
    if movies_left == 1:
        final_movie = uneliminated_movies_qs.first()
        successful_response.add_data({"final_shared_movie_id": final_movie.id})
        
    return successful_response
    
def request_initialize(sharecode):
    """
    Request to intialize a the movie list for an elimination room.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    Successful response returns the shareroom state of users and movies as "share_list".
    """

    command = "initialized"

    try:
        model_dict = SharedListJsonEncoder(sharecode)
        return SuccessfulCommandResponse(command=command, data={"share_list": model_dict})
    except:
        return FailedCommandResponse(command=command, errors=["Error initializing list."])
    
def request_elimination_start(sharecode):
    """
    Request to start elimination in an elimination room.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    Successful response returns the "eliminating_uuid" of the first selecting user 
    and a dictionary of active users with positions.
    """

    command = "elimination_started"
    
    shared_list = SharedMovieList.objects.get(sharecode = sharecode)

    #If elimination already in progress, return failed response
    if shared_list.is_active:
        return FailedCommandResponse(command=command, errors=["Elimination already in progress."])
    
    # If less than 2 movies in list, return failed response
    if SharedMovie.objects.filter(shared_list = shared_list).count() < 2:
        return FailedCommandResponse(command=command, errors=["Must be at least 2 movies in list to begin eliminating."])

    # Assign User Order and Retrieve First User
    eliminating_user, user_positional_dict = assign_round_order(shared_list)

    return SuccessfulCommandResponse(command=command, data={
        "eliminating_uuid": eliminating_user.persona.uuid, 
        "updated_positions": user_positional_dict
        })

def request_refresh_list(sharecode):
    """
    Request to refresh a share room to redo elimination.
    Returns either a FailedCommandResponse or SuccessfulCommandResponse, 
    which can be differentiated by checking the 'status' attribute.
    The to_dict() method can be called on either to get a json serializable dictionary.
    Successful response returns the shareroom state of users and all movies un-eliminated as "share_list".
    """

    command = "refreshed"

    # Set list to inactive
    shared_list = SharedMovieList.objects.get(sharecode = sharecode)
    shared_list.is_active = False
    shared_list.turn = 0
    shared_list.save()

    # Un-eliminate all movies
    SharedMovie.objects.filter(shared_list = shared_list).update(is_eliminated = False)

    try:
        model_dict = SharedListJsonEncoder(sharecode)
        return SuccessfulCommandResponse(command=command, data={"share_list": model_dict})
    except:
        return FailedCommandResponse(command=command, errors=["Error refreshing list."])
    