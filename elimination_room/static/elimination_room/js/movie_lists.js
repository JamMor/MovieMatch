import { SharedMovieList } from "/static/js/listOperations.js";

const $movieListDom = $("#movie_list");
const movieListInit = [];

const movieList = new SharedMovieList($movieListDom, movieListInit);

export { movieList };