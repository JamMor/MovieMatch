const movieCardClass = "movie-card"
const removeBtnClass = "remove-btn"
const startEliminationClass = "status-start"
const refreshBtnId = "refresh-btn"

const $movieList = $("#movie_list");
const $finalModal = $("#final_modal");
const $statusBar = $("#status_bar");

function sendEliminate(matchSocket){
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
    let tmdb_id = $(this).closest(`.${movieCardClass}`).attr('id')
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
    $movieList.on('click', `.${removeBtnClass}` , function() {
        sendEliminate.call(this, matchSocket)
    });

    //Send start eliminating command
    $statusBar.on('click', `.${startEliminationClass}` , function() {
        sendStartElimination(matchSocket)
    });

    //Send Refresh Share List command
    $finalModal.on('click', `#${refreshBtnId}` , function() {
        sendRefresh(matchSocket)
    });
}

export {init}