const $modal = $("#delete-modal");
const $modalOpenBtns = $(".delete-list-btn");
const $submitBtn = $("#delete-list-confirm");
const $headerRowElementFromListId = (listId) => $(`#list_${listId}`);
const listIdFromHeaderRowDOMId = (headerRowDOMId) => headerRowDOMId.split("_")[1];
const $listNameForModal = $("#list-name-delete");

let thisList = {};
function displayDeleteModal(listName){
    $listNameForModal
        .text(listName)
    $modal.modal();
    $modal.modal('open');
}

function handleDeleteRequest(){
    //Get list name and id from DOM
    let $thisRow = $(this).parents("tr")
    let thisRowId = $thisRow.attr("id");
    thisList.id = listIdFromHeaderRowDOMId(thisRowId);
    thisList.name = $thisRow
        .children(".list-name-td")
        .children("span")
        .text()

    displayDeleteModal(thisList.name)
}

function sendDeletionRequest(){
    $.ajax({
        url: urlPath.deleteList(thisList.id),
        method:"DELETE"
    })
    .done(function(response) {
        console.log(response);
        if(response.status == "success"){
            $modal.modal('close');
            console.log("Delete Success.")
            deleteStatusToast(response.data.list_name, "success")
            
            // Remove deleted row from DOM
            let $headerRow = $headerRowElementFromListId(response.data.list_id)
            let $contentRow = $headerRow.next("tr")
            $headerRow.remove();
            $contentRow.remove()

        }
        else {
            console.log("Failed to delete.")
            console.log(response.errors)
            deleteStatusToast(thisList.name, "error")
        }

    })
    .fail(function() {
        console.log( "Failed to send delete request." );
        deleteStatusToast(thisList.name, "fail-send")
    })
}

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

const init = () => {
    //Gets list id, and generates then calls delete modal
    $modalOpenBtns.on("click", function(){
        handleDeleteRequest.call(this);
    })
    
    //Sends delete request to server. List ID as URL parameter
    $submitBtn.on("click", function(e){
        e.preventDefault();
        sendDeletionRequest();    
    })
}

export {init}