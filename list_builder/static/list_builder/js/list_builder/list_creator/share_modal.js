import { movieList } from "../movie_lists.js";
import { ajaxErrorHandler } from "/static/js/shared/ajaxErrorHandler.js";
import {applyTooltips, resetFormErrors} from "/static/js/shared/form_functions.js";

const shareForm = document.querySelector("#share-list-form");
const $form = $(shareForm);
const $submitBtn = $("#share-btn");

function validateSharecode(sharecode) {
    if (!/^$|^[2-9a-hj-np-zA-HJ-NP-Z]{8}$/.test(sharecode)) {
        console.log("Invalid Sharecode format.")
        return false
    }
    return true
}

function submitEliminationList() {
    resetFormErrors($form)
    const shareFormData = new FormData(shareForm);
    const sharecode = shareFormData.get("share-sharecode");

    if (!validateSharecode(sharecode)) {
        submitEliminationStatusToast("invalid-sharecode");
        // ajaxErrorHandler(response, $form)
        return
    }


    const tmdb_ids = movieList.getIds();
    shareFormData.append("tmdb_ids", JSON.stringify(tmdb_ids));

    $.ajax({
        url: shareForm.action,
        method: shareForm.method,
        data: shareFormData,
        // processData and contentType needed to properly send formData
        // jQuery tries to make it a string
        processData: false,
        contentType: false,
        dataType: "json",
    })
        .done(function (response) {
            if (response.status == "success") {
                window.location.href = urlPath.eliminationRoom(response.data.sharecode);
            }
            else {
                ajaxErrorHandler(response, $form)
                submitEliminationStatusToast("error");
            }
        })
        .fail(function () {
            console.error("Request failure: share list.");
            submitEliminationStatusToast("fail");
        })
}

function submitEliminationStatusToast(status) {
    const statusMessages = {
        "invalid-sharecode" : `<strong class="orange-text text-darken-3">Invalid sharecode.</strong>`,
        "error" : `<strong class="orange-text text-darken-3">Failed</strong> to share list.`,
        "fail" : `<strong class="orange-text text-darken-3">Request failure.</strong>.`,
        "unknown" : `<strong class="orange-text text-darken-3">Unknown error.</strong>.`
    }
    
    const message = statusMessages[status] || statusMessages["unknown"]
    
    M.toast({html: `<span>${message}</span>`})
}

const init = () => {
    applyTooltips()

    // POSTs name, movie list, and sharecode(if any)
    $submitBtn.click(function (e) {
        e.preventDefault();
        submitEliminationList();
    })
}

export { init }