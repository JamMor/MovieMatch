import { Movie, SharedMovie } from "./constructors.js";
import { MovieCard } from "./DOMelements.js";

class MovieList {
    constructor($listDomContainer, movies = []){
        this.$listDomContainer = $listDomContainer;
        this.movies = movies;
    }
    prefix = "movie"

    convertToMovieClass(movie) {
        if (!(movie instanceof Movie)) {
            return new Movie(movie);
        }
        else {
            return movie;
        }
    }

    getCardHtml(movie) {
        return MovieCard(this.prefix, movie.tmdb_id, movie, ["remove", "info"])
    }

    get$movieCardFromTmdbId(tmdb_id) {
        return $(`#${this.domIdFromTmdbId(tmdb_id)}`);
    }

    get$movieCards() {
        return this.$listDomContainer.children(".movie-card");
    }

    tmdbIdFromMovieCardDOMId(domId) {
        return domId.split("_")[1];
    }

    domIdFromTmdbId(tmdb_id) {
        return `${this.prefix}_${tmdb_id}`;
    }

    getIds() {
        return this.movies.map(movie => movie.tmdb_id);
    }

    getDomTmbdIds() {
        return this.get$movieCards().map((index, movieElement) => {
            const $card = $(movieElement);
            return this.tmdbIdFromMovieCardDOMId($card.attr('id'));
            })
            .get()
    }

    getMovieByTmdbId(tmdb_id) {
        return this.movies.find(movie => movie.tmdb_id == tmdb_id);
    }

    getNumberOfMovies() {
        return this.movies.length;
    }

    bulkAddMoviesToList(...moviesToAdd) {
        const currentTmdbIdsSet = new Set(this.getIds());

        let DOMstring = "";

        // Add movies to list and a string of HTML to add to DOM
        moviesToAdd.forEach(movieToAdd => {
            //Only adds movies not already in list
            if (!currentTmdbIdsSet.has(movieToAdd.tmdb_id)){
                const movieObject = this.convertToMovieClass(movieToAdd);
                this.movies.push(movieObject)
                
                DOMstring += this.getCardHtml(movieObject)
            }
            else{
                console.log(`ERROR: Already added ${movieToAdd.tmdb_id}.`)
            }
        })

        // Add the HTML string to the DOM
        this.$listDomContainer.append(DOMstring);
    }

    addMovieToList(movieToAdd) {
        const movie = this.getMovieByTmdbId(movieToAdd.tmdb_id);
        if(movie != undefined){
            console.log("ERROR: Already added.")
            return false;
        }
        const movieObject = this.convertToMovieClass(movieToAdd);
        this.movies.push(movieObject);
        this.$listDomContainer.append(this.getCardHtml(movieObject));
    }

    removeMovieFromListById(tmdb_id) {
        // Find and remove from list
        const movieIndex = this.movies.findIndex(movie => movie.tmdb_id == tmdb_id);
        
        if (movieIndex == -1){
            console.log("ERROR: Movie not found in list.")
            return null;
        }
        else {
            const removedMovie = this.movies.splice(movieIndex, 1);
            // Remove from DOM
            this.get$movieCardFromTmdbId(tmdb_id).remove();
    
            return removedMovie;
        }

    }

    syncLists(newList){
        const currentTmdbIds = new Set(this.getIds())
        const newTmdbIds = new Set(newList.map(movie => movie.tmdb_id))

        //Get the removed movies
        const removedTmdbIds = new Set([...currentTmdbIds].filter(oldTmdbId => !newTmdbIds.has(oldTmdbId)))
        //Get the added movies
        const addedMovieList = newList.filter(movie => !currentTmdbIds.has(movie.tmdb_id))

        //Remove movies from DOM and movie_list
        removedTmdbIds.forEach(tmdb_id => this.removeMovieFromListById(tmdb_id))
        //Add movies to DOM and movie_list
        this.bulkAddMoviesToList(...addedMovieList)
    }

    clearList() {
        this.movies = [];
        this.$listDomContainer.empty();
    }

    verifyListDOMSync(){
        //Confirming DOM and movie list
        const domTmdbIds = this.getDomTmbdIds();
        const thisTmdbIdSet = new Set(this.getIds());
        
        let errorMessage;
        const errorMessages = {
            "length": "DOM and movie list are not the same length.",
            "missing_tmdb": "DOM has a movie that is not in user list."
        }

        if(domTmdbIds.length === thisTmdbIdSet.size){
            if(domTmdbIds.every(domTmdbId => thisTmdbIdSet.has(domTmdbId))){
                errorMessage = errorMessages.missing_tmdb
            }
        }
        else {
            errorMessage = errorMessages.length
        }


        console.log(`DOM and movie list are${errorMessage ? " NOT" : ""} in sync.`)
        if (errorMessage){
            console.log(errorMessage)
        }
        return !errorMessage;
    }
}

class SearchResultsList extends MovieList {
    constructor($listDomContainer, movies = []){
        super($listDomContainer, movies);
    }
    prefix = "query"
    addBtnClass = "add-btn";
    disabledBtnClass = "disabled-btn";

    getCardHtml(movie) {
        return MovieCard(this.prefix, movie.tmdb_id, movie, ["add", "info"], "carousel-item")
    }

    disableAddBtns(...tmdb_ids) {
        tmdb_ids.forEach(tmdb_id => {
            const $searchCard = this.get$movieCardFromTmdbId(tmdb_id);
            $searchCard.find(`.${this.addBtnClass}`)
                .addClass(this.disabledBtnClass);
        })
    }

    enableAddBtns(...tmdb_ids) {
        tmdb_ids.forEach(tmdb_id => {
            const $searchCard = this.get$movieCardFromTmdbId(tmdb_id);
            $searchCard.find(`.${this.addBtnClass}`)
                .removeClass(this.disabledBtnClass);
        })
    }

}

class SharedMovieList extends MovieList {
    constructor($listDomContainer, movies = []){
        super($listDomContainer, movies);
    }
    prefix = "shared"
    eliminatedClass = "eliminated";

    convertToMovieClass(movie) {
        if (!(movie instanceof SharedMovie)) {
            return new SharedMovie(movie);
        }
        else {
            return movie;
        }
    }

    getCardHtml(movie) {
        return MovieCard(this.prefix, movie.tmdb_id, movie, ["remove", "info"])
    }

    getMovieBySharedId(shared_movie_id) {
        return this.movies.find(movie => movie.shared_movie_id == shared_movie_id);
    }

    eliminateMovieBySharedId(shared_movie_id) {
        const eliminatedMovie = this.getMovieBySharedId(shared_movie_id);
        eliminatedMovie.eliminated = true;
        this.get$movieCardFromTmdbId(eliminatedMovie.tmdb_id).addClass(this.eliminatedClass);
        return eliminatedMovie;
    }

    isFinalSelected() {
        return this.movies.filter(movie => movie.eliminated == false).length == 1;
    }

    getFinalMovie() {
        if(!this.isFinalSelected()){
            console.log("ERROR: More than one movie remaining.")
            return false;
        }
        else{
            return this.movies.find(movie => movie.eliminated == false);
        }
    }
}

export { MovieList, SearchResultsList, SharedMovieList }