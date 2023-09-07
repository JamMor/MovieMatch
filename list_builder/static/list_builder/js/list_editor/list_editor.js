import { Movie } from "/static/js/constructors.js";
import { MovieCard } from "/static/js/DOMelements.js";

const movie_list_prefix ="movie";
const importedList = JSON.parse(
    document.getElementById('imported-movie-data').textContent);
const $movieList = $("#movie_list");

//Adds movies to list and DOM from script data source
function addMoviesToList(...movies) {
    let current_movie_ids_set = new Set(movie_list.map(movie => movie.tmdb_id));

    let DOMstring = "";

    movies.forEach(movie => {
        //Only adds movies not already in list
        if (!current_movie_ids_set.has(movie.tmdb_id)){
            let movieObject = new Movie(movie);
            movie_list.push(movieObject)

            DOMstring += MovieCard(
                movie_list_prefix,  
                movieObject.tmdb_id, 
                movieObject, 
                ["remove", "info"])
        }
    })

    $movieList.append(DOMstring);
}

const init = () => {
    addMoviesToList(...importedList);
}

export {init}