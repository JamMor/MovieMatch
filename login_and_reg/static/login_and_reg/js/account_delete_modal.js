$(document).ready(function() {
    //Initializes then calls delete modal
    $("#delete-account-btn").on("click", function(){
        $(`#account-delete-modal`).modal();
        $(`#account-delete-modal`).modal('open');
    })

    //Sends delete request to server. List ID as URL parameter
    $("#account-delete-confirm").on("click", function(e){
        e.preventDefault();
        console.log("Delete request sent.")
        let deleteForm = document.querySelector("#account-delete-form");
        const deleteFormData = new FormData(deleteForm);
        $.ajax({
            url: `settings/delete-account`,
            method:"POST",
            data: deleteFormData,
            // processData and contentType needed to properly send formData
            // jQuery tries to make it a string
            processData: false,
            contentType: false
        })
        .done(function(data) {
            console.log(data);
            if(data['status'] == "success"){
                $('#delete-modal').modal('close');
                console.log("Delete Success.")
                window.location.replace(`/`);
            }
            else {
                console.log("Failed to delete.")
            }

        })
        .fail(function() {
            console.log( "Failed to send delete request." );
        })
        
    })

})