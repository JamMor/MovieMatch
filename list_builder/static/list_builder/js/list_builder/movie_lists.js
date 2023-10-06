import { MovieList, SearchResultsList } from "/static/js/shared/listOperations.js";

const $movieListDom = $("#movie_list");
const movieListInit = [];

const $searchResultsDom = $("#search-results");
const searchResultsInit = [];

const movieList = new MovieList($movieListDom, movieListInit);
const searchResults = new SearchResultsList($searchResultsDom, searchResultsInit);

export { movieList, searchResults };