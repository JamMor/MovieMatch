// Save List

/**
 * Saves current movies to list in DB.
 * @param {object} input - An anonymous object that is destructured
 * @param {number[]} input.tmdb_ids - List of at least 1 tmdb mov.ie IDs
 * @param {string} input.list_name - Name of list to be saved as.
 * @param {number} input.list_id - ID of list to save if modifying existing list.
 */
function saveList ({tmdb_ids, list_name, list_id}) {
    if(tmdb_ids.length == 0){
        console.log("Cannot save empty list.")
        saveStatusToast(list_name, "empty")
        return
    }

    let saveURL = "/save"
    // if there is a list ID, save will append to url to update a list
    // else save will create a new list
    if (list_id) {saveURL += `/${list_id}`}

    $.post(saveURL, JSON.stringify({"list_name":list_name, "tmdb_ids": tmdb_ids}),"json")
            .done(function(data) {
                console.log(data);
                if(data['status'] == "success"){
                    $('#save-modal').modal('close');
                    saveStatusToast(list_name, "success")
                }
                else {
                    console.log(data['status'])
                    saveStatusToast(list_name, "error")
                }
                console.log(data["nextUrl"])
                if (data["nextUrl"]){
                    window.location.href = data["nextUrl"];
                }
            })
            .fail(function() {
                console.log( "Failed to send movie list." );
                saveStatusToast(list_name, "fail-send")
            })
}

/**
 * Displays notification on save status operation. (Materialize Toast)
 * @param {string} listName - Name of list succesfully saved, or name given for failed save.
 * @param {string} status - success/error/empty/fail-send. Status of save list operation.
 */
function saveStatusToast (listName, status) {
    const statusMessages = {
        "success" : "Saved list to",
        "error" : "Could not save",
        "empty" : "Cannot save empty list",
        "fail-send" : "Failed to send"
    }
    
    const message = statusMessages[status] || "Unknown status"
    
    // Truncate list name if too long.
    const displayName = (listName.length > 10) ? `${listName.slice(0,9)}...` : listName;
    const classColor = (status == "success") ? "cyan-text text-accent-2" : "orange-text text-darken-3"
    
    M.toast({html: `<span>${message}&nbsp;<strong class=${classColor}>${displayName}</strong></span>`})
}

function handleEditorSave(){
    let tmdb_ids = movie_list.map(movie => movie.tmdb_id)

    saveList({
        "tmdb_ids" : tmdb_ids, 
        "list_name" : savedListName, 
        "list_id": savedListId})
}
function handleNewSave(){
    let list_name = $("#list-name").val();
    let tmdb_ids = movie_list.map(movie => movie.tmdb_id)

    saveList({
        "tmdb_ids" : tmdb_ids, 
        "list_name":list_name
    })
}

function init(saveHandler){
    $("#save-list-confirm").click(function (e){
        e.preventDefault();
        saveHandler();
    })
}

function disabledSave(){
    $("#open-save-btn.disabled-btn").click(function (e){
        e.preventDefault();
        M.toast({html: `<span><strong  class="orange-text text-darken-3">Must be logged in to save list.</strong></span>`});
    })
}

const editorSave = () => init(handleEditorSave);
const newSave = () => init(handleNewSave);

export {editorSave, newSave, disabledSave}