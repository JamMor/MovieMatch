/**
 * Constructor namespace.
 * @namespace dataObjects
 */

//JS Objects

/**
 * Constructs a Movie object for movie_list
 * @class Movie
 * @param {object} movie - Movie object from the MovieDB search query
 */
const Movie = class Movie{
    constructor({tmdb_id, title, release_date, overview, poster_path}){
        this.tmdb_id = tmdb_id;
        this.title = title;
        this.release_date = release_date;
        this.overview = overview;
        this.poster_path = poster_path;
    }

    get releaseYear() {
        return this.release_date?.slice(0, 4) ?? ""
    }

    get fullPosterURL(){
        const image_prefix = "https://image.tmdb.org/t/p/";
        const placeholder_link = DJ_STATIC_FILES.placeholder_path;
        return (this.poster_path == null)
            ? `${placeholder_link}`
            : `${image_prefix}w342${this.poster_path}`
    }
}


/**
 * Constructs a SharedMovie object for movie_list in matchroom
 * @class SharedMovie
 * @extends Movie
 * @param {object} movie - SharedMovie object from database.
 */
const SharedMovie = class SharedMovie extends Movie{
    constructor({shared_movie_id, is_eliminated, ...movie}) {
        super(movie);
        this.shared_movie_id = shared_movie_id;
        this.is_eliminated = is_eliminated;
    }
}

/**
 * Constructs a DetailedMovie object for MoreInfo modals
 * @class DetailedMovie
 * @extends Movie
 * @param {object} movie - Movie object from the MovieDB info request
 */
const DetailedMovie = class DetailedMovie extends Movie{
    constructor({genres=[], imdb_id="", runtime="", vote_average="",
        "watch/providers":{results:{US:{flatrate:stream=[], rent=[]}}},
        ...movie}) {
        super(movie);
        this.genres = genres;
        this.runtime = runtime;
        this.vote_average = vote_average;
        this.stream = stream;
        this.rent = rent;
    }

    get formattedRuntime(){
        let runtime_hours = Math.floor(this.runtime/60);
        runtime_hours = runtime_hours > 0 ? `${runtime_hours} hr, ` : ''
        let runtime_minutes = `${this.runtime%60} min`
        return `${runtime_hours}${runtime_minutes}`
    }
}

export { Movie, SharedMovie, DetailedMovie}