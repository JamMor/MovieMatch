import { disableSearchAddButtons, enableSearchAddButtons } from "./search_bar.js";
import { movieList, searchResults } from "./movie_lists.js";

const addBtnClass = "add-btn";
const removeBtnClass = "remove-btn";
const movieCardClass = "movie-card";

const $movieList = $("#movie_list");
const $searchResults = $("#search-results");

// Attach handlers to DOM elements
const init = () => {
    //Handler to add movie to list and dom
    $searchResults.on("click", `.${addBtnClass}`, function () {
        //Get movie ID from parent Card ID
        const cardId = $(this).closest(`.${movieCardClass}`).attr('id')
        const thisMovieTmdbId = this.movieList.tmdbIdFromMovieCardDOMId(cardId);
        console.log(`Adding movie id: ${thisMovieTmdbId}`);
        const searchMovie = searchResults.getMovieByTmdbId(thisMovieTmdbId);
        if (!searchMovie) {
            return false;
        }
        movieList.addMovieToList(searchResults.getMovieByTmdbId(thisMovieTmdbId));
        disableSearchAddButtons(thisMovieTmdbId)
    })

    //Handler to remove movie from list and dom
    $movieList.on("click", `.${removeBtnClass}`, function () {
        //Get movie ID from parent Card ID
        const cardId = $(this).closest(`.${movieCardClass}`).attr('id')
        const thisMovieTmdbId = this.movieList.tmdbIdFromMovieCardDOMId(cardId);
        console.log(`Removing movie id ${thisMovieTmdbId}`);
        movieList.removeMovieFromListById(thisMovieTmdbId);
        enableSearchAddButtons(thisMovieTmdbId);
    })

    // Button to clear current movie list FLAG: Is used?
    $("#clear").click(function (){
        // clearMovieList();
        movieList.clearList();
    })
}

export { init }