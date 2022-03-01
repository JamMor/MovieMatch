const image_link = "https://image.tmdb.org/t/p/";
    
//Adds new movies into DOM
function movieAdder(old_list, updated_list){
    if (old_list.length > 0){
        // Get movies from updated list that aren't already in list to be added
        new_movie_list = updated_list
            .filter(new_movie => !old_list
                .some(old_movie => (old_movie.movie_id == new_movie.movie_id)))
    }
    else {new_movie_list = updated_list}
    
    new_movie_list.forEach((movie) => {
        background_img = (movie.poster_path == null) 
            ? "style='background-color: red'"
            : `style='background-image: url(${image_link}w154${movie.poster_path})'`
        
            is_eliminated = movie.is_eliminated 
            ? "eliminated"
            : ""
        
        $('#movie_list')
            .append(
                `<div id='movie_${movie.shared_movie_id}' class='list_item personal ${is_eliminated}' ${background_img}>\
                <h5>${movie.title} - ${movie.release_date.slice(0,4)}</h5>\
                </div>`
                );
    })
};