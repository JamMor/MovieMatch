import { ajaxErrorHandler } from "/static/js/shared/ajaxErrorHandler.js";

const deleteForm = document.querySelector("#account-delete-form");
const $modal = $("#account-delete-modal");
const $modalOpenBtn = $("#account-delete-btn");
const $form = $(deleteForm);
const $submitBtn = $("#account-delete-confirm");

function openDeleteAccountModal() {
    $modal.modal();
    $modal.modal('open');
}

function sendDeleteAccountRequest() {    
    const deleteFormData = new FormData(deleteForm);
    $.ajax({
        url: deleteForm.action,
        method:deleteForm.method,
        data: deleteFormData,
        // processData and contentType needed to properly send formData
        // jQuery tries to make it a string
        processData: false,
        contentType: false
    })
    .done(function(response) {
        console.log(response);
        if(response.status == "success"){
            $modal.modal('close');
            console.log("Account Deletion Success.")
            window.location.replace(`/`);
        }
        else {
            console.log("Failed to delete.")
            ajaxErrorHandler(response, $form)
            let extraMessage;
            if(response.errors.length > 0){
                extraMessage = response.errors[0]
            }
            deleteAccountStatusToast("error", extraMessage);
        }

    })
    .fail(function() {
        console.error( "Request failure: delete account." );
        deleteAccountStatusToast("fail");
    })
}

function deleteAccountStatusToast(status, extraMessage = "") {
    const statusMessages = {
        "success" : `Account <strong className="cyan-text text-accent-2">successfully</strong> deleted!`,
        "error" : `<strong class="orange-text text-darken-3">Failed</strong> to delete account. ${extraMessage}`,
        "fail" : `<strong class="orange-text text-darken-3">Request failure.</strong>.`,
        "unknown" : `<strong class="orange-text text-darken-3">Unknown error.</strong>.`
    }
    
    const message = statusMessages[status] || statusMessages["unknown"]
    
    M.toast({html: `<span>${message}</span>`})
}

const init = () => {
    //Initializes then calls account deletion modal
    $modalOpenBtn.on("click", function(){
        openDeleteAccountModal();
    })

    //Sends delete request to server.
    $submitBtn.on("click", function(e){
        e.preventDefault();
        sendDeleteAccountRequest();
    })
}

export {init}