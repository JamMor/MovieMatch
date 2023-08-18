//Imports
import * as SendCommands from "./send-commands.js";
import * as MaterializeComponents from "./materialize-inits.js";
import {createMatchSocket} from "./sockets.js";
import * as CopyToClipBoard from "./sharecode_copy.js";

//Elimination Room Entry Point
$(document).ready(function() {
    let matchSocket = createMatchSocket();
    MaterializeComponents.init();
    SendCommands.init(matchSocket);
    CopyToClipBoard.init();
});