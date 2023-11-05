import { movieList } from "../movie_lists.js";
import { ajaxErrorHandler } from "/static/js/shared/ajaxErrorHandler.js";
import {applyTooltips, resetFormErrors} from "/static/js/shared/form_functions.js";
import { validateSharecode, validateUserInput } from "/static/js/shared/regexValidators.js";

const shareForm = document.querySelector("#share-list-form");
const $form = $(shareForm);
const $submitBtn = $("#share-btn");
const sharecodeKey = "share-sharecode";
const shareNicknameKey = "share-nickname";


function submitEliminationList() {
    resetFormErrors($form)
    const shareFormData = new FormData(shareForm);
    const sharecode = shareFormData.get("share-sharecode");
    const nickname = shareFormData.get("share-nickname");

    const sharecodeValidation = validateSharecode(sharecode);
    const nicknameValidation = validateUserInput(nickname);
    if (!sharecodeValidation.isValid || !nicknameValidation.isValid) {
        if (!nicknameValidation.isValid) {
            submitEliminationStatusToast("invalid-nickname");
            ajaxErrorHandler({ form_errors: { [shareNicknameKey]: [nicknameValidation.errorMsg] } }, $form)
        }
        if (!sharecodeValidation.isValid) {
            submitEliminationStatusToast("invalid-sharecode");
            ajaxErrorHandler({ form_errors: { [sharecodeKey]: [sharecodeValidation.errorMsg] } }, $form)
        }
        submitEliminationStatusToast("error");
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
        "invalid-nickname" : `<strong class="orange-text text-darken-3">Invalid nickname.</strong>`,
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