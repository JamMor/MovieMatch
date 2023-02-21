# Elimination Room


## The User Experience
The user experience for the elimination room is to be able to select a movie to watch alone or with others via process of elimination. Each user gets a turn to rmove one from the list until only one movie remains.

A user creating a room must submit a list of at least 2 movies. A user joining a room is not required to submit any at all (in the case of one not having any suggestions but wanting to participate). There is no maximum number of movies, so that the users may decide what works best for them.

## The Technical Details
The elimination room works with Django Channels to manage websocket connections between any users and a "ShareRoom". 

Django channels will:

- Receive commands from the user via websocket which will be validated and trigger actions.
- Send messages to the channels layer which will be sent to all connected users.

The clients will be able to send these commands and modify the room state accordingly.

## Room Logic
Currently, *anyone* may trigger the start of elimination. This is again for the sake of flexibility. It is up to the users themselves to decide if they want to wait for others. Other systems would mean the room creator alone would have that power, official invites would need to be required to determine who is present, etc.

The other benefit is that users may join or leave at *any* time. The remaining users may continue. Smaller groups can continue at a later date even without the room creator. Anonymous users can join with the share code.

The planned method for dealing with disconnects will be to have a "round" property. When a user eliminates a movie, they will be marked as having voted that round. In this way if they reconnect they will not find themselves at the end of the queue able to vote again. If they reconnect before the round is up, their place will be kept based on the initial time of joining the room. If the order has been passed, then they will be placed at the end of the queue.

Once a new "round" is started, the question is should only the present users
be able to vote, or should users be able to join in on an unfinished round. The latter allows for latecomers and new users to immediately join in, *however* it also means users could join anonymously over and over to keep getting more votes. This would have to involve a private window or new browser as a session cookie is used to identify even anonymous users.

### serializer.py
This file contains a serializer for 