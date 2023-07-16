//Imports
import * as ClickHandlers from "./click-handlers.js";
import * as CopyToClipBoard from "./sharecode_copy.js";

//Elimination Room Entry Point
$(document).ready(function() {
    ClickHandlers.init();
    CopyToClipBoard.init();
});