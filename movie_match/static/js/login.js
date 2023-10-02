import { formErrorHandler } from "/static/js/form_functions.js";

const loginFormClass = "login-form";

const $allLoginForms = $(".login-form");
const $navLoginForm = $("#nav-login-form");
const $sideLoginForm = $("#side-login-form");
const $navLoginDropdown = $('#nav-bar .dropdown-trigger');

function loginHandler(){
   
    const formAction = $(this).attr('action')
    const formData = $(this).serialize()

    $.post(formAction, formData, "json")
        .done(function (response) {
            console.log(response)
            if (response.status == "success") {
                console.log("Login succesful!");
                location.reload();
            }
            else {
                console.log("Login failure!");
                console.log(response.form_errors);
                console.log(response.errors);
                //Reset any errors.
                $allLoginForms.find("span.error").remove();
                formErrorHandler(`.${loginFormClass}`, response.form_errors)
                $navLoginDropdown.dropdown('recalculateDimensions');
            }
        })
        .fail(function () {
            //FLAG error toast
            console.log("Failed to send login.");
        })
}


const init = () => {
    //Login Submission AJAX
    $allLoginForms.on("submit", function (event) {
        event.preventDefault()
        loginHandler.call(this)
    })
    
    //Allows user to tab through dropdown form fields without dropdown closing
    $navLoginForm.on('keydown', function(event) {
        event.stopPropagation();
    });
}

export {init}