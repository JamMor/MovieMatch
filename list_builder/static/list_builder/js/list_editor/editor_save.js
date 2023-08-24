import {saveList} from "/static/js/save_list.js"

function handleEditorSave(){
    let tmdb_ids = movie_list.map(movie => movie.tmdb_id)

    saveList({
        "tmdb_ids" : tmdb_ids, 
        "list_name" : savedListName, 
        "list_id": savedListId})
}

const init = function(){
    $("#save-list-confirm").click(function (e){
        e.preventDefault();
        handleEditorSave();
    })
}

export {init}