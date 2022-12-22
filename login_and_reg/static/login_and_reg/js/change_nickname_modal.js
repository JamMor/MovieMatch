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
    })

})