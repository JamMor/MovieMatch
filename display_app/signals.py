from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# When Shared List is updated, sends updated list to appropriate channel
def update_shared_list_channels(sharecode):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        print("No channel layer.")
        return

    group_name = 'match_%s' % sharecode
    async_to_sync(channel_layer.group_send)(
        group_name, 
        {"type": "update_message"})
    print("New ShareList information sent.")