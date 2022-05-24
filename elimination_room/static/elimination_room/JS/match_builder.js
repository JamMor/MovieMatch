const share_list_prefix ="shared";
    
//Adds new movies into DOM when a shared list is updated.
function movieListBuilder(current_list, new_list){
    let added_movie_list;
    if (current_list.length > 0){
        // Filter movies from updated list that aren't already in old list
        //FLAG maybe just compare sets of ID's
        added_movie_list = new_list
            .filter(new_movie => !current_list
                .some(current_movie => (current_movie.tmdb_id == new_movie.tmdb_id)))
    }
    //If no movies in list yet, all are to be added
    else {added_movie_list = new_list}
    
    added_movie_list.forEach((movie) => {
        $("#movie_list")
            .append(
                construct.MovieCard(share_list_prefix, movie.tmdb_id, movie, ["remove", "info"])
            );
    })

    
    console.log("Updated Movie List.")

    //Confirming DOM and movie list are in sync FLAG
    let dom_tmdb_ids = $('#movie_list div').map(function() {
        return this.id.split("_")[1];
        })
        .get()
    let new_tmdb_ids = new Set(new_list.map(x => x.shared_tmdb_id))
    let list_verified = false;
    if(dom_tmdb_ids.length == new_list.length){
        for(let id of dom_tmdb_ids){
            if(!new_tmdb_ids.has(id)){
                break;
            }
        }
        list_verified = true;
    }
    console.log(`DOM and movie_list are${list_verified ? "" : " NOT"} in sync.`)

};