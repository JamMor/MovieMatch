const init = () => {
    $('#save-modal').modal();

    //Opens final modal for now
    $('#status_bar').on('click', '.status-final' , function() {
        $('#final_modal').modal('open');
    });
}

export {init}