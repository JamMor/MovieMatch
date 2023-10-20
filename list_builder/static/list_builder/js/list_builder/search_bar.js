import { movieList, searchResults } from "./movie_lists.js";

const $searchResultsDiv = searchResults.$listDomContainer;
const $movieListDiv = movieList.$listDomContainer;

const $searchContainer = $("#search-container");
const $searchForm = $("#search-form");
const $searchInput = $("#search-input");
const $clearSearch = $("#search-close");
const $listActionBtn = $("#list-actions-btn");

const searchDelayTime = 1000;
const minSearchQueryLength = 2;

function activateSearch(){
    $searchResultsDiv.fadeIn(100);
    $movieListDiv.fadeTo(500, 0.1)
}
function deactivateSearch(){
    $searchResultsDiv.fadeOut(100);
    $movieListDiv.fadeTo(500, 1);
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

function updateSearchResultsDOM(data){
    console.log(data);
    //If no search results
    if (data.results.length == 0) {
        searchResults.clearList();
        $searchResultsDiv
            /* Gets the initial rendered height from DOM (scrollHeight) 
                and animates. Callback sets height to auto. */
            .animate({ height: $searchResultsDiv.get(0).scrollHeight }, 200, function () {
                $(this).height('auto');
            })
            .html('<h6 class="center-align grey-text text-lighten-2">No results</h6>')
        return
    }
    
    
    $searchResultsDiv
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
                    const alreadyAddedIds = existingMovieCheck(movieList, searchResults);
                    searchResults.disableAddBtns(...alreadyAddedIds);
                });
    })
}

function searchMovies(searchQuery) {
    if (searchQuery.length >= minSearchQueryLength) {
        console.log(searchQuery)
        $.get({
            url: resourcePath.movieSearchUrl(searchQuery),
            dataType: "json"
        })
            .done(updateSearchResultsDOM)
            .fail(function (response) {
                console.error("Request failure: search movies");
                console.error(response);
            });
    }
    else if (searchQuery.length == 0) {
        searchResults.clearList();
        $searchResultsDiv.animate({ height: "0px" }, 150);
    }
}

function clearSearchResults(){
    $searchInput.val('');
    searchResults.clearList();
    $searchResultsDiv.animate({height: "0px"}, 150);
}

// Attach handlers to DOM elements
const init = () => {
    $searchForm.submit(function(e){
        e.preventDefault();
    })

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
            $movieListDiv.fadeTo(500, 1);
        }
        else {
            $movieListDiv.fadeTo(500, 0.1)
            $searchResultsDiv.fadeOut(100);
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

export { init }