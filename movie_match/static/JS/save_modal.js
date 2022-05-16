$("#save-list-confirm").click(function (e){
    e.preventDefault();
    let list_name = $("#list-name").val();
    
    if(movie_list.length == 0){
        saveStatusToast(list_name, "empty")
        return
    }

    let movie_ids = movie_list.map(movie => movie.movie_id)
    $.post("/save", JSON.stringify({"list_name":list_name, "movie_ids": movie_ids}),"json")
        .done(function(data) {
            console.log(data);
            if(data['status'] == "success"){
                $('#save-modal').modal('close');
                saveStatusToast(list_name, "success")
            }
            else {
                console.log(data['status'])
                saveStatusToast(list_name, "error")
            }

        })
        .fail(function() {
            console.log( "Failed to send movie list." );
            saveStatusToast(list_name, "fail-send")
        })
})

function saveStatusToast(listName, status){
    let toast = {}
    toast.name = (listName.length > 10) ? `${listName.slice(0,9)}...` : listName;

    if(status == "success"){
        toast.class = "cyan-text text-accent-2"
        toast.text = "Saved list to"
    }
    else if(status == "error"){
        toast.class = "orange-text text-darken-3"
        toast.text = "Could not save"
    }
    else if(status == "empty"){
        toast.class = "orange-text text-darken-3"
        toast.text = "Cannot save empty list"
    }
    else if(status == "fail-send"){
        toast.class = "orange-text text-darken-3"
        toast.text = "Failed to send"
    }

    M.toast({html: `<span>${toast.text}&nbsp;<strong class=${toast.class}>${toast.name}</strong></span>`})
}