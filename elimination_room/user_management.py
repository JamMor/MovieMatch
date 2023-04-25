from elimination_room.models import ShareRoomUser, SharedMovieList
from random import shuffle
from django.db.models import Max

#Add to end of queue
def add_user_to_end_of_queue(end_user, share_list, current_round):
    end_user.position = ShareRoomUser.objects.filter(list = share_list, round = current_round).aggregate(Max('position')) + 1
    end_user.save()

# Assign next round order, return first eliminating user
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
    return all_active_users[0]

# Returns next user in queue, or None if no more users
def select_next_eliminating_user(sharecode, current_round, turn):
    # Gets the next user in this round if any
    next_share_user = ShareRoomUser.objects.filter(
        list__sharecode = sharecode, 
        is_active = True, 
        round = current_round,
        position__gt = turn
        ).order_by('position').first()
    
    # Set list turn to user's position

    # If none, then call assign_round_order to assign next round order
    return next_share_user