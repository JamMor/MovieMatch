import * as LoadList from "./load-list-data.js";
import * as ChangeListName from "./change-list-name.js";

//List Editor Entry Point
$(document).ready(function () {
    LoadList.init();
    ChangeListName.init();
});