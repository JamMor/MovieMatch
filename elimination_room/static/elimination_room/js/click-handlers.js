// Attaches click handlers to elements on the page

const init = (matchSocket) => {
    console.log("Initializing click handlers.")
    //Send which movie to eliminate on click
    $('#movie_list').on('click', 'a.remove-btn' , function() {
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

    //Opens final modal for now
    $('#status_bar').on('click', '.status-final' , function() {
        console.log("Opening Modal")
        $('#final_modal').modal('open');
    });
}

export {init}