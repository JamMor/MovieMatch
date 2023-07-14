from elimination_room.models import ShareRoomUser, SharedMovieList
from random import shuffle
from django.db.models import Max

def end_of_queue_position(share_list):
    """
    Returns maximum queue position + 1 for the current round

    :param share_list: The shared list to get the end of queue position for
    :type share_list: SharedMovieList
    :return: Last queue position + 1
    :rtype: int
    """
    position_dict = ShareRoomUser.objects.filter(list = share_list).aggregate(last_position = Max('position'))
    return position_dict['last_position'] + 1

# Assign next round order, return first eliminating user
def assign_round_order(share_list):
    """
    Assigns the next round order for a share room and returns the first user in the queue 
    and a dictionary of active user's with updated positions

    :param share_list: The shared list to get the next user in the queue for
    :type share_list: SharedMovieList
    :return: First eliminating user and active user dictionary
    :rtype: ShareRoomUser, dict
    """
    # Active Room Users Queryset
    active_share_users_qs = ShareRoomUser.objects.filter(list = share_list, is_active = True).select_related('persona')

    # If initial round, randomize the position of all active users
    if not share_list.is_active:
        all_active_users = list(active_share_users_qs.all())
        shuffle(all_active_users)
        share_list.is_active = True
        
    # If later round, first assign newly joined active users. Then assign remaining 
    # active users in order of position
    else:
        # Start the list with newly joined users and then add the remaining users from the previous round
        all_active_users = list(active_share_users_qs.order_by('position', 'updated_at').all())

    # Assign new position to each user, and build dictionary of user uuids and positions
    user_positional_dict = {}
    n = 1
    for user in all_active_users:
        user.has_eliminated = False
        user.position = n
        user_positional_dict.update({user.persona.uuid: {"position":n, "nickname":user.nickname}})
        n += 1
    
    # Update active users positions
    ShareRoomUser.objects.bulk_update(all_active_users, ['has_eliminated', 'position'])

    # Reset inactive users positions
    ShareRoomUser.objects.filter(list = share_list, is_active = False).update(has_eliminated = False, position=0)

    # Update Turn
    share_list.turn = 1
    share_list.save()

    return all_active_users[0], user_positional_dict

# Returns next user in queue
def select_next_eliminating_user(share_list):
    """
    Returns the next user in the queue (whose position is >= the current turn).
    If the end of the queue is reached, it calls the assign_round_order function to
    assign the next round order, and also returns a dictionary of user positions.

    :param share_list: The shared list to get the next user in the queue for
    :type share_list: SharedMovieList
    :return: Tuple of next eliminating user and dictionary of user positions if updated
    :rtype: ShareRoomUser, dict[str, int] | None
    """

    user_positional_dict = None
    
    # Gets the next user in this round if any
    next_share_user = ShareRoomUser.objects.filter(
        list = share_list, 
        is_active = True,
        position__gt = share_list.turn
        ).order_by('position').first()
    
    # If no more users in this round, assign next round order
    if next_share_user == None:
        next_share_user, user_positional_dict = assign_round_order(share_list)
    else:
        # Update current turn
        share_list.turn = next_share_user.position
        share_list.save()
    
    return next_share_user, user_positional_dict