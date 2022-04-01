$(document).ready(function() {

    const api_key = "f4f5f258379baf10796e1d3aeb5add05";
    const image_link = "https://image.tmdb.org/t/p/";

    const shareCode = $('#share-code').text();

    const matchSocket = new WebSocket(
        'ws://'
        + window.location.host
        + '/ws/match/'
        + shareCode
        + '/'
    );
    
    matchSocket.onopen = function(e) {
        console.log("Match socket opened");
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
        }
        else {
            console.log("Command Unknown")
            console.log(responseData)
        }
    };

    matchSocket.onclose = function(e) {
        console.error('Match socket closed unexpectedly');
    };

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
            'shared_movie_id' : shared_movie_id,
            'uuid' : user_uuid
        }))
    });
    
    //Break into JS only loaded for creator
    //Send start signal
    $('#status_bar').on('click', '#start-btn' , function() {
        console.log("Send start matching signal.")
        matchSocket.send(JSON.stringify({
            'command' : 'elimination_start'
        }))
    });
    
    //Refresh Share List
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
    }

    //Check if elimination is active (if it is a users turn)
    function isEliminationActive(userList){
        return Object.keys(userList).some(user => userList[user].is_users_turn == true)
    }
})