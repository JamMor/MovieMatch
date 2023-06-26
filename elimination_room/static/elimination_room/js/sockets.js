import * as Received from "./received-commands.js";

$(document).ready(function() {

    const api_key = "f4f5f258379baf10796e1d3aeb5add05";
    const image_link = "https://image.tmdb.org/t/p/";

    const shareCode = $('#sharecode').text();
    const initialRetryTime = 2000;
    const maxRetryInterval = 10;

    let retryAttempts = 0;
    //Exponentially increasing time to retry connection
    const retryTime = () => (1.65**retryAttempts)*initialRetryTime;
    let matchSocket = null;

    $('#save-modal').modal();

    function createMatchSocket(){
        matchSocket = new WebSocket(
            urlPath.webSocketURL(shareCode)
        );
    
        matchSocket.onopen = function(e) {
            console.log("Match socket opened");

            //Set retry attempts to defaults;
            retryAttempts = 0;

            //Request to initialize current share and user list.
            matchSocket.send(JSON.stringify({
                'command' : 'initialize'
            }))
        };

        //Receive messages
        matchSocket.onmessage = function(e) {
            console.log(e);
            let responseData = JSON.parse(e.data);
            let receivedCommand = responseData.command;

            // Failed command
            if(responseData.status != 'success'){
                console.log("Command failed.")
                console.log(responseData)
                if (responseData.hasOwnProperty('errors')) {
                    responseData.errors.forEach(error =>
                        {console.log(error)}
                    )
                }
                return
            }
            //Successful command
            let commandData;
            if (responseData.hasOwnProperty('data')){
                commandData = responseData.data
            }
            else{
                console.log("Error: No data in response.")
                return
            }

            //Eliminate movie
            if(receivedCommand == "eliminated"){
                Received.commandEliminate(commandData);
            }
            
            //User connected
            else if(receivedCommand == "connected"){
                Received.commandConnected(commandData);
            }
            //User disconnected
            else if(receivedCommand == "disconnected"){
                Received.commandDisconnected(commandData);
            }
            //Initialize/Update list of movies
            else if(receivedCommand == "initialized" || receivedCommand == "updated"){
                Received.commandSyncRoom(commandData);
            }
            //Refresh list of movies
            else if(receivedCommand == "refreshed"){
                Received.commandRefreshMovieList(commandData);
            }
            //Start Elimination
            else if(receivedCommand == "elimination_started"){
                Received.commandStartElimination(commandData);
            }
            // //Final movie left
            // else if(receivedCommand == "finalized"){
            //     Received.commandFinalized(commandData);
            // }
            else {
                console.log("Command Unknown")
                console.log(responseData)
            }
        };

        matchSocket.onclose = function(e) {
            console.error('Match socket closed unexpectedly');
            console.log(e);
            console.error('Retrying matchSocket');
            setTimeout(createMatchSocket, retryTime());
            //Ceiling for increasing timeout interval
            retryAttempts += (retryAttempts <= maxRetryInterval) ? 1 : 0;
        };
    }

    //Send which movie to eliminate on click
    $('#movie_list').on('click', 'a.remove-btn' , function() {
        if(!isEliminationActive(user_list)){
            console.log("Host has not started elimination.")
            return
        }
        if(!user_list[user_uuid]['is_users_turn']){
            console.log("Not this users turn.")
            return
        }

        //Get tmdb_id from parent Card ID
        let tmdb_id = $(this).closest('div.card').attr('id')
            .split("_")[1];

        //Get shared_movie_ID
        let {shared_movie_id} = movie_list.find(movie => movie.tmdb_id == tmdb_id)

        matchSocket.send(JSON.stringify({
            'command' : 'eliminate',
            'shared_movie_id' : shared_movie_id
        }))
    });
    
    //Send start eliminating command
    $('#status_bar').on('click', '.status-start' , function() {
        if(movie_list.length < 2){
            console.log("Must have at least 2 movies to begin elimination.")
            return
        }
        console.log("Send start matching signal.")
        matchSocket.send(JSON.stringify({
            'command' : 'elimination_start'
        }))
    });
    
    //Send Refresh Share List command
    $('#final_modal').on('click', '#refresh-btn' , function() {
        console.log("Refreshing list.")
        matchSocket.send(JSON.stringify({
            'command' : 'refresh'
        }))
    });

    

    //Check if elimination is active (if it is a users turn)
    function isEliminationActive(userList){
        return Object.keys(userList).some(user => userList[user].is_users_turn == true)
    }

    //Opens final modal for now
    $('#status_bar').on('click', '.status-final' , function() {
        console.log("Opening Modal")
        $('#final_modal').modal('open');
    });

    createMatchSocket();
})