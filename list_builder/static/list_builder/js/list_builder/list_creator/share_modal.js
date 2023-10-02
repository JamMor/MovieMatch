import { movieList } from "../movie_lists.js";

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
        //FLAG Toast error
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
            console.log(response);

            if (response.status == "success") {
                window.location.href = urlPath.eliminationRoom(response.data.sharecode);
            }
            else {
                console.log(response.status)
            }
        })
        .fail(function () {
            console.log("ERROR: Failed to send movie list.");
        })
}

const init = () => {
    // POSTs name, movie list, and sharecode(if any)
    $submitBtn.click(function () {
        submitEliminationList();
    })
}

export { init }