import { applyTooltips, resetFormErrors } from "/static/js/shared/form_functions.js";
import { ajaxErrorHandler } from "/static/js/shared/ajaxErrorHandler.js";

const changePasswordForm = document.querySelector("#change-password-form");
const $modal = $("#change-password-modal");
const $modalOpenBtn = $("#change-password-btn");
const $form = $(changePasswordForm);
const $submitBtn = $("#change-password-confirm");

function openChangePasswordModal() {
    $modal.modal();
    $modal.modal('open');
}

function sendChangePasswordRequest() {
    resetFormErrors($form);
    const changePasswordFormData = new FormData(changePasswordForm);
    $.ajax({
        url: changePasswordForm.action,
        method: changePasswordForm.method,
        data: changePasswordFormData,
        // processData and contentType needed to properly send formData
        // jQuery tries to make it a string
        processData: false,
        contentType: false,
        dataType: "json",
    })
        .done(function (response) {
            console.log(response);
            if (response.status == "success") {
                $modal.modal('close');
                changePasswordForm.reset();
                console.log("Password Change Success.")
                changePasswordStatusToast("success");
                // window.location.replace(`/`); //Redirects to home page
            }
            else {
                console.log("Failed to change password.")
                ajaxErrorHandler(response, $form)
                changePasswordForm.reset();
                changePasswordStatusToast("error");
            }
        })
        .fail(function () {
            console.error("Request failure: change password.");
            changePasswordStatusToast("fail");
        })
}

function changePasswordStatusToast(status) {
    const statusMessages = {
        "success": `<strong class="cyan-text text-accent-2">Successfully</strong> changed password!`,
        "error": `<strong class="orange-text text-darken-3">Failed</strong> to change password.`,
        "fail": `<strong class="orange-text text-darken-3">Request failure.</strong>.`,
        "unknown": `<strong class="orange-text text-darken-3">Unknown error.</strong>.`
    }

    const message = statusMessages[status] || statusMessages["unknown"]

    M.toast({ html: `<span>${message}</span>` })
}

const init = () => {
    applyTooltips()

    //Initializes then calls change password modal
    $modalOpenBtn.on("click", function () {
        openChangePasswordModal();
    })

    //Sends change password request to server.
    $submitBtn.on("click", function (e) {
        e.preventDefault();
        sendChangePasswordRequest();
    })

}

export { init }