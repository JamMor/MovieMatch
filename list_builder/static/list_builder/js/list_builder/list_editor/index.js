import * as ListEditor from "./list_editor.js"
import { editorSave } from "/static/js/save_list.js";

//List Editor Entry Point
$(document).ready(function() {
    ListEditor.init();
    // editorSave();
});