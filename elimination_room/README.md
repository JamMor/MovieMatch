# Elimination Room

## Overview
### **The User Experience**
The elimination room alows users to be able to select a movie to watch alone or with others via process of elimination. Each user gets a turn to remove one movie from the list until only one remains.

To create a room, the initial user needs to provide a list of at least 2 movies. To join a room however, no list is required, so anyone can participate even without suggestions. There is no limit on the maximum number of movies, giving users the freedom to choose what works best for them.

### **Technical Brief**
The elimination room works with Django Channels to manage websocket connections between any users and a "ShareRoom". 

Django channels will:

- Receive commands from the user via websocket which will be validated and trigger actions.
- Send messages to the channels layer which will be sent to all connected users.

The clients will be able to validate these commands and modify the room state accordingly.

---

## Room Logic
Currently, *anyone* may trigger the start of elimination. This is again for the sake of flexibility. It is up to the users themselves to decide if they want to wait for others. Other systems would mean the room creator alone would have that power, or specific invites would need to be required to determine who is present, etc.

The other benefit is that users may join or leave at *any* time without interrupting or postponing the selection process if the rest of the group wishes to continue. This also means that users may continue even *without* the initial room creator. Anonymous users can join with the share code.

To deal with disconnects, a 'round' property will be implemented to prevent repeat voting. If a user reconnects before the round ends, their place is kept based on their initial time of joining. If the order has passed, they're placed at the end of the queue. In this way if they reconnect they will not find themselves at the end of the queue able to vote again.

Once a new "round" is started, the question is should only the present users
be able to vote, or should users be able to join in on an unfinished round. The latter allows for latecomers and new users to immediately join in, *however* it also means users could join anonymously over and over to keep getting more votes. This would have to involve a private window or new browser as a session cookie is used to identify even anonymous users.

### ```serializer.py```
This file contains a serializer for a SharedMovieList (aka Share Room). It will return a json serializable dictionary of the active room users (```active_user_dict```) and the shared movies (```movie_list```). This dictionary is built of model instances, which means the ```DjangoJSONEncoder``` must be used to properly parse and encode the datetime objects present.

As the serializer returns the entire state of the room, this is typically used for, 
- the initial request when a user joins the room, 
- a pushed state to existing users when a new user joins the room,
- when a room is refreshed and the elimination states reset.
