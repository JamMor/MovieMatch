import { movieList } from "./movie_lists.js";

const $clearMovieList = $("#clear-movie-list");

const init = () => {
    $clearMovieList.tooltip({
        position: "left",
        html: `<span>Clear list</span>`
    });

    $clearMovieList.click(function () {
        movieList.clearList();
    })
}

export { init }