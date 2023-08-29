import * as ListEliminationSubmit from "./share_modal.js"
import { newSave } from "/static/js/save_list.js";

//List Creator Entry Point
$(document).ready(function() {
    ListEliminationSubmit.init();
    newSave();
});