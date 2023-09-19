import { SharedMovieList } from "/static/js/listOperations.js";
import { UserList } from "./userListOperations.js";

const $movieListDom = $("#movie_list");
const movieListInit = [];

const $userListDom = $("#user_list");
const userListInit = {};

const movieList = new SharedMovieList($movieListDom, movieListInit);
const userList = new UserList($userListDom, user_uuid, userListInit);

export { movieList, userList };