import { saveList } from "./save_list.js";

$("#save-list-confirm").click(function (e){
    e.preventDefault();
    let list_name = $("#list-name").val();
    let tmdb_ids = movie_list.map(movie => movie.tmdb_id)

    saveList({
        "tmdb_ids" : tmdb_ids, 
        "list_name":list_name
    })
})