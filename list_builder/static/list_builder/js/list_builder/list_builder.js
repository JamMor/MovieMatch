import { MovieCard } from "/static/js/DOMelements.js";
import { disableSearchAddButtons, enableSearchAddButtons } from "./search_bar.js";

const movie_list_prefix ="movie";
const tmdbIdFromDOMId = (domId) => domId.split("_")[1];
const addBtnClass = "add-btn";
const removeBtnClass = "remove-btn";
const movieCardClass = "movie-card";

const $movieList = $("#movie_list");
const $searchResults = $("#search-results");
const $movieCardfromTmdbId = (tmdb_id) => $(`#${movie_list_prefix}_${tmdb_id}`);

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
        $movieList.append(
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
        $movieCardfromTmdbId(thisMovieTmdbId).remove();
        let removedMovie = movie_list.splice(movieIndex, 1)[0];
        console.log(`Removed ${removedMovie.title}.`);
    }
}


function clearMovieList(){
    movie_list = [];
    $movieList.html("");
}



// Attach handlers to DOM elements
const init = () => {
    //Handler to add movie to list and dom
    $searchResults.on("click", `.${addBtnClass}`, function () {
        //Get movie ID from parent Card ID
        let cardId = $(this).closest(`.${movieCardClass}`).attr('id')
        let thisMovieTmdbId = tmdbIdFromDOMId(cardId);
        console.log(`Adding movie id: ${thisMovieTmdbId}`);
        addMovieToDOM(thisMovieTmdbId);
        disableSearchAddButtons(thisMovieTmdbId)
    })

    //Handler to remove movie from list and dom
    $movieList.on("click", `.${removeBtnClass}`, function () {
        //Get movie ID from parent Card ID
        let cardId = $(this).closest(`.${movieCardClass}`).attr('id')
        let thisMovieTmdbId = tmdbIdFromDOMId(cardId);
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