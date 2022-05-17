const share_list_prefix ="shared";
    
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
        //Rename attributes for MovieCard
        let {shared_movie_id:id, ...rest} = movie
        $("#movie_list")
            .append(
                construct.MovieCard(share_list_prefix, movie.movie_id, movie, ["remove", "info"])
            );
    })

    
    console.log("Updated Movie List.")

    //Confirming DOM and movie list are in sync FLAG
    let dom_movie_ids = $('#movie_list div').map(function() {
        return this.id.split("_")[1];
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