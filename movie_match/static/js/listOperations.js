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

    getDomIds() {
        return this.get$movieCards().map(function($element) {
            return this.tmdbIdFromMovieCardDOMId($element.attr('id'));
            }, this)
            .get()
    }

    getMovieByTmdbId(tmdb_id) {
        return this.movies.find(movie => movie.tmdb_id == tmdb_id);
    }

    bulkAddMoviesToList(...moviesToAdd) {
        let currentTmdbIdsSet = new Set(this.movies.map(movie => movie.tmdb_id));

        let DOMstring = "";

        // Add movies to list and a string of HTML to add to DOM
        moviesToAdd.forEach(movieToAdd => {
            //Only adds movies not already in list
            if (!currentTmdbIdsSet.has(movieToAdd.tmdb_id)){
                let movieObject = this.convertToMovieClass(movieToAdd);
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
        for (let i = 0; i < this.movies.length; i++) {
            if (this.movies[i].tmdb_id == movieToAdd.tmdb_id) {
                console.log("ERROR: Already added.")
                return false;
            }
        }
        let movieObject = this.convertToMovieClass(movieToAdd);
        this.movies.push(movieObject);
        this.$listDomContainer.append(this.getCardHtml(movieObject));
    }

    removeMovieFromListById(tmdb_id) {
        // Find and remove from list
        let movieIndex = this.movies.findIndex(movie => movie.tmdb_id == tmdb_id);
        let removedMovie = null;
        if (movieIndex != -1){
            removedMovie = this.movies.splice(movieIndex, 1);
        }
        else{
            console.log("ERROR: Movie not found in list.")
            return false;
        }

        // Remove from DOM
        const cardId = this.domIdFromTmdbId(tmdb_id);
        $(`#${cardId}`).remove();

        return removedMovie;
    }

    syncLists(newList){
        const currentTmdbIds = new Set(this.movies.map(movie => movie.tmdb_id))
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
        const $movieCards = this.get$movieCards();
        //Confirming DOM and movie list are in sync FLAG
        const domTmdbIds = $movieCards.map(function($element) {
            return this.tmdbIdFromMovieCardDOMId($element.attr('id'));
            }, this)
            .get()
            
        const sourceTmdbIdSet = new Set(this.movies.map(x => x.tmdb_id))
        let listVerified = false;
        if(domTmdbIds.length === sourceTmdbIdSet.size){
            if(domTmdbIds.every(tmdbId => sourceTmdbIdSet.has(tmdbId))){
                listVerified = true;
            }
        }
        console.log(`DOM and movie_list are${listVerified ? "" : " NOT"} in sync.`)
        
        return listVerified;
    }
}

class SearchResultsList extends MovieList {
    constructor($listDomContainer, movies = []){
        super($listDomContainer, movies);
    }
    prefix = "query"

    getCardHtml(movie) {
        return MovieCard(this.prefix, movie.tmdb_id, movie, ["add", "info"], "carousel-item")
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
        $(`#${this.domIdFromTmdbId(eliminatedMovie.tmdb_id)}`).addClass(this.eliminatedClass);
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