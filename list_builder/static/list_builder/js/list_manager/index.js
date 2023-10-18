import * as DeleteListHandler from "./delete_modal.js"
import * as SliderX from "/static/js/shared/slider.js"
import * as TableCollapse from "./table-collapse.js"

//List Manager Entry Point
$(document).ready(function() {
    SliderX.init();
    TableCollapse.init();
    DeleteListHandler.init();
});