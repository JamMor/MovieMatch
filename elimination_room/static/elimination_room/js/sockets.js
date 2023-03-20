$(document).ready(function() {

    const api_key = "f4f5f258379baf10796e1d3aeb5add05";
    const image_link = "https://image.tmdb.org/t/p/";

    const shareCode = $('#sharecode').text();
    const initialRetryTime = 2000;
    const maxRetryInterval = 10;

    var retryAttempts = 0;
    //Exponentially increasing time to retry connection
    var retryTime = () => (1.65**retryAttempts)*initialRetryTime;
    var matchSocket = null;

    $('#save-modal').modal();

    function createMatchSocket(){
        matchSocket = new WebSocket(
            urlPath.webSocketURL(shareCode)
        );
    
        matchSocket.onopen = function(e) {
            console.log("Match socket opened");

            //Set retry vars to defaults;
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
            if (responseData.hasOwnProperty('data')){
                commandData = responseData.data
            }
            else{
                console.log("Error: No data in response.")
                return
            }

            //Eliminate movie
            if(receivedCommand == "eliminated"){
                let shared_movie_id = commandData.shared_movie_id
                let eliminating_uuid = commandData.eliminating_uuid
                let next_uuid = commandData.next_eliminating_uuid
                let eliminated_movie = movie_list.find(movie => movie.shared_movie_id == shared_movie_id)
                let eliminating_user = user_list[eliminating_uuid]

                eliminated_movie.is_eliminated == true;
                $(`#shared_${eliminated_movie.tmdb_id}`).addClass('eliminated')
                console.log("Eliminated movie")

                let toastClass = "purple-text text-accent-2"
                if(eliminating_uuid == user_uuid){
                    toastClass = "cyan-text text-accent-2"
                }
                let toastHtml = `<span><strong class=${toastClass}>${eliminating_user.nickname} </strong>&nbsp;eliminated&nbsp;<strong class="orange-text text-darken-3"> ${eliminated_movie.title}</strong></span>`
                M.toast({html: toastHtml})
                
                setUserTurn(next_uuid);

                // ====================FLAG====Temporary Final Fix=========================================
                if(commandData.hasOwnProperty('final_shared_movie_id')) {
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


                    let {styleClass, icons, statusText} = getStatusBarProperties("final");
                    $('#status-btn').removeClass().addClass(styleClass);
                    $('#status-btn i').html(icons);
                    $('#status-btn span').html(statusText);
                }
                // ==========================================================================================

            }
            
            //User connected
            else if(receivedCommand == "connected"){
                let {uuid:connected_uuid, nickname, is_users_turn} = commandData
                console.log("Connected User: " + connected_uuid);
                if(user_list.hasOwnProperty(connected_uuid)){
                    console.log(`User ${connected_uuid} is already in list.`)
                }
                else{
                    Object.assign(user_list, {connected_uuid:{"nickname": nickname, "is_users_turn": is_users_turn}});
                    addUserToDom(connected_uuid, {"nickname": nickname, "is_users_turn": is_users_turn});
                    console.log(`${nickname} has joined the room. UUID: ${connected_uuid}`)
                    if(connected_uuid != user_uuid){
                        let toastHtml = `<span><strong class="purple-text text-accent-2">${nickname} </strong>&nbsp;has connected.</span>`
                        M.toast({html: toastHtml})
                    }
                }
            }
            //User disconnected
            else if(receivedCommand == "disconnected"){
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
            //Initialize/Update list of movies
            else if(receivedCommand == "initialized" || receivedCommand == "updated"){
                let {
                    movie_list:received_movie_list, 
                    active_user_dict:received_user_list
                } = commandData.share_list
                received_movie_list = received_movie_list.map(movie => 
                        new construct.SharedMovie(movie)
                    )

                movieListBuilder(movie_list, received_movie_list)
                movie_list = received_movie_list
                
                userListBuilder(user_list, received_user_list)
                user_list = received_user_list

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
                else if(isEliminationActive(user_list) ){
                    statusType = "eliminating"
                }
                else{
                    statusType = "start"
                }
                let {styleClass, icons, statusText} = getStatusBarProperties(statusType);
                $('#status-btn').removeClass().addClass(styleClass);
                $('#status-btn i').html(icons);
                $('#status-btn span').html(statusText);
            }
            //Refresh list of movies
            else if(receivedCommand == "refreshed"){
                let {
                    movie_list:received_movie_list, 
                    active_user_dict:received_user_list
                } = commandData.share_list
                received_movie_list = received_movie_list.map(movie => 
                    new construct.SharedMovie(movie)
                )

                user_list = {};
                movie_list= [];
                $('#user_list').html("");
                $('#movie_list').html("");

                movieListBuilder(movie_list, received_movie_list)
                movie_list = received_movie_list
                
                userListBuilder({user_list}, received_user_list)
                user_list = received_user_list   

                $('#final_modal').modal('close');

                let {styleClass, icons, statusText} = getStatusBarProperties("start");
                $('#status-btn').removeClass().addClass(styleClass);
                $('#status-btn i').html(icons);
                $('#status-btn span').html(statusText);
            }
            //Start Elimination
            else if(receivedCommand == "elimination_started"){
                let uuid_turn = commandData.eliminating_uuid
                setUserTurn(uuid_turn);
                let {styleClass, icons} = getStatusBarProperties("eliminating");
                $('#status-btn').removeClass().addClass(styleClass);
                $('#status-btn i').html(icons);
            }
            //Final movie left
            else if(receivedCommand == "finalized"){

                let finalSharedId = commandData.shared_movie_id;
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


                let {styleClass, icons, statusText} = getStatusBarProperties("final");
                $('#status-btn').removeClass().addClass(styleClass);
                $('#status-btn i').html(icons);
                $('#status-btn span').html(statusText);
            }
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

    //Set active user turn
    function setUserTurn(turnUUID){
        //Set all user turn to false and remove any active classes
        Object.keys(user_list).forEach(user => {
            user_list[user].is_users_turn = false;
        })
        $(`#user_list div.active`).removeClass('active').addClass('inactive');
        
        //Set current user turn to true and add active class
        user_list[turnUUID]['is_users_turn'] = true;
        $(`#user_${turnUUID}`).addClass('active').removeClass('inactive');

        //Toast new user turn
        let toastName = (turnUUID != user_uuid) 
            ? `<strong class="purple-text text-accent-2">${user_list[turnUUID]['nickname']}</strong>'s` 
            : '<strong class="cyan-text text-accent-2">YOUR</strong>'
        let toastHtml = `<span>${toastName}&nbsp;turn.</span>`
        M.toast({html: toastHtml})

        //Put username in status bar
        let statusText = getEliminatingStatusString(user_list);
        $('#status-btn span').html(statusText);
    }

    //Check if elimination is active (if it is a users turn)
    function isEliminationActive(userList){
        return Object.keys(userList).some(user => userList[user].is_users_turn == true)
    }

    //Check if final movie
    function isFinalSelected(movieList){
        let eliminatedCount = movieList
            .reduce((prev, curr) => prev + curr.is_eliminated, 0)
        return movieList.length - eliminatedCount == 1
    }

    //Opens final modal for now
    $('#status_bar').on('click', '.status-final' , function() {
        console.log("Opening Modal")
        $('#final_modal').modal('open');
    });

    //Returns current user whose turn it is
    function getEliminatingStatusString(userList){
        let eliminating_uuid = Object.keys(userList)
            .find(uuid => userList[uuid].is_users_turn == true)
        if(eliminating_uuid){
            return (eliminating_uuid == user_uuid)
                ? "Waiting on YOUR turn..." 
                : `Waiting on ${userList[eliminating_uuid].nickname}'s turn...`
        }
        else{
            console.log("Couldn't get uuid of eliminating user.")
            return ""
        }
    }

    //Sets status bar
    function getStatusBarProperties(status){
        let statusProperties = {}
        // [styleClass, icons, statusText]
        if(status == "start"){
            [statusProperties.styleClass, statusProperties.icons, statusProperties.statusText] = [
                "status-start waves-effect waves-light neon-blue-hover btn-large btn-rounded",
                "cast",
                "Start Matching"
            ]
        }
        else if(status == "waiting"){
            [statusProperties.styleClass, statusProperties.icons, statusProperties.statusText] = [
                "status-waiting neon-blue inactive btn-large btn-rounded",
                "cast",
                "Waiting for matching to begin..."
            ]
        }
        else if(status == "eliminating"){
            [statusProperties.styleClass, statusProperties.icons, statusProperties.statusText] = [
                "status-eliminating neon-blue active btn-large btn-rounded",
                "cast_connected",
                getEliminatingStatusString(user_list)
            ]
        }
        else if(status == "final"){
            [statusProperties.styleClass, statusProperties.icons, statusProperties.statusText] = [
                "status-final waves-effect waves-light neon-fuschia active btn-large btn-rounded",
                "movie",
                "Open final movie info"
            ]
        }
        else{
            console.log(`Status Bar Error for status ${status}`)
        }
        return statusProperties
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

    createMatchSocket();
})