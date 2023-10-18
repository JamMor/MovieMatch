import * as ListBuilder from "./list_builder.js";
import * as SearchBar from "./search_bar.js";
import * as AddFromList from "./add_from_list_btn.js";
import * as Sort from "./sort.js";
import * as ClearList from "./clear_list_btn.js";
import * as MaterializeComponents from "./materialize-components.js";
import { movieList } from "./movie_lists.js";
import { saveInit } from "/static/js/shared/save_list.js";

$(document).ready(function(){
    saveInit(movieList);
    ListBuilder.init();
    SearchBar.init();
    AddFromList.init();
    Sort.init();
    ClearList.init();
    MaterializeComponents.init();
});