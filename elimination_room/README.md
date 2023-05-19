# Elimination Room

## Overview
### **The User Experience**
The elimination room allows users to be able to select a movie to watch alone or with others via process of elimination. Each user gets a turn to remove one movie from the list until only one remains.

To create a room, the initial user must provide a list of at least 2 movies. To join a room however, no list is required, so anyone can participate even without suggestions of their own. There is no limit on the maximum number of movies, giving users the freedom to decide what works best for them.

### **Technical Brief**
The elimination room works with Django Channels to manage websocket connections between any users and a "ShareRoom". 

Django Channels will:

- Receive commands from the user via websocket which will be validated and trigger actions.
- Send messages to the channels layer which will be sent to all connected users.

The clients will be able to validate these commands and modify the room state accordingly.

---

## Room Logic
Currently, *anyone* may trigger the start of elimination. This is again for the sake of flexibility. It is up to the users themselves to decide if they want to wait for others. Other systems would mean the room creator alone would have that power, or specific invites would need to be required to confirm who is present, etc.

The other benefit is that users may join or leave at *any* time without interrupting or postponing the selection process if the rest of the group wishes to continue. This also means that users may continue even *without* the initial room creator. Anonymous users may also join with the sharecode.

Elimination rooms operate on a round system to prevent repeat voting. When a room is created, it defaults to a round number of 0, awaiting the start of elimination. Similarly, newly joining users default to a round number of 0, signifying that they are not currently participating in a round. 

Once elimination starts, the round is set to 1. All active users are set to round 1 as well and assigned a randomized position for turns. New users joining during this time will have the default round 0, identifying them as awaiting the next round to participate. 

When a round of elimination is complete, round 0 users will be assigned in the order they joined at the beginning of the queue for the next round. The users from the former round will then follow in the same order they eliminated previously. This allows new users to immediately be included and have an equal chance to eliminate without waiting for the former users to go twice.

If a user disconnects during a round, they may rejoin at no penalty if they return before their turn. However if they miss their turn, they will be added to the end of the queue for that round. If they miss the round *entirely*, then they will be treated as a new "round 0" user waiting for the next round.

When every user has disconnected, the room round is reset to the default 0, which means that returning users must send the "Start Elimination" command as before. The elimination status of the movies in the list will not reset until a final movie has been chosen and the reset command has been sent.

---
## Server Side

### ```consumers.py```
This file contains the logic for the websocket connection through Django Channels. It will receive commands from the client, route those commands to the proper function in command_requests.py, and send messages to the Channels group and directly client.

It will create a group name based on the room code: "```match_```**sharecode**".

Received commands must be in the form of a json object with a ```command``` property. Valid commands— 
- ```initialize```
- ```eliminate```
- ```elimination_start```
- ```refresh```

—will then be routed to the proper function in command_requests.py.

There is also an update_message function that is only triggered from outside of the channels scope from the elimination_room views.py whenever a new user joins (and potentially adds movies to the list). This function will push the entire room state to the group, where the appropriate client functions will then add new movies and users to the DOM.

### ```command_requests.py```
This file contains the logic for the commands received from the client. It will then return a ```SuccessfulCommandResponse``` containing data or ```FailedCommandResponse``` containing errors to the client, which can then be appropriately forwarded to the Channels group or the requesting client directly.

The current command functions available are:

- #### **```request_eliminate```**
    Takes the sharecode, uuid of user requesting elimination, and content of the received json (to get the ```shared_movie_id``` of the movie for elimination) as input. Validates that elimination is available and it is the user's turn. If successful, returns a **SuccessfulCommandResponse** containing the 
    - ```shared_movie_id```,
    - ```eliminating_uuid```,
    - ```next_eliminating_uuid```,
    - ```round```

    **IF** there is only one remaining movie, it will add
    - ```final_shared_movie_id```

    to the response. This is used to signal the final elimination function to the client.

- #### **```request_initialize```**
    Takes the sharecode as input, and when successful returns a **SuccessfulCommandResponse** containing the room state from the ```SharedListJsonEncoder``` of ```serializer.py```.

- #### **```request_elimination_start```**
    Takes the sharecode as input, and validates room elimination state. If successful, calls the ```assign_round_order``` function from ```queue_management.py``` which begins a new round and returns the first eliminating user. The **SuccessfulCommandResponse** contains the first ```eliminating_uuid``` and the ```current_round``` of the room which should always be **1**.
- #### **```request_refresh_list```**
    Takes the sharecode as input, and updates all associated **SharedMovie** objects in the database to have their ```is_eliminated``` property set to ```false```. When successful, returns a **SuccessfulCommandResponse** containing the new room state from the ```SharedListJsonEncoder``` of ```serializer.py```.

Additional functions (though not received commands from the client) contain the logic for user joining and leaving the room.
- #### **```request_connect```**
    Takes the sharecode and persona uuid as input, and creates or updates a **ShareRoomUser**, sets to active, adds nickname, and assigns queue position. When successful, returns a **SuccessfulCommandResponse** containing the 
    - ```uuid```,
    - ```nickname```,
    - ```user_round```,
    - ```user_position```
- #### **```request_disconnect```**
    Takes the sharecode and persona uuid as input, and sets the user to inactive, *if* the last user resets the room round, and chooses a new eliminating user if disconnecting in the middle of their turn. When successful, returns a **SuccessfulCommandResponse** containing the 
    - ```disconnecting_uuid```,
    *if disconnected in middle of turn*
    - ```next_eliminating_uuid```,
    - ```user_round```

### ```serializer.py```
This file contains a serializer for a SharedMovieList (aka Share Room). It will return 
- a json serializable dictionary of the active room users (```active_user_dict```) and the the shared movies (```movie_list```), 
- the room round (```round```) and turn (```turn```). 
The dictionaries are built of model instances, which means the ```DjangoJSONEncoder``` must be used to properly parse and encode the datetime objects present.

As the serializer returns the entire state of the room, this is typically used for, 
- the initial request when a user joins the room, 
- a pushed updated state to existing users when a new user joins the room,
- when a room is refreshed and the elimination states reset.

### ```json_response.py```
This file contains several class objects that are used to return json responses to the client. These are used to standardize the responses and make it easier to handle errors and success messages.

One base class is the ```JsonClassObject``` which has an optional ```message``` property that defaults to an empty string. It also has a ```to_dict``` method that will return a JSON serializable dictionary of the object for responses.

The two child classes of this are the 
- ```SuccessJsonClassObject``` and the 
- ```FailedJsonClassObject```. 

Both contain a status property of "success" or "failure" respectively. The ```SuccessJsonClassObject``` also has a ```data``` property that defaults to an empty dictionary, and an ```add_data``` method that updates the data dictionary with a given dictionary. The ```FailedJsonClassObject``` has an ```error``` property that defaults to an empty list and an ```add_error``` method that appends a given string to the error list.

Another base class is ```CommandType``` which has only a ```command``` property that defaults to an empty string. This is used to form the multiple inheritance child classes of 
- ```SuccessfulCommandResponse(SuccessJsonClassObject, CommandType)``` and 
- ```FailedCommandResponse(FailedJsonClassObject, CommandType)```, 

which are essentially variations of the JsonClassObjects with the additional ```command``` property.

---


### ```queue_management.py```
This file contains three functions for managing the queue of room users. 

- #### ```end_of_queue_position.py```
    This is for adding a user to the end of the current round queue. It takes the ```share_list``` as input and returns the highest position + 1 (as an **int**).

- #### ```assign_round_order.py```
    This manages the turn order for each new round. It takes the ```share_list``` as input.

    The initial round order is randomized among all current active users when elimination is started. Subsequent rounds begin with all *new* active users waiting to be assigned in the order of when they joined the room. They are followed by the previous active users in their same order from before.

    It resets all users ```has_eliminated``` status to false, and assigns their ```position```. As well as saving the new round and turn position of the room.

    It returns the first user in the queue for the next round and the new room round number.

- #### ```select_next_eliminating_user.py```
    This is for selecting the next eliminating user. It takes the ```share_list``` as input and returns a tuple with the ```next_share_user``` in the queue and the room's ```current_round``` (as an int).

    The active users in the round are simply ordered by position and the next after the current turn is chosen.

    *If* the end of the active users for the round are reached however, it will call the ```assign_round_order``` function to progress to the next round.

## Client Side

The match.html is a simple container with a status bar and the intial html for a modal with more information for the final selected movie. It has the global variables:
- ```user_uuid``` - the uuid string of the client user
- ```user_list``` - a map of users in the room with their uuid as the key, and 'nickname' and 'is_users_turn' as values
- ```movie_list``` - the list of movies (as ```Movie``` objects) in the room
- ```has_started_elimination``` - a boolean to determine if the elimination has started

It loads the JS files:
- ```received-commands.js``` - the functions that handle the commands received from the server
- ```match_builder.js``` - a single function that adds new movies to the DOM
- ```user_builder.js``` - updates the user list, adding and removing users from the DOM as needed
- ```sockets.js``` - the base file for this page that handles the websocket connection, routing commands to the appropriate function in ```received-commands.js```, and sending commands to the server
- ```save_modal.js``` - the base level save function to save a list for the user
- ```sharecopy.js``` - a simple function to copy the share code to the clipboard

### Sent Command JSON Formats
- On socket open:
```{'command' : 'initialize'}```
- On shared movie remove click:
    ```{'command' : 'eliminate', 'shared_movie_id' : shared_movie_id}```
- On start elimination click:
```{'command' : 'elimination_start'}```
- On refresh list click:
```{'command' : 'refresh'}```