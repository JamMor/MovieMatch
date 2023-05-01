from elimination_room.models import ShareRoomUser, SharedMovieList
from random import shuffle
from django.db.models import Max

def end_of_queue_position(share_list):
    """
    Returns last queue position + 1

    :param share_list: The shared list to get the end of queue position for
    :type share_list: SharedMovieList
    :return: Last queue position + 1
    :rtype: int
    """
    position_dict = ShareRoomUser.objects.filter(list = share_list, round = share_list.round).aggregate(last_position = Max('position'))
    return position_dict['last_position'] + 1

# Assign next round order, return tuple with first eliminating user and room round
def assign_round_order(sharecode, current_round):
    """
    Assigns the next round order for a share room and returns the first user in the queue 
    and the room's current round

    :param sharecode: The share code of the room to assign the round order for
    :type sharecode: str
    :param current_round: The current round of the room
    :type current_round: int
    :return: Tuple with first eliminating user and room round
    :rtype: ShareRoomUser, int
    """
    # Active Room Users Queryset
    active_share_users_qs = ShareRoomUser.objects.filter(list__sharecode = sharecode, is_active = True)

    # If initial round, randomize the position of all active users
    if current_round == 0:
        all_active_users = list(active_share_users_qs.all())
        shuffle(all_active_users)
        
    # If round > 0, first assign newly joined active users. Then assign remaining 
    # active users in order of position
    elif current_round > 0:
        # Start the list with newly joined users and then add the remaining users from the previous round
        new_active_users = active_share_users_qs.filter(round = 0).order_by('updated_at').all()
        previous_active_users = active_share_users_qs.filter(round = current_round).order_by('position').all()
        all_active_users = list(new_active_users).extend(list(previous_active_users))

    # Assign new round and position to each user
    n = 0
    for user in all_active_users:
        user.round = current_round + 1
        user.position = n
        user.has_eliminated = False
        n += 1
    
    ShareRoomUser.objects.bulk_update(all_active_users, ['round', 'position', 'has_eliminated'])     

    # Update Round
    share_list = SharedMovieList.objects.get(sharecode = sharecode)
    share_list.round = current_round + 1
    share_list.save()

    return all_active_users[0], share_list.round

# Returns a dictionary with next user in queue and the room's current round
def select_next_eliminating_user(share_list):
    """
    Returns a tuple with the next user in the queue and the room's current round.
    If the end of the queue is reached, it calls the assign_round_order function to
    assign the next round order.

    :param share_list: The shared list to get the next user in the queue for
    :type share_list: SharedMovieList
    :return: Tuple with next user in queue and the room's current round
    :rtype: ShareRoomUser, int
    """
    current_round = share_list.round
    current_turn = share_list.turn

    # Gets the next user in this round if any
    next_share_user = ShareRoomUser.objects.filter(
        list = share_list, 
        is_active = True, 
        round = current_round,
        position__gt = current_turn
        ).order_by('position').first()
    

    if next_share_user == None:
        next_share_user, current_round = assign_round_order(share_list)

    # Update current turn
    share_list.turn = next_share_user.position
    share_list.save()
    
    return next_share_user, current_round