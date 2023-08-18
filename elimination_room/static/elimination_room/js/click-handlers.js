function sendEliminate(matchSocket, shared_movie_id){
    //Validate
    if(!elimination_active){
        console.log("Host has not started elimination.")
        return
    }
    if(user_uuid != current_eliminating_uuid){
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
}

function sendStartElimination(matchSocket){
    //Validate
    if(movie_list.length < 2){
        console.log("Must have at least 2 movies to begin elimination.")
        return
    }
    
    matchSocket.send(JSON.stringify({
        'command' : 'elimination_start'
    }))
}

function sendRefresh(matchSocket){
    matchSocket.send(JSON.stringify({
        'command' : 'refresh'
    }))
}

const init = (matchSocket) => {
    //Send which movie to eliminate on click
    $('#movie_list').on('click', 'a.remove-btn' , function() {
        sendEliminate.call(this, matchSocket)
    });

    //Send start eliminating command
    $('#status_bar').on('click', '.status-start' , function() {
        sendStartElimination(matchSocket)
    });

    //Send Refresh Share List command
    $('#final_modal').on('click', '#refresh-btn' , function() {
        sendRefresh(matchSocket)
    });
}

export {init}