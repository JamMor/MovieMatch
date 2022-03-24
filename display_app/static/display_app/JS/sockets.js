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
        //Populate current share and user list.
        matchSocket.send(JSON.stringify({
            'command' : 'initialize',
            'message': 'Test intialize send.'
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

            //Remove class for last eliminating user
            user_list[eliminating_uuid]['is_users_turn'] = false;
            $(`#user_list div.blue`).addClass('orange');
            $(`#user_list div.blue`).removeClass('blue');
            
            //Add class for new eliminating user
            user_list[next_uuid]['is_users_turn'] = true;
            $(`#user_${next_uuid}`).addClass('blue');
            $(`#user_${next_uuid}`).removeClass('orange');
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
            let disconnected_uuid = responseData.uuid;
            console.log('Disconnected UUID: ' + disconnected_uuid)
            removeUserFromDom(disconnected_uuid);
            delete user_list[disconnected_uuid]
        }
        //Initialize/Update list of movies
        else if(responseData.command == "initialized" || responseData.command == "updated"){
            let {
                movie_list:received_movie_list, 
                active_user_dict:received_user_list,
                has_started_elimination:received_status
            } = responseData.share_list
            has_started_elimination = received_status;

            console.log("Movie List: ")
            console.log(movie_list)
            console.log("Received Movie List: ")
            console.log(received_movie_list)
            // received_movie_list = responseData.share_list.movie_list
            movieListBuilder(movie_list, received_movie_list)
            movie_list = received_movie_list
            
            // received_user_list = responseData.share_list.active_user_list
            console.log("User List: ")
            console.log(user_list)
            console.log("Received User List: ")
            console.log(received_user_list)
            userListBuilder(user_list, received_user_list)
            user_list = received_user_list
            
        }
        //Refresh list of movies
        else if(responseData.command == "refreshed"){
            let {
                movie_list:received_movie_list, 
                active_user_dict:received_user_list,
                has_started_elimination:received_status
            } = responseData.share_list
            has_started_elimination = received_status;

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
            has_started_elimination = true;
            let uuid_turn = responseData.eliminating_uuid
            user_list[uuid_turn]['is_users_turn'] = true;
            $(`#user_${uuid_turn}`).addClass('blue');
            $(`#user_${uuid_turn}`).removeClass('orange');
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
        if(!has_started_elimination){
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
    
    $('#final_modal').on('click', '#refresh-btn' , function() {
        console.log("Refreshing list.")
        matchSocket.send(JSON.stringify({
            'command' : 'refresh'
        }))
    });
})