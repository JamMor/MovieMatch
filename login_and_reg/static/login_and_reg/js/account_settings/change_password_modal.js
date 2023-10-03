import {applyTooltips, resetFormErrors} from "/static/js/form_functions.js";
import { ajaxErrorHandler } from "/static/js/ajaxErrorHandler.js";

const formId = "";
const changePasswordForm = document.querySelector("#change-password-form");
const $modal = $("#change-password-modal");
const $modalOpenBtn = $("#change-password-btn");
const $form = $(changePasswordForm);
const $submitBtn = $("#change-password-confirm");

function openChangePasswordModal(){
    $modal.modal();
    $modal.modal('open');
}

function sendChangePasswordRequest(){
    resetFormErrors($form);
    const changePasswordFormData = new FormData(changePasswordForm);
    $.ajax({
        url: changePasswordForm.action,
        method:changePasswordForm.method,
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
            ajaxErrorHandler(response, $form)
            changePasswordForm.reset();
            M.toast({html: `<span><strong class="orange-text text-darken-3">Failed</strong> to change password.</span>`})
        }

    })
    .fail(function() {
        console.error( "Failed to send change password request.");
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