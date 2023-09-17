//Imports
import * as SendCommands from "./send-commands.js";
import * as MaterializeComponents from "./materialize-inits.js";
import {createMatchSocket} from "./sockets.js";
import * as CopyToClipBoard from "./sharecode_copy.js";
import { movieList } from "./movie_lists.js";
import { newSave, disabledSave, init2 as saveInit } from "/static/js/save_list.js";
import * as UserSlider from "/static/js/slider.js"

//Elimination Room Entry Point
$(document).ready(function() {
    let matchSocket = createMatchSocket();
    MaterializeComponents.init();
    SendCommands.init(matchSocket);
    CopyToClipBoard.init();
    saveInit(movieList);
    // newSave();
    disabledSave();
    UserSlider.init();
});