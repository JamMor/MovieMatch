function handleEditorSave(){
    if(movie_list.length == 0){
        listOperation.saveStatusToast(list_name, "empty")
        return
    }

    let tmdb_ids = movie_list.map(movie => movie.tmdb_id)

    listOperation.saveList({
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