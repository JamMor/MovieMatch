import * as ListEditor from "../list_editor.js"
import * as EditorSave from "../editor_save.js"

//List Editor Entry Point
$(document).ready(function() {
    ListEditor.init();
    EditorSave.init();
});