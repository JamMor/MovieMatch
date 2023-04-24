from elimination_room.models import ShareRoomUser
from django.db.models import Max

#Add to end of queue
def add_user_to_end_of_queue(end_user, share_list, current_round):
    end_user.position = ShareRoomUser.objects.filter(list = share_list, round = current_round).aggregate(Max('position')) + 1
    end_user.save()

# Assign next round order, return first eliminating user
def assign_round_order(sharecode):
    pass

# Returns next user in queue, or None if no more users
def select_next_eliminating_user(sharecode, current_round, turn):
    pass
