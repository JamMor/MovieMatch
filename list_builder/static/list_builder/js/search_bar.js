import { Movie } from "/static/js/constructors.js";
import { MovieCard } from "/static/js/DOMelements.js";

const api_key = "f4f5f258379baf10796e1d3aeb5add05";

const search_prefix ="query";
const disabledBtnClass = "disabled-btn";
const addBtnClass = "add-btn";

const $searchContainer = $("#search-container");
const $searchInput = $("#moviesearch-input");
const $searchResults = $("#search-results");
const $clearSearch = $("#search-close");
const $movieList = $("#movie_list");
const $searchCardFromTmdbId = (tmdb_id) => $(`#${search_prefix}_${tmdb_id}`);

const searchDelayTime = 1000;
const minSearchQueryLength = 2;

function activateSearch(){
    $searchResults.fadeIn(100);
    $movieList.fadeTo(500, 0.1)
}
function deactivateSearch(){
    $searchResults.fadeOut(100);
    $movieList.fadeTo(500, 1);
}

//Delay wrapper function (to limit ajax queries when typing)
function delay(fn, ms) {
    let timer = 0
    return function (...args) {
        clearTimeout(timer)
        timer = setTimeout(fn.bind(this, ...args), ms || 0)
    }
}

function existingMovieCheck(list1, list2){
    let id_list1 = list1.map(movie => movie.tmdb_id);
    let id_list2 = list2.map(movie => movie.tmdb_id);
    return id_list1.filter(x => id_list2.includes(x));
}

function disableSearchAddButtons(...tmdb_ids){
    tmdb_ids.forEach(tmdb_id => {
        $searchCardFromTmdbId(tmdb_id).find(`.${addBtnClass}`)
            .addClass(disabledBtnClass);
    })
}
function enableSearchAddButtons(...tmdb_ids){
    tmdb_ids.forEach(tmdb_id => {
        $searchCardFromTmdbId(tmdb_id).find(`.${addBtnClass}`)
            .removeClass(disabledBtnClass);
    })
}

function updateSearchResultsDOM(data){
    console.log(data);
    //If no search results
    if (data.results.length == 0) {
        $searchResults
            /* Gets the initial rendered height from DOM (scrollHeight) 
                and animates. Callback sets height to auto. */
            .animate({ height: $searchResults.get(0).scrollHeight }, 200, function () {
                $(this).height('auto');
            })
            .html('<h6 class="center-align grey-text text-lighten-2">No results</h6>')
        return
    }

    $searchResults
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
                .promise().done(function () {
                    disableSearchAddButtons(...existingMovieCheck(movie_list, search_results));
                });
        })
}

function searchMovies(searchQuery) {
    if (searchQuery.length >= minSearchQueryLength) {
        console.log(searchQuery)
        $.get(`https://api.themoviedb.org/3/search/movie?api_key=${api_key}&query=${searchQuery}`, "json")
            .done(updateSearchResultsDOM)
            .fail(function () {
                console.log("AJAX error");
            });
    }
    else if (searchQuery.length == 0) {
        $searchResults.animate({ height: "0px" }, 150).html("")
    }
}

function clearSearchResults(){
    $searchInput.val('');
    $searchResults.animate({height: "0px"}, 150).html("");
}

// Attach handlers to DOM elements
const init = () => {

    //Prevent normal form behavior for search
    $('.ajax-form').submit(function(e){
        e.preventDefault();
    })

    //Dim movie list when searching
    $searchInput.focus(activateSearch)

    //Deactivate search when clicking outide of the area
    $(document).click(function(event){
        let clickedTarget = $(event.target);
        // If user clicks outside of search container
        if (!clickedTarget.closest($searchContainer).length){
            deactivateSearch();
        }
    })

    //Custom autocomplete jquery ajax to materialize carousel feature
    $searchInput.on("input", delay(function () {
        const searchQuery = this.value;
        searchMovies(searchQuery);
    }, searchDelayTime));

    
    // Clear search results
    $clearSearch.click(function() {
        clearSearchResults();
    });

}

export { init, disableSearchAddButtons, enableSearchAddButtons }