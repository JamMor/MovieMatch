const movie_list_prefix ="movie";
let importedList = JSON.parse(
    document.getElementById('imported-movie-data').textContent);

function addMoviesToList(...movies) {
    current_movie_ids_set = new Set(movie_list.map(movie => movie.tmdb_id));

    let DOMstring = "";

    movies.forEach(movie => {
        //Only adds movies not already in list
        if (!current_movie_ids_set.has(movie.tmdb_id)){
            movieObject = new construct.Movie(movie);
            movie_list.push(movieObject)

            DOMstring += construct.MovieCard(
                movie_list_prefix,  
                movieObject.tmdb_id, 
                movieObject, 
                ["remove", "info"])
        }
    })

    $("#movie_list").append(DOMstring);
}

const init = () => {
    addMoviesToList(...importedList);
}

export {init}