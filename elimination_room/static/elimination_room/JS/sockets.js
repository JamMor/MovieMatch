$(document).ready(function() {

    const api_key = "f4f5f258379baf10796e1d3aeb5add05";
    const image_link = "https://image.tmdb.org/t/p/";

    const shareCode = $('#share-code').text();
    const initialRetryTime = 2000;
    const maxRetryInterval = 10;

    var retryAttempts = 0;
    //Exponentially increasing time to retry connection
    var retryTime = () => (1.65**retryAttempts)*initialRetryTime;
    var matchSocket = null;

    function createMatchSocket(){
        matchSocket = new WebSocket(
            'ws://'
            + window.location.host
            + '/ws/match/'
            + shareCode
            + '/'
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

            // Failed command
            if(responseData.status != 'success'){
                console.log("Command failed.")
                console.log(responseData)
                return
            }
            //Eliminate movie
            else if(responseData.command == "eliminated"){
                let shared_movie_id = responseData.shared_movie_id
                let eliminating_uuid = responseData.eliminating_uuid
                let next_uuid = responseData.next_eliminating_uuid
                $(`#shared_${shared_movie_id}`).addClass('eliminated')
                console.log("Eliminated movie")
                setUserTurn(next_uuid);
            }
            
            //User connected
            else if(responseData.command == "connected"){
                let connected_user = responseData.user
                console.log("Connected User: ");
                console.log(connected_user);
                let connected_uuid = Object.keys(connected_user)[0]
                if(user_list.hasOwnProperty(connected_uuid)){
                    console.log(`User ${connected_uuid} is already in list.`)
                }
                else{
                    Object.assign(user_list, connected_user);
                    addUserToDom(connected_uuid, connected_user[connected_uuid]);
                    console.log(`${connected_user[connected_uuid]['nickname']} has joined the room. UUID: ${Object.keys(connected_user)[0]}`)
                }
            }
            //User disconnected
            else if(responseData.command == "disconnected"){
                if (responseData.hasOwnProperty("next_eliminating_uuid")){
                    setUserTurn(responseData.next_eliminating_uuid)
                }

                let disconnected_uuid = responseData.uuid;
                console.log('Disconnected UUID: ' + disconnected_uuid)
                removeUserFromDom(disconnected_uuid);
                delete user_list[disconnected_uuid]
            }
            //Initialize/Update list of movies
            else if(responseData.command == "initialized" || responseData.command == "updated"){
                let {
                    movie_list:received_movie_list, 
                    active_user_dict:received_user_list
                } = responseData.share_list

                movieListBuilder(movie_list, received_movie_list)
                movie_list = received_movie_list
                
                userListBuilder(user_list, received_user_list)
                user_list = received_user_list

                let statusType;
                if(isFinalSelected(movie_list)){
                    statusType = "final"
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
            else if(responseData.command == "refreshed"){
                let {
                    movie_list:received_movie_list, 
                    active_user_dict:received_user_list
                } = responseData.share_list

                user_list = {};
                movie_list= [];
                $('#user_list').html("");
                $('#movie_list').html("");

                movieListBuilder(movie_list, received_movie_list)
                movie_list = received_movie_list
                
                userListBuilder({user_list}, received_user_list)
                user_list = received_user_list   

                $('#final_modal').modal('close');
            }
            //Start Elimination
            else if(responseData.command == "elimination_started"){
                let uuid_turn = responseData.eliminating_uuid
                setUserTurn(uuid_turn);
                let {styleClass, icons} = getStatusBarProperties("start");
                $('#status-btn').removeClass().addClass(styleClass);
                $('#status-btn i').html(icons);
            }
            //Final movie left
            else if(responseData.command == "finalized"){
                let finalSharedId = responseData.shared_movie_id;
                let movieIndex = movie_list.findIndex(movie => movie.shared_movie_id == finalSharedId);
                let finalMovie = movie_list[movieIndex];
                console.log(`${finalMovie.title} is the final choice!`)
                
                let finalMovieInfo;
                //Ajax for more movie detail
                const api_key = "f4f5f258379baf10796e1d3aeb5add05";
                $.get(`https://api.themoviedb.org/3/movie/${finalMovie.movie_id}?api_key=${api_key}&language=en-US`,
                    function () {
                        console.log("AJAX sent to TMDB");
                        return
                    }, "json")
                    .done(function (data) {
                        finalMovieInfo = data;
                        $.get(`https://api.themoviedb.org/3/movie/${finalMovie.movie_id}/watch/providers?api_key=${api_key}`,
                            function(){
                                console.log("AJAX sent to TMDB");
                                return
                            }, "json")
                            .done(function(data){
                                console.log("Watch provider data:");
                                finalMovieInfo['watch_providers'] = data.results.US;
                                $("#final_modal div.modal-content")
                                    .html(MovieInfoModal(finalMovieInfo))
                                
                                $('.modal').modal({
                                    inDuration: 1500,
                                    dismissible: false,
                                    endingTop: "2%"
                                });
                                $('.collapsible').collapsible();
                                $('.tooltipped').tooltip();
                                console.log(finalMovieInfo);
                                $('#final_modal').modal('open');
                            })
                    })
                    .fail(function(){
                        $("#final_modal div.modal-content")
                            .html(MovieInfoModal(finalMovie))
                        $('.modal').modal({
                            inDuration: 1500,
                            dismissible: false,
                            endingTop: "2%"
                        });
                        $('.collapsible').collapsible();
                        $('.tooltipped').tooltip();
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

        //Get shared movie ID from parent Card ID
        let shared_movie_id = $(this).closest('div.card').attr('id')
            .split("_")[1];

        matchSocket.send(JSON.stringify({
            'command' : 'eliminate',
            'shared_movie_id' : shared_movie_id
        }))
    });
    
    //Send start eliminating command
    $('#status_bar').on('click', '.status-start' , function() {
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
                "status-start waves-effect waves-light neon-blue-hover btn-large",
                "cast",
                "Start Matching"
            ]
        }
        else if(status == "waiting"){
            [statusProperties.styleClass, statusProperties.icons, statusProperties.statusText] = [
                "status-waiting neon-blue inactive btn-large",
                "cast",
                "Waiting for matching to begin..."
            ]
        }
        else if(status == "eliminating"){
            [statusProperties.styleClass, statusProperties.icons, statusProperties.statusText] = [
                "status-eliminating neon-blue active btn-large",
                "cast_connected",
                getEliminatingStatusString(user_list)
            ]
        }
        else if(status == "final"){
            [statusProperties.styleClass, statusProperties.icons, statusProperties.statusText] = [
                "status-final waves-effect waves-light neon-fuschia active btn-large",
                "movie",
                "Start Matching"
            ]
        }
        else{
            console.log(`Status Bar Error for status ${status}`)
        }
        return statusProperties
    }

    createMatchSocket();
})