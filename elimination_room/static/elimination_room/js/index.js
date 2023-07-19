//Imports
import * as ClickHandlers from "./click-handlers.js";
import * as MaterializeComponents from "./materialize-inits.js";
import {createMatchSocket} from "./sockets.js";
import * as CopyToClipBoard from "./sharecode_copy.js";

//Elimination Room Entry Point
$(document).ready(function() {
    createMatchSocket();
    MaterializeComponents.init();
    ClickHandlers.init();
    CopyToClipBoard.init();
});