const image_link = "https://image.tmdb.org/t/p/";
    
//Adds new movies into DOM when a shared list is updated.
function movieListBuilder(old_list, updated_list){
    let added_movie_list;
    if (old_list.length > 0){
        // Get movies from updated list that aren't already in list to be added
        added_movie_list = updated_list
            .filter(new_movie => !old_list
                .some(old_movie => (old_movie.movie_id == new_movie.movie_id)))
    }
    //If no movies in list yet, all are to be added
    else {added_movie_list = updated_list}
    
    added_movie_list.forEach((movie) => {
        //ORIGINAL ADD
        // let background_img = (movie.poster_path == null) 
        //     ? "style='background-color: red'"
        //     : `style='background-image: url(${image_link}w154${movie.poster_path})'`
        
        // let is_eliminated = movie.is_eliminated 
        //     ? "eliminated"
        //     : ""
        
        // $('#movie_list')
        //     .append(
        //         `<div id='movie_${movie.shared_movie_id}' class='list_item personal ${is_eliminated}' ${background_img}>\
        //         <h5>${movie.title} - ${movie.release_date.slice(0,4)}</h5>\
        //         </div>`
        //         );
        
        //SECONDARY ADD
        //Rename attributes for MovieCard
        $("#movie_list")
            .append(
                MovieCard("shared", {description:overview, shared_movie_id:id, ...rest} = movie)
            );
    })

    
    console.log("Updated Movie List.")

    //Confirming DOM and movie list are in sync
    let dom_movie_ids = $('#movie_list div').map(function() {
        return this.id.slice(6);
        })
        .get()
    let new_movie_ids = new Set(updated_list.map(x => x.shared_movie_id))
    let list_verified = false;
    if(dom_movie_ids.length == updated_list.length){
        for(let id of dom_movie_ids){
            if(!new_movie_ids.has(id)){
                break;
            }
        }
        list_verified = true;
    }
    console.log(`DOM and movie_list are${list_verified ? "" : " NOT"} in sync.`)

};