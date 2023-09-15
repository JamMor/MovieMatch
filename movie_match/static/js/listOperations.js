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
        if (movieIndex != -1){
            let removedMovie = this.movies.splice(movieIndex, 1);
        }
        else{
            console.log("ERROR: Movie not found in list.")
        }

        // Remove from DOM
        const cardId = `${this.prefix}_${tmdb_id}`
        $(`#${cardId}`).remove();

        return removedMovie;
    }

    syncMovieLists(newList){
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

    clearMovieList() {
        this.movies = [];
        this.$listDomContainer.empty();
    }

    verifyMovieListDOMSync(){
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
        return MovieCard(this.prefix, movie.tmdb_id, movie, ["add", "info"])
    }
}

class SharedMovieList extends MovieList {
    constructor($listDomContainer, movies = []){
        super($listDomContainer, movies);
    }
    prefix = "shared"

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
}

export { MovieList, SearchResultsList, SharedMovieList }