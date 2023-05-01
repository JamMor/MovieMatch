from elimination_room.models import ShareRoomUser, SharedMovieList
from random import shuffle
from django.db.models import Max

#Returns last queue position + 1
def end_of_queue_postition(share_list):
    position_dict = ShareRoomUser.objects.filter(list = share_list, round = share_list.round).aggregate(last_position = Max('position'))
    return position_dict['last_position'] + 1

# Assign next round order, return tuple with first eliminating user and room round
def assign_round_order(sharecode, current_round):
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