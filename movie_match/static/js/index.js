import * as csrfSetToken from "./csrf-token.js"
import * as LoginComponent from "./login.js"
import * as MaterializeComponents from "./materialize-components.js"
import { preventDefaultFormClassInit } from "./form_functions.js";

//Entry point for base site
$(document).ready(function() {
    csrfSetToken.init();
    LoginComponent.init();
    MaterializeComponents.init();
    preventDefaultFormClassInit();
});