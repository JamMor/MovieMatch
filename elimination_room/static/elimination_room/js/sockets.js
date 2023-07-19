import * as Received from "./received-commands.js";

const api_key = "f4f5f258379baf10796e1d3aeb5add05";
const image_link = "https://image.tmdb.org/t/p/";

const shareCode = $('#sharecode').text();
const initialRetryTime = 2000;
const maxRetryInterval = 10;

let retryAttempts = 0;
//Exponentially increasing time to retry connection
const retryTime = () => (1.65**retryAttempts)*initialRetryTime;
// let matchSocket = null;

function createMatchSocket(){
    let matchSocket = new WebSocket(
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

export {createMatchSocket}