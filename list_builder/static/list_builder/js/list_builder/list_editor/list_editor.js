import { movieList } from "../movie_lists.js";

const importedList = JSON.parse(
    document.getElementById('imported-movie-data').textContent);

const init = () => {
    movieList.bulkAddMoviesToList(...importedList);
}

export {init}