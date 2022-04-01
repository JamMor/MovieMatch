def find_next_index(current_uuid, uuid_list):
    user_count = len(uuid_list)
    if user_count <= 1:
        return None
    current_index = uuid_list.index(current_uuid)
    next_index = current_index + 1
    #Ensures that next index wraps around if outside of range
    if next_index == user_count:
        next_index = 0
    return next_index