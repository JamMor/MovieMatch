import { formErrorHandler } from "./form_functions.js";

function ajaxErrorHandler(response, $form = null) {
    if (response.hasOwnProperty("form_errors")) {

        formErrorHandler($form, response.form_errors);
    }
    if (response.hasOwnProperty("errors")) {
        response.errors.forEach(error => {
            console.error(error);
        });
    }
}

export { ajaxErrorHandler }