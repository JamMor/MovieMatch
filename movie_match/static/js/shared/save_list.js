import { ajaxErrorHandler } from "/static/js/shared/ajaxErrorHandler.js";
import { escapeHtml } from "/static/js/shared/htmlEscaping.js";
// Save List

const $modal = $("#save-modal");
const $form = $("#save-form");
const $savedListNameInput = $("#list-name");
const $submitBtn = $("#save-list-confirm");
//This is for disabled save buttons if user is not logged in.
const $disabledBtn = $("#open-save-btn.disabled-btn");

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
        saveStatusToast(list_name, "empty");
        return
    }

    // if there is a list ID, save will append to url to update a list
    // else save will create a new list

    $.post({
        url: urlPath.saveList(list_id),
        data: JSON.stringify({ "list_name": list_name, "tmdb_ids": tmdb_ids }),
        dataType: "json"
    })
        .done(function (response) {
            console.log(response);
            if (response.status == "success") {
                $modal.modal('close');
                const savedListName = response.data.list_name;
                saveStatusToast(savedListName, "success");
            }
            else {
                ajaxErrorHandler(response);
                saveStatusToast(list_name, "error");
            }
            // if there is a nextUrl, redirect to it
            const nextUrl = response.data?.nextUrl ?? null
            if (nextUrl) {
                window.location.href = nextUrl;
            }
        })
        .fail(function () {
            console.error("Request failure: save list.");
            saveStatusToast(list_name, "fail");
        })
}

/**
 * Displays notification on save status operation. (Materialize Toast)
 * @param {string} listName - Name of list succesfully saved, or name given for failed save.
 * @param {string} status - success/error/empty/fail. Status of save list operation.
 */
function saveStatusToast (listName, status) {
    const statusMessages = {
        "success" : "Saved list to",
        "error" : "Could not save",
        "empty" : "Cannot save empty list",
        "fail" : "Request failure",
        "unknown" : "Unknown error"
    }
    
    const message = statusMessages[status] || statusMessages["unknown"]
    
    // Truncate list name if too long.
    const displayName = (listName.length > 10) ? `${listName.slice(0,9)}...` : listName;
    const classColor = (status == "success") ? "cyan-text text-accent-2" : "orange-text text-darken-3"
    
    M.toast({html: `<span>${message}&nbsp;<strong class=${classColor}>${escapeHtml(displayName)}</strong></span>`});
}

function getListName(){
    return $savedListNameInput.val() ?? "";
}

function getListId (){
    // Get the action of $form
    const formAction = $form.attr("action")
    // Gets the list id from the action url, or null if none
    return formAction.split("/")?.[2] ?? null
}

function saveHandler(movieList){
    let fields = {
        "tmdb_ids" : movieList.getIds(),
        "list_name": getListName() ?? ""
    }
    const listId = getListId()
    if (listId){
        fields["list_id"] = listId
    }
    saveList(fields)
}

function disabledSave(){
    $disabledBtn.click(function (e){
        e.preventDefault();
        M.toast({html: `<span><strong  class="orange-text text-darken-3">Must be logged in to save list.</strong></span>`});
    })
}

function init(movieList){
    $submitBtn.click(function (e){
        e.preventDefault();
        saveHandler(movieList);
    })
}

export { init as saveInit, disabledSave }