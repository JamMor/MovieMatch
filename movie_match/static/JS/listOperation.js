/**
 * Constructor namespace.
 * @namespace listOperation
 */
// const listOperation = {};

// Save List

/**
 * Saves current movies to list in DB.
 * @param {object} input - An anonymous object that is destructured
 * @param {number[]} input.tmdb_ids - List of at least 1 tmdb mov.ie IDs
 * @param {string} input.list_name - Name of list to be saved as.
 * @param {number} input.list_id - ID of list to save if modifying existing list.
 */
listOperation.saveList = ({tmdb_ids, list_name, list_id}) => {
    let saveURL = "/save"
    // if there is a list ID, save will append to url to update a list
    // else save will create a new list
    if (list_id) {saveURL += `/${list_id}`}

    $.post(saveURL, JSON.stringify({"list_name":list_name, "tmdb_ids": tmdb_ids}),"json")
            .done(function(data) {
                console.log(data);
                if(data['status'] == "success"){
                    $('#save-modal').modal('close');
                    listOperation.saveStatusToast(list_name, "success")
                }
                else {
                    console.log(data['status'])
                    listOperation.saveStatusToast(list_name, "error")
                }
                console.log(data["nextUrl"])
                if (data["nextUrl"]){
                    console.log("Time to redirect")
                    // window.location.href = data["nextUrl"];
                }
            })
            .fail(function() {
                console.log( "Failed to send movie list." );
                listOperation.saveStatusToast(list_name, "fail-send")
            })
}

/**
 * Displays notification on save status operation. (Materialize Toast)
 * @param {string} listName - Name of list succesfully saved, or name given for failed save.
 * @param {string} status - success/error/empty/fail-send. Status of save list operation.
 */
listOperation.saveStatusToast = (listName, status) =>{
    let toast = {}
    // Truncate list name if too long.
    toast.name = (listName.length > 10) ? `${listName.slice(0,9)}...` : listName;

    if(status == "success"){
        toast.class = "cyan-text text-accent-2"
        toast.text = "Saved list to"
    }
    else if(status == "error"){
        toast.class = "orange-text text-darken-3"
        toast.text = "Could not save"
    }
    else if(status == "empty"){
        toast.class = "orange-text text-darken-3"
        toast.text = "Cannot save empty list"
    }
    else if(status == "fail-send"){
        toast.class = "orange-text text-darken-3"
        toast.text = "Failed to send"
    }

    M.toast({html: `<span>${toast.text}&nbsp;<strong class=${toast.class}>${toast.name}</strong></span>`})
}