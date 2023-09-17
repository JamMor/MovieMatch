import * as ListBuilder from "./list_builder.js";
import * as SearchBar from "./search_bar.js";
import * as MaterializeComponents from "./materialize-components.js";
import { movieList, searchResults } from "./movie_lists.js";
import { init2 as saveInit } from "/static/js/save_list.js";

$(document).ready(function(){
    saveInit(movieList);
    ListBuilder.init();
    SearchBar.init();
    MaterializeComponents.init();
});