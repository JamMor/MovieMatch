$(document).ready(function() {
    //Initializes then calls change password modal
    $("#change-password-btn").on("click", function(){
        $(`#change-password-modal`).modal();
        $(`#change-password-modal`).modal('open');
    })

    //Sends change password request to server.
    $("#change-password-confirm").on("click", function(e){
        e.preventDefault();
        console.log("Change password request sent.")
    })

})