import { movieList, searchResults } from "./movie_lists.js";

const addBtnClass = "add-btn";
const removeBtnClass = "remove-btn";
const movieCardClass = "movie-card";

const $movieListDiv = movieList.$listDomContainer;
const $searchResultsDiv = searchResults.$listDomContainer;

// This handles interaction between the searchList and movieList
const init = () => {
    //Handler to add movie to list and dom
    $searchResultsDiv.on("click", `.${addBtnClass}`, function () {
        //Get movie ID from parent Card ID
        const cardId = $(this).closest(`.${movieCardClass}`).attr('id')
        const thisMovieTmdbId = movieList.tmdbIdFromMovieCardDOMId(cardId);
        console.log(`Adding movie id: ${thisMovieTmdbId}`);
        const searchMovie = searchResults.getMovieByTmdbId(thisMovieTmdbId);
        if (!searchMovie) {
            return false;
        }
        movieList.addMovieToList(searchResults.getMovieByTmdbId(thisMovieTmdbId));
        searchResults.disableAddBtns(thisMovieTmdbId)
    })

    //Handler to remove movie from list and dom
    $movieListDiv.on("click", `.${removeBtnClass}`, function () {
        //Get movie ID from parent Card ID
        const cardId = $(this).closest(`.${movieCardClass}`).attr('id')
        const thisMovieTmdbId = movieList.tmdbIdFromMovieCardDOMId(cardId);
        console.log(`Removing movie id ${thisMovieTmdbId}`);
        movieList.removeMovieFromListById(thisMovieTmdbId);
        searchResults.enableAddBtns(thisMovieTmdbId);
    })
}

export { init }