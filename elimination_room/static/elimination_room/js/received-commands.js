//These are the functions that are called when a succesful socket command is 
// received from the server

// Eliminate Movie
function commandEliminate(commandData) {
    let {shared_movie_id, eliminating_uuid, next_eliminating_uuid} = commandData

    let eliminated_movie = movie_list.find(movie => movie.shared_movie_id == shared_movie_id)

    eliminated_movie.is_eliminated == true;
    $(`#shared_${eliminated_movie.tmdb_id}`).addClass('eliminated')
    console.log("Eliminated movie")

    let toastClass = "purple-text text-accent-2"
    let nickname = user_list[eliminating_uuid]['nickname']
    if(eliminating_uuid == user_uuid){
        toastClass = "cyan-text text-accent-2"
        nickname = "YOU"
    }
    let toastHtml = `<span><strong class=${toastClass}>${nickname} </strong>&nbsp;eliminated&nbsp;<strong class="orange-text text-darken-3"> ${eliminated_movie.title}</strong></span>`
    M.toast({html: toastHtml})
    
    if (commandData.hasOwnProperty("updated_positions")){
        userListBuilder(user_list, commandData.updated_positions);
        user_list = commandData.updated_positions;
    }
    setUserTurn(next_eliminating_uuid);

    // ====================FLAG====Temporary Final Fix=========================================
    if(commandData.hasOwnProperty('final_shared_movie_id')) {
        commandFinalized(commandData);
    }
    // ==========================================================================================

}

// Final Movie
function commandFinalized(commandData) {
    let finalSharedId = commandData.final_shared_movie_id;
    let finalMovie = movie_list.find(movie => movie.shared_movie_id == finalSharedId);
    console.log(`${finalMovie.title} is the final choice!`)
    
    getMoreMovieInfo(finalMovie.tmdb_id)
        .done(returnInfo => {
            console.log(returnInfo)
            let finalMovieInfo = returnInfo ?? finalMovie
            openMoreInfoModal(finalMovieInfo, "final_modal")
        })
        .fail(function(){
            console.log("AJAX error")
        })

    setStatusBar("final");
}

// Connect User
function commandConnected(commandData) {
    let {uuid:connected_uuid, nickname, position} = commandData
    console.log("Connected User: " + connected_uuid);
    if(user_list.hasOwnProperty(connected_uuid)){
        console.log(`User ${connected_uuid} is already in list.`)
    }
    else{
        user_list[connected_uuid] = {"nickname": nickname, "position": position};
        addUserToDom(connected_uuid, {"nickname": nickname, "position": position});
        console.log(`${nickname} has joined the room. UUID: ${connected_uuid}`)
        if(connected_uuid != user_uuid){
            let toastHtml = `<span><strong class="purple-text text-accent-2">${nickname} </strong>&nbsp;has connected.</span>`
            M.toast({html: toastHtml})
        }
    }
}

// Disconnect User
function commandDisconnected(commandData) {
    if (commandData.hasOwnProperty("updated_positions")){
        userListBuilder(user_list, commandData.updated_positions);
        user_list = commandData.updated_positions;
    }
    if (commandData.hasOwnProperty("next_eliminating_uuid")){
        setUserTurn(commandData.next_eliminating_uuid)
    }

    let disconnected_uuid = commandData.disconnected_uuid;
    console.log('Disconnected UUID: ' + disconnected_uuid)
    removeUserFromDom(disconnected_uuid);
    if(disconnected_uuid != user_uuid){
        let toastHtml = `<span><strong class="purple-text text-accent-2">${user_list[disconnected_uuid]['nickname']} </strong>&nbsp;has disconnected.</span>`
        M.toast({html: toastHtml})
    }
    delete user_list[disconnected_uuid];
}

//Initialize/Update Share Room
function commandSyncRoom(commandData) {
    let {
        movie_list:received_movie_list, 
        active_user_dict:received_user_list,
        is_active,
        eliminating_uuid = null
    } = commandData.share_list
    received_movie_list = received_movie_list.map(movie => 
            new construct.SharedMovie(movie)
        )

    movieListBuilder(movie_list, received_movie_list)
    movie_list = received_movie_list
    
    userListBuilder(user_list, received_user_list)
    user_list = received_user_list

    elimination_active = is_active;

    let statusType;
    if(isFinalSelected(movie_list)){
        statusType = "final";
        let finalMovie = movie_list.find(movie => movie.is_eliminated == false);
        console.log(`${finalMovie.title} is the final choice!`)
        
        getMoreMovieInfo(finalMovie.tmdb_id)
            .done(returnInfo => {
                console.log(returnInfo)
                let finalMovieInfo = returnInfo ?? finalMovie
                openMoreInfoModal(finalMovieInfo, "final_modal")
            })
            .fail(function(){
                console.log("AJAX error")
            })
    }
    else if(elimination_active){
        statusType = "eliminating"
    }
    else{
        statusType = "start"
    }
    
    setStatusBar(statusType);

    if(eliminating_uuid != null){
        setUserTurn(eliminating_uuid);
    }
}

// Refreshes Movie List
function commandRefreshMovieList(commandData) {
    user_list = {};
    movie_list= [];
    $('#user_list').html("");
    $('#movie_list').html("");

    $('#final_modal').modal('close');

    commandSyncRoom(commandData)
}

// Start Elimination
function commandStartElimination(commandData) {
    let {eliminating_uuid, updated_positions} = commandData;    
    
    userListBuilder(user_list, updated_positions);
    user_list = updated_positions;

    elimination_active = true;

    setStatusBar("eliminating");
    setUserTurn(eliminating_uuid);
    
}

// Failed Command
function commandFailed(commandData) {
    // let {error_message} = commandData
    // M.toast({html: error_message})
    console.log("Command failed.")
    console.log(responseData)
    if (responseData.hasOwnProperty('errors')) {
        responseData.errors.forEach(error =>
            {console.log(error)}
        )
    }
    return
}

// Private Functions

//Returns current user whose turn it is

// FLAG deprecation
// Returns eliminating user specific status bar text
// function getEliminatingStatusString(userList) {
//     let eliminating_uuid = Object.keys(userList)
//         .find(uuid => userList[uuid].is_users_turn == true)
//     if (eliminating_uuid) {
//         return (eliminating_uuid == user_uuid)
//             ? "Waiting on YOUR turn..."
//             : `Waiting on ${userList[eliminating_uuid].nickname}'s turn...`
//     }
//     else {
//         console.log("Couldn't get uuid of eliminating user.")
//         return ""
//     }
// }

//Sets status bar
function setStatusBar(status){
    // Map of status bar text, css, and flanking icons
    const statusMap = {
        "start": {
            "styleClass": "status-start waves-effect waves-light neon-blue-hover btn-large btn-rounded",
            "icons": "cast",
            "statusText": "Start Matching"
        },
        "waiting": {
            "styleClass": "status-waiting neon-blue inactive btn-large btn-rounded",
            "icons": "cast",
            "statusText": "Waiting for matching to begin..."
        },
        "eliminating": {
            "styleClass": "status-eliminating neon-blue active btn-large btn-rounded",
            "icons": "cast_connected",
            "statusText": "Elimination Activated!"
        },
        "final": {
            "styleClass": "status-final waves-effect waves-light neon-fuschia active btn-large btn-rounded",
            "icons": "movie",
            "statusText": "Open final movie info"
        }
    }

    if (!statusMap.hasOwnProperty(status)) {
        status = "start"
    }

    let {styleClass, icons, statusText} = statusMap[status];

    // Edit DOM
    $('#status-btn').removeClass().addClass(styleClass);
    $('#status-btn i').html(icons);
    $('#status-btn span').html(statusText);
}

//Check if final movie
function isFinalSelected(movieList){
    let eliminatedCount = movieList
        .reduce((prev, curr) => prev + curr.is_eliminated, 0)
    return movieList.length - eliminatedCount == 1
}

//Set active user turn
function setUserTurn(turnUUID){
    
    //Remove any active classes
    $(`#user_list div.active`).removeClass('active').addClass('inactive');
    
    //Set current user turn to true and add active class
    current_eliminating_uuid = turnUUID;
    $(`#user_${turnUUID}`).addClass('active').removeClass('inactive');

    //Toast new user turn
    let toastName = (turnUUID != user_uuid) 
        ? `<strong class="purple-text text-accent-2">${user_list[turnUUID]['nickname']}</strong>'s` 
        : '<strong class="cyan-text text-accent-2">YOUR</strong>'
    let toastHtml = `<span>${toastName}&nbsp;turn.</span>`
    M.toast({html: toastHtml})

    //Put username in status bar
    let statusText = (turnUUID == user_uuid)
            ? "Waiting on YOUR turn..."
            : `Waiting on ${user_list[turnUUID].nickname}'s turn...`

    $('#status-btn span').html(statusText);
}

function getMoreMovieInfo(movieId){
    //Ajax for more movie detail w/ watch provider data
    const api_key = "f4f5f258379baf10796e1d3aeb5add05";
    return $.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${api_key}&language=en-US&append_to_response=watch/providers`,
        "json")
}

//Sets a movie-info modal content, initializes, and opens
//Movie Info object from getMoreMovieInfo, and the ID name of the modal element
function openMoreInfoModal(movieInfo, targetModalId){
    $(`#${targetModalId} div.modal-content`)
        .html(MovieInfoModal(movieInfo))
    
    $(`#${targetModalId}`).modal({
        inDuration: 1500,
        dismissible: false,
        endingTop: "2%"
    });
    $(`#${targetModalId} .collapsible`).collapsible();
    $(`#${targetModalId} .tooltipped`).tooltip();
    $(`#${targetModalId}`).modal('open');
}

export { 
    commandEliminate, 
    commandConnected, 
    commandDisconnected, 
    commandSyncRoom, 
    commandRefreshMovieList, 
    commandStartElimination, 
    commandFinalized
};