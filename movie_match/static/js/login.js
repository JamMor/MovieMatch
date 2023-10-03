import { resetFormErrors } from "/static/js/form_functions.js";
import { ajaxErrorHandler } from "/static/js/ajaxErrorHandler.js";

const $allLoginForms = $(".login-form");
const $navLoginForm = $("#nav-login-form");
const $sideLoginForm = $("#side-login-form");
const $navLoginDropdown = $('#nav-bar .dropdown-trigger');

function loginHandler(){
    resetFormErrors($allLoginForms);
    const loginForm = this;
    const loginFormData = new FormData(loginForm);

    $.ajax({
        url: loginForm.action,
        method:loginForm.method,
        data: loginFormData,
        // processData and contentType needed to properly send formData
        // jQuery tries to make it a string
        processData: false,
        contentType: false
    })
        .done(function (response) {
            console.log(response)
            if (response.status == "success") {
                console.log("Login succesful!");
                location.reload();
            }
            else {
                console.log("Login failure!");
                ajaxErrorHandler(response, $allLoginForms)
                $navLoginDropdown.dropdown('recalculateDimensions');
                loginStatusToast("error");
            }
        })
        .fail(function () {
            console.error("Request failure: login.");
            loginStatusToast("fail");
        })
}

function loginStatusToast(status) {
    const statusMessages = {
        "error" : `<strong class="orange-text text-darken-3">Failed</strong> to login.`,
        "fail" : `<strong class="orange-text text-darken-3">Request failure.</strong>.`,
        "unknown" : `<strong class="orange-text text-darken-3">Unknown error.</strong>.`
    }
    
    const message = statusMessages[status] || statusMessages["unknown"]
    
    M.toast({html: `<span>${message}</span>`})
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