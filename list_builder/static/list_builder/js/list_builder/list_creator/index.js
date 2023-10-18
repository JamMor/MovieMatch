import * as ListEliminationSubmit from "./share_modal.js"
import { disabledSave } from "/static/js/shared/save_list.js";

//List Creator Entry Point
$(document).ready(function() {
    ListEliminationSubmit.init();
    disabledSave();
});