import { movieList } from "../movie_lists.js";
import { ajaxErrorHandler } from "/static/js/shared/ajaxErrorHandler.js";

const $nicknameInput = $("#nickname");
const $sharecodeInput = $("#sharecode");
const $submitBtn = $("#share-btn");

function validateSharecode(sharecode) {
    if (!/^$|^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(sharecode)) {
        console.log("Invalid Sharecode format.")
        return false
    }
    return true
}

function submitEliminationList() {
    const sharecode = $sharecodeInput.val().toUpperCase();
    const nickname = $nicknameInput.val();

    if (!validateSharecode(sharecode)) {
        submitEliminationStatusToast("invalid-sharecode");
        return
    }


    const tmdb_ids = movieList.getIds();
    
    $.post(urlPath.shareSubmit, JSON.stringify(
        {
            "sharecode": sharecode,
            "nickname": nickname,
            "tmdb_ids": tmdb_ids
        }
    ), "json")
        .done(function (response) {
            if (response.status == "success") {
                window.location.href = urlPath.eliminationRoom(response.data.sharecode);
            }
            else {
                ajaxErrorHandler(response);
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
    // POSTs name, movie list, and sharecode(if any)
    $submitBtn.click(function (e) {
        e.preventDefault();
        submitEliminationList();
    })
}

export { init }