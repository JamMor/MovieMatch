$(document).ready(function() {
    //Selected list properties
    let thisList = {};

    //Gets list id, and generates then calls delete modal
    $(".delete-list-btn").on("click", function(){
        let thisRow = $(this).parents("tr")
        thisList["id"] = thisRow.attr("id").split("_")[1];
        thisList["name"] = thisRow
            .children(".list-name-td")
            .children("span")
            .text()

        $("#list-name-delete")
            .text(thisList.name)
       
        $(`#delete-modal`).modal();
        $(`#delete-modal`).modal('open');
    })

    //Sends delete request to server. List ID as URL parameter
    $("#delete-list-confirm").on("click", function(e){
        e.preventDefault();

        $.ajax({
            url: `/delete/${thisList.id}`,
            method:"DELETE"
        })
        .done(function(data) {
            console.log(data);
            if(data['status'] == "success"){
                $('#delete-modal').modal('close');
                console.log("Delete Success.")
                deleteStatusToast(data["data"]["list_name"], "success")
                
                // Remove deleted row from DOM
                let headerRow = $(`#list_${data["data"]["list_id"]}`)
                let contentRow = headerRow.next("tr")
                headerRow.remove();
                contentRow.remove()

            }
            else {
                console.log("Failed to delete.")
                deleteStatusToast(thisList.name, "error")
            }

        })
        .fail(function() {
            console.log( "Failed to send delete request." );
            deleteStatusToast(thisList.name, "fail-send")
        })
    })

    //Sends appropriate notification for list delete
    function deleteStatusToast(listName, status){
        let toast = {}
        toast.name = (listName.length > 10) ? `${listName.slice(0,9)}...` : listName;
    
        if(status == "success"){
            toast.class = "cyan-text text-accent-2"
            toast.text = "Deleted"
        }
        else if(status == "error"){
            toast.class = "orange-text text-darken-3"
            toast.text = "Could not delete"
        }
        else if(status == "fail-send"){
            toast.class = "orange-text text-darken-3"
            toast.text = "Failed to request delete of"
        }
    
        M.toast({html: `<span>${toast.text}&nbsp;<strong class=${toast.class}>${toast.name}</strong></span>`})
    }
})