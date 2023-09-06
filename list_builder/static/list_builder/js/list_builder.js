import { MovieCard } from "/static/js/DOMelements.js";
import { disableSearchAddButtons, enableSearchAddButtons } from "./search_bar.js";

const movie_list_prefix ="movie";

function addMovieToDOM(thisMovieTmdbId){
    let thisMovie;
    //If movie not already in list, get info from search results and push to list
    if(!movie_list.some(movie => movie.tmdb_id == thisMovieTmdbId)){
        for(let i=0; i<search_results.length; i++){
            if(search_results[i].tmdb_id == thisMovieTmdbId){
                thisMovie = search_results[i];
                break
            }
        }
        console.log(thisMovie.title)
        movie_list.push(thisMovie);

        //Add movie to DOM
        $("#movie_list").append(
            MovieCard(movie_list_prefix,  thisMovie.tmdb_id, thisMovie, ["remove", "info"])
            );
    }
    else{
        console.log("ERROR: Already added.")
    }
}

function removeMovieFromDOM(thisMovieTmdbId){
    let movieIndex = movie_list.findIndex(movie => movie.tmdb_id == thisMovieTmdbId);
    if (movieIndex == -1){
        console.log("ERROR: Movie not found in list.")
    }
    else{
        $(`#movie_${thisMovieTmdbId}`).remove();
        let removedMovie = movie_list.splice(movieIndex, 1)[0];
        console.log(`Removed ${removedMovie.title}.`);
    }
}


function clearMovieList(){
    movie_list = [];
    $('#movie_list').html("");
}



// Attach handlers to DOM elements
const init = () => {
    //Handler to add movie to list and dom
    $('.carousel').on("click", "btn.add-btn", function () {
        //Get movie ID from parent Card ID
        let thisMovieId = $(this).closest('div.card').attr('id')
            .split("_")[1];
        console.log(`Adding movie id: ${thisMovieId}`);
        addMovieToDOM(thisMovieId);
        disableSearchAddButtons(thisMovieId)
    })

    //Handler to remove movie from list and dom
    $('#movie_list').on("click", "btn.remove-btn", function () {
        //Get movie ID from parent Card ID
        let thisMovieTmdbId = $(this).closest('div.card').attr('id')
            .split("_")[1];
        console.log(`Removing movie id ${thisMovieTmdbId}`);
        removeMovieFromDOM(thisMovieTmdbId);
        enableSearchAddButtons(thisMovieTmdbId);
    })

    // Button to clear current movie list FLAG: Is used?
    $("#clear").click(function (){
        clearMovieList();
    })
}

export { init }