//Imports
import * as SendCommands from "./send-commands.js";
import * as MaterializeComponents from "./materialize-inits.js";
import { createMatchSocket } from "./sockets.js";
import * as CopyToClipBoard from "./sharecode_copy.js";
import { movieList } from "./movie_lists.js";
import { disabledSave, saveInit } from "/static/js/shared/save_list.js";
import * as UserSlider from "/static/js/shared/slider.js"

//Elimination Room Entry Point
$(document).ready(function () {
    const matchSocket = createMatchSocket();
    MaterializeComponents.init();
    SendCommands.init(matchSocket);
    CopyToClipBoard.init();
    saveInit(movieList);
    disabledSave();
    UserSlider.init();
});