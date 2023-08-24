import { Movie } from "/static/js/constructors.js";
import { MovieCard } from "/static/js/DOMelements.js";

const api_key = "f4f5f258379baf10796e1d3aeb5add05";
const search_prefix ="query";


function activateSearch(){
    $("div.carousel").fadeIn(100);
    $("#movie_list").fadeTo(500, 0.1)
}
function deactivateSearch(){
    $("div.carousel").fadeOut(100);
    $("#movie_list").fadeTo(500, 1);
}

//Delay wrapper function (to limit ajax queries when typing)
function delay(fn, ms) {
    let timer = 0
    return function (...args) {
        clearTimeout(timer)
        timer = setTimeout(fn.bind(this, ...args), ms || 0)
    }
}

//FLAG Simplify and modularize
function searchMovies() {
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
                if (data.results.length == 0) {
                    $("div.carousel")
                        /* Gets the initial rendered height from DOM (scrollHeight) 
                            and animates. Callback sets height to auto. */
                        .animate({ height: $('div.carousel').get(0).scrollHeight }, 200, function () {
                            $(this).height('auto');
                        })
                        .html('<h6 class="center-align grey-text text-lighten-2">No results</h6>')
                    return
                }
                $("div.carousel")
                    .animate({ height: "400px" }, 200)
                    .promise().done(function () {
                        $(this)
                            .html(data.results.map(({ id: tmdb_id, ...rest }) => {
                                //Renames the movie DB ID to tmdb_id for Movie object creation
                                let movieObj = new Movie({ tmdb_id, ...rest });
                                search_results.push(movieObj);
                                return MovieCard(search_prefix, tmdb_id, movieObj, ["add", "info"], "carousel-item")
                            }).join('')
                            )
                            .carousel({
                                dist: -50,
                                numVisible: 10,
                                noWrap: true
                            })
                    })
            })
    }
    else if (searchQuery.length == 0) {
        $("div.carousel").animate({ height: "0px" }, 150).html("")
    }
}

function clearSearchResults(){
    $("#moviesearch-input").val('');
    $("div.carousel").animate({height: "0px"}, 150).html("");
}

// Attach handlers to DOM elements
const init = () => {

    //Prevent normal form behavior for search
    $('.ajax-form').submit(function(e){
        e.preventDefault();
    })

    //Dim movie list when searching
    $("#moviesearch-input").focus(activateSearch)
    $(document).click(function(event){
        let clickedTarget = $(event.target);
        // If user clicks outside of search container
        if (!clickedTarget.closest("#search-container").length){
            deactivateSearch();
        }
    })

    //Custom autocomplete jquery ajax to materialize carousel feature
    $('#moviesearch-input').on("input", delay(function () {
        searchMovies.call(this);
    }, 1000));

    
    // Clear search results
    $("#search-close").click(function() {
        clearSearchResults();
    });

}

export { init }