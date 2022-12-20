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

    })

