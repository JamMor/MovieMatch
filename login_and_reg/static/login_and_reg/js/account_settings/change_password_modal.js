import {applyTooltips, formErrorHandler} from "/static/js/form_functions.js";

const formId = "change-password-form";
const $modal = $("#change-password-modal");
const $modalOpenBtn = $("#change-password-btn");
const $form = $("#change-password-form");
const $submitBtn = $("#change-password-confirm");

function openChangePasswordModal(){
    $modal.modal();
    $modal.modal('open');
}

function sendChangePasswordRequest(){
    //FLAG Reset old form errors
    $form.find("span.error").remove();
    console.log("Change password request sent.")
    let changePasswordForm = document.querySelector(`#${formId}`);
    const changePasswordFormData = new FormData(changePasswordForm);
    $.ajax({
        url: `settings/change-password`,
        method:"POST",
        data: changePasswordFormData,
        // processData and contentType needed to properly send formData
        // jQuery tries to make it a string
        processData: false,
        contentType: false
    })
    .done(function(response) {
        console.log(response);
        if(response.status == "success"){
            $modal.modal('close');
            changePasswordForm.reset();
            console.log("Password Change Success.")
            M.toast({html: `<span><strong class="cyan-text text-accent-2">Successfully</strong> changed password!</span>`})
            // window.location.replace(`/`); //Redirects to home page
        }
        else {
            console.log("Failed to change password.")
            console.log(response.errors)
            console.log(response.form_errors)
            formErrorHandler(`#${formId}`, response.form_errors)
            changePasswordForm.reset();
            M.toast({html: `<span><strong class="orange-text text-darken-3">Failed</strong> to change password.</span>`})
        }

    })
    .fail(function() {
        console.log( "Failed to send change password request.");
        M.toast({html: `<span><strong class="orange-text text-darken-3">Failed</strong> to send change password request.</span>`})
    })
}


const init = () => {
    applyTooltips()

    //Initializes then calls change password modal
    $modalOpenBtn.on("click", function(){
        openChangePasswordModal();
    })

    //Sends change password request to server.
    $submitBtn.on("click", function(e){
        e.preventDefault();
        sendChangePasswordRequest();
    })

}

export {init}