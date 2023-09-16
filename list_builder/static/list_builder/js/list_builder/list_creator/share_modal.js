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
    let sharecode = $sharecodeInput.val().toUpperCase();
    let nickname = $nicknameInput.val();

    if (!validateSharecode(sharecode)) {
        //FLAG Toast error
        return
    }


    let tmdb_ids = movie_list.map(movie => movie.tmdb_id)
    
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