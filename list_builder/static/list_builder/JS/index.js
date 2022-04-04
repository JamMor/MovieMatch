$(document).ready(function() {

    // Materialize FAB button initialize
    $('.fixed-action-btn').floatingActionButton({
        toolbarEnabled: true
    });
    
    // Materialize Modal initialize
    $('.modal').modal();

    const api_key = "f4f5f258379baf10796e1d3aeb5add05";
    
    var movie_list = [];
    let search_results = [];

    //Prevent normal form behavior for search
    $('.ajax-form').submit(function(e){
        e.preventDefault();
    })

    //Delay wrapper function (to limit ajax queries when typing)
    function delay(fn, ms) {
        let timer = 0
        return function (...args) {
            clearTimeout(timer)
            timer = setTimeout(fn.bind(this, ...args), ms || 0)
        }
    }

    //Custom autocomplete jquery ajax to materialize carousel feature
    $('#moviesearch-input').on("input", delay(function () {
        var searchQuery = this.value;
        if (searchQuery.length >= 2) {
            console.log(searchQuery)
            $.get(`https://api.themoviedb.org/3/search/movie?api_key=${api_key}&query=${searchQuery}`,
                function () {
                    console.log("AJAX sent to TMDB");
                    return
                }, "json")
                .done(function (data) {
                    console.log(data);
                    search_results = data.results;
                    $("div.carousel").height("400px").html(search_results
                        .map(movie => MovieCard("query", movie, ["add", "info"]))
                        .join('')
                    );
                    $('.carousel').carousel({
                        dist: -50,
                        noWrap: true,
                        numVisible: 10
                        });
                })
        }
        else if (searchQuery.length == 0) {
            $("div.carousel").html("").height("0px")
        }
    }, 1000));

    //Handler to add movie to list and dom
    $('.carousel').on("click", "a.add-btn", function () {
        //Get movie ID from parent Card ID
        let thisId = $(this).closest('div.card').attr('id')
            .split("_")[1];
        console.log(`Adding movie id ${thisId}`);
        let thisMovie;
        //If movie not already in list, get info from search results and push to list
        if(!movie_list.some(movie => movie.id == thisId)){
            for(let i=0; i<search_results.length; i++){
                if(search_results[i].id == thisId){
                    thisMovie = search_results[i];
                    break
                }
            }
            console.log(thisMovie.title)
            movie_list.push(thisMovie);

            //Add movie to DOM
            $("#movie_list").append(MovieCard("movie", thisMovie, ["remove", "info"]));
        }
        else{
            console.log("Already added.")
        }
    })
    
    //Handler to remove movie from list and dom
    $('#movie_list').on("click", "a.remove-btn", function () {
        //Get movie ID from parent Card ID
        let thisId = $(this).closest('div.card').attr('id')
            .split("_")[1];
        console.log(`Removing movie id ${thisId}`);

        let movieIndex = movie_list.findIndex(movie => movie.id == thisId);
        if (movieIndex == -1){
            console.log("Movie not found in list.")
        }
        else{
            $(`#movie_${thisId}`).remove();
            let removedMovie = movie_list.splice(movieIndex, 1)[0];
            console.log(`Removed ${removedMovie.title}.`);
        }
    })

    // Clear search results
    $("#search-close").click(function() {
        $("#moviesearch-input").val('');
        $("div.carousel").html("").height("0px");
    });

    // POSTs name, movie list, and sharecode(if any)
    $("#share-btn").click(function (){
        let sharecode = $("#sharecode").val();
        let nickname = $("#nickname").val();
        console.log("Submitting!")
        //=================TESTING===================
        const JSONSizeData = (encodedString) => {
            const size = new TextEncoder()
                .encode(encodedString)
                .length;
            const kiloBytes = size / 1024;
            const megaBytes = kiloBytes / 1024;
            console.log(`POST data is ${megaBytes} MBs or (${kiloBytes} kBs)`);
            return encodedString
        }
        //===========================================

        // console.log("DATA for Django: ", {"sharecode": sharecode, "nickname": nickname, "movie_list": movie_list});
        $.post("match/", JSONSizeData(JSON.stringify({"sharecode": sharecode, "nickname": nickname, "movie_list": movie_list})),"json")
            .done(function(data) {
                console.log( "Movie list successfully sent!" );
                if(data['status'] == "success")
                {window.location.href = `/match/${data.sharecode}`;}
                else
                {console.log(data['status'])}

                })
            .fail(function() {
                console.log( "Failed to send movie list." );
                })
    })

    // Button to clear current user list
    $("#clear").click(function (){
        movie_list = [];
        $('#movie_list').html("");
    })
})