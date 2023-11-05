import { ajaxErrorHandler } from "/static/js/shared/ajaxErrorHandler.js";
import {applyTooltips, resetFormErrors} from "/static/js/shared/form_functions.js";
import { escapeHtml } from "/static/js/shared/htmlEscaping.js";
import { validateUserInput } from "/static/js/shared/regexValidators.js";
// Save List

const saveForm = document.querySelector("#save-form");
const $form = $(saveForm);
const listNameKey = "save-list_name";
const $modal = $("#save-modal");
const $submitBtn = $("#save-list-confirm");

//This is for disabled save buttons if user is not logged in.
const $disabledBtn = $("#open-save-btn.disabled-btn");


function submitSaveList(movieList) {
    resetFormErrors($form)
    const saveFormData = new FormData(saveForm);
    const listName = saveFormData.get(listNameKey);

    const listNameValidation = validateUserInput(listName);
    if (!listNameValidation.isValid) {
        ajaxErrorHandler({ form_errors: { [listNameKey]: [listNameValidation.errorMsg] } }, $form)
        saveStatusToast(listName, "error");
        return
    }

    const tmdb_ids = movieList.getIds();
    if (tmdb_ids.length == 0){
        console.log("Cannot save empty list.")
        saveStatusToast(listName, "empty");
        return
    }
    saveFormData.append("tmdb_ids", JSON.stringify(tmdb_ids));

    $.ajax({
        url: saveForm.action,
        method: saveForm.method,
        data: saveFormData,
        // processData and contentType needed to properly send formData
        // jQuery tries to make it a string
        processData: false,
        contentType: false,
        dataType: "json",
    })
        .done(function (response) {
            if (response.status == "success") {
                $modal.modal('close');
                const savedListName = response.data.list_name;
                saveStatusToast(savedListName, "success");
            }
            else {
                ajaxErrorHandler(response, $form)
                saveStatusToast(listName, "error");
            }
            // if there is a nextUrl, redirect to it
            const nextUrl = response.data?.nextUrl ?? null
            if (nextUrl) {
                window.location.href = nextUrl;
            }
        })
        .fail(function () {
            console.error("Request failure: save list.");
            saveStatusToast(listName, "fail");
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

function disabledSave(){
    $disabledBtn.click(function (e){
        e.preventDefault();
        M.toast({html: `<span><strong  class="orange-text text-darken-3">Must be logged in to save list.</strong></span>`});
    })
}

function init(movieList){
    applyTooltips()

    $submitBtn.click(function (e){
        e.preventDefault();
        submitSaveList(movieList);
    })
}

export { init as saveInit, disabledSave }