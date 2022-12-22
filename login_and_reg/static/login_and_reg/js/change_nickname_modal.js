$(document).ready(function() {
    //Initializes then calls change nickname modal
    $("#change-nickname-btn").on("click", function(){
        $(`#change-nickname-modal`).modal();
        $(`#change-nickname-modal`).modal('open');
    })

    //Sends change nickname request to server.
    $("#change-nickname-confirm").on("click", function(e){
        e.preventDefault();
        console.log("Change request sent.")
        let changeForm = document.querySelector("#change-nickname-form");
        const changeFormData = new FormData(changeForm);
        $.ajax({
            url: `/settings/change-nickname`,
            method:"POST",
            data: changeFormData,
            // processData and contentType needed to properly send formData
            // jQuery tries to make it a string
            processData: false,
            contentType: false
        })
        .done(function(data) {
            console.log(data);
            if(data['status'] == "success"){
                $('#change-nickname-modal').modal('close');
                console.log(`Changed nickname to ${data["data"]["nickname"]}`)
            }
            else {
                console.log("Failed to change.")
                

            }
        })
        .fail(function() {
            console.log( "Failed to send change request." );
        })
    })
})