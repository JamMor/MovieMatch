const formId = "account-delete-form";
const $modal = $("#account-delete-modal");
const $modalOpenBtn = $("#account-delete-btn");
const $form = $("#account-delete-form");
const $submitBtn = $("#account-delete-confirm");

function openDeleteAccountModal() {
    $modal.modal();
    $modal.modal('open');
}

function sendDeleteAccountRequest() {
    console.log("Delete request sent.")
    const deleteForm = document.querySelector(`#${formId}`);
    const deleteFormData = new FormData(deleteForm);
    $.ajax({
        url: urlPath.deleteAccount,
        method:"POST",
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
            M.toast({html: `<span><strong class="orange-text text-darken-3">Failed</strong> to delete account. ${response.errors}</span>`})
        }

    })
    .fail(function() {
        console.log( "Failed to send delete request." );
        M.toast({html: `<span><strong class="orange-text text-darken-3">Failed</strong> to send delete request.</span>`})
    })
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