$(document).ready(function () {
    // POSTs name, movie list, and sharecode(if any)
    $("#share-btn").click(function () {
        let sharecode = $("#sharecode").val().toUpperCase();
        if (!/^$|^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(sharecode)) {
            console.log("Invalid Sharecode format.")
            return
        }

        let nickname = $("#nickname").val();
        console.log("Submitting!")

        let tmdb_ids = movie_list.map(movie => movie.tmdb_id)
        // console.log("DATA for Django: ", {"sharecode": sharecode, "nickname": nickname, "movie_list": movie_list});
        $.post("match/", JSON.stringify(
            {
                "sharecode": sharecode,
                "nickname": nickname,
                "tmdb_ids": tmdb_ids
            }
        ), "json")
        .done(function (data) {
            console.log(data);

            if (data['status'] == "success") {
                window.location.href = `/match/${data.sharecode}`;
            }
            else {
                console.log(data['status'])
            }
        })
        .fail(function () {
            console.log("ERROR: Failed to send movie list.");
        })
})
})