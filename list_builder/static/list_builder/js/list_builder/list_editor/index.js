import * as ListEditor from "./list_editor.js";
import * as ChangeListName from "./change-list-name.js";

//List Editor Entry Point
$(document).ready(function () {
    ListEditor.init();
    ChangeListName.init();
});