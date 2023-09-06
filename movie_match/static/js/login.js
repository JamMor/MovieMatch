import { formErrorHandler } from "/static/js/form_functions.js";

function loginHandler(){
   
    let formAction = $(this).attr('action')
    let formData = $(this).serialize()

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
                $(".login-form span.error").remove();
                formErrorHandler(".login-form", response.form_errors)
                $('#nav-bar .dropdown-trigger').dropdown('recalculateDimensions');
            }
        })
        .fail(function () {
            //FLAG error toast
            console.log("Failed to send login.");
        })
}


const init = () => {
    //Login Submission AJAX
    $(".login-form").on("submit", function (event) {
        event.preventDefault()
        loginHandler.call(this)
    })
    
    //Allows user to tab through dropdown form fields without dropdown closing
    $('nav .login-form').on('keydown', function(event) {
        event.stopPropagation();
    });
}

export {init}