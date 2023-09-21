import { movieList, searchResults } from "./movie_lists.js";

const disabledBtnClass = "disabled-btn";
const addBtnClass = "add-btn";

const $searchContainer = $("#search-container");
const $searchInput = $("#moviesearch-input");
const $searchResults = $("#search-results");
const $clearSearch = $("#search-close");
const $listActionBtn = $("#list-actions-btn");
const $movieList = $("#movie_list");
const $addFromList = $("#add-from-list");
const $clearMovieList = $("#clear-movie-list");

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
    const idList1 = list1.getIds();
    const idList2 = list2.getIds();
    return idList1.filter(x => idList2.includes(x));
}

function disableSearchAddButtons(...tmdb_ids){
    tmdb_ids.forEach(tmdb_id => {
        $searchCard = $(`#${searchResults.domIdFromTmdbId(tmdb_id)}`)
        $searchCard.find(`.${addBtnClass}`)
            .addClass(disabledBtnClass);
    })
}
function enableSearchAddButtons(...tmdb_ids){
    tmdb_ids.forEach(tmdb_id => {
        $searchCard = $(`#${searchResults.domIdFromTmdbId(tmdb_id)}`)
        $searchCard.find(`.${addBtnClass}`)
            .removeClass(disabledBtnClass);
    })
}

function updateSearchResultsDOM(data){
    console.log(data);
    //If no search results
    if (data.results.length == 0) {
        searchResults.clearList();
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
        searchResults.clearList();
        const renamedResults = data.results.map(({ id, ...rest }) => ({tmdb_id: id, ...rest}));
        searchResults.bulkAddMoviesToList(...renamedResults);

        $(this)
            .carousel({
                dist: -50,
                numVisible: 10,
                noWrap: true
            })
            .promise().done(function () {
            disableSearchAddButtons(...existingMovieCheck(movieList, searchResults));
        });
    })
}

function searchMovies(searchQuery) {
    if (searchQuery.length >= minSearchQueryLength) {
        console.log(searchQuery)
        $.get(resourcePath.movieSearchUrl(searchQuery), "json")
            .done(updateSearchResultsDOM)
            .fail(function () {
                console.log("AJAX error");
            });
    }
    else if (searchQuery.length == 0) {
        searchResults.clearList();
        $searchResults.animate({ height: "0px" }, 150);
    }
}

function clearSearchResults(){
    $searchInput.val('');
    searchResults.clearList();
    $searchResults.animate({height: "0px"}, 150);
}

function addFromListHandler(){
    $.get("/get/8")
        .done(function(response) {
            console.log(response);
            if (response.status == "success"){
                console.log("success")
                console.log(response.data)
            }
            else {
                console.log(response.status)
                console.log(response.errors)
            }
        })
        .fail(function() {
            console.log("Server error");
        });
}

// Attach handlers to DOM elements
const init = () => {

    //Dim movie list when searching
    $searchInput.focus(activateSearch)

    //Deactivate open containers when clicking outside of them
    $(document).click(function(event){
        let clickedTarget = $(event.target);
        // Deactivate search if user clicks outside of search container
        if (!clickedTarget.closest($searchContainer).length){
            deactivateSearch();
        }
        // Deactivate list action button if user clicks outside of it
        if (!clickedTarget.closest($listActionBtn).length){
            $listActionBtn.floatingActionButton("close");
        }
    })

    $listActionBtn.click(function(){
        //if element has active class
        if ($(this).hasClass("active")){
            $movieList.fadeTo(500, 1);
        }
        else {
            $movieList.fadeTo(500, 0.1)
            $searchResults.fadeOut(100);
        }
    })

    $addFromList.tooltip({
        position: "left",
        html: `<span>Add from saved list...</span>`
    });
    $clearMovieList.tooltip({
        position: "left",
        html: `<span>Clear list</span>`
    });

    $addFromList.click(function(){
        addFromListHandler();
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