$(document).ready(function() {
    applyTooltips()

    //Initializes then calls change password modal
    $("#change-password-btn").on("click", function(){
        $(`#change-password-modal`).modal();
        $(`#change-password-modal`).modal('open');
    })

    //Sends change password request to server.
    $("#change-password-confirm").on("click", function(e){
        e.preventDefault();
        $("#change-password-form span.error").remove();
        console.log("Change password request sent.")
        let changePasswordForm = document.querySelector("#change-password-form");
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
        .done(function(data) {
            console.log(data);
            if(data['status'] == "success"){
                $('#change-password-modal').modal('close');
                changePasswordForm.reset();
                console.log("Password Change Success.")
                window.location.replace(`/`);
            }
            else {
                console.log("Failed to change password.")
                formErrorHandler2("#change-password-form", data.errors)
                changePasswordForm.reset();
            }

        })
        .fail(function() {
            console.log( "Failed to send change password request.");
        })
        
    })
})