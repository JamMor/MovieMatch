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
    Takes the sharecode, uuid of user requisting elimination, and content of the received json (to get the ```shared_movie_id``` of the movie for elimination) as input. Validates that elimination is available and it is the user's turn. If successful, returns a **SuccessfulCommandResponse** containing the 
    - ```shared_movie_id```,
    - ```eliminating_uuid```,
    - ```next_eliminating_uuid```

    **IF** there is only one remaining movie, it will add
    - ```final_shared_movie_id```

    to the response. This is used to signal the final elimination function to the client.

- #### **```request_initialize```**
    Takes the sharecode as input, and when successful returns a **SuccessfulCommandResponse** containing the room state from the ```SharedListJsonEncoder``` of ```serializer.py```.

- #### **```request_elimination_start```**
    Takes the sharecode as input, and validates room elimination state. If successful, randomly selects a user as the first eliminator, and returns a **SuccessfulCommandResponse** containing the first ```eliminating_uuid```.
- #### **```request_refresh_list```**
    Takes the sharecode as input, and updates all associated **SharedMovie** objects in the database to have their ```is_eliminated``` property set to ```false```. When successful, returns a **SuccessfulCommandResponse** containing the new room state from the ```SharedListJsonEncoder``` of ```serializer.py```.

### ```serializer.py```
This file contains a serializer for a SharedMovieList (aka Share Room). It will return a json serializable dictionary of the active room users (```active_user_dict```) and the shared movies (```movie_list```). This dictionary is built of model instances, which means the ```DjangoJSONEncoder``` must be used to properly parse and encode the datetime objects present.

As the serializer returns the entire state of the room, this is typically used for, 
- the initial request when a user joins the room, 
- a pushed state to existing users when a new user joins the room,
- when a room is refreshed and the elimination states reset.

### ```consumer_utils.py```
This file contains a single function that returns the next index of the user list after the given uuid. This is used to determine the next user to eliminate a movie. When the end of the list is reached, it will loop back to the beginning.

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