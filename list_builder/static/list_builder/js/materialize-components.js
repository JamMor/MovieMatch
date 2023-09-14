const init = () => {
    // Materialize FAB button initialize
    $('#list-save-share-btn').floatingActionButton({
        toolbarEnabled: true
    });
    
    $('#list-actions-btn').floatingActionButton({
        direction: 'bottom',
        hoverEnabled: false
    });

    // Materialize Modal initialize
    $('.modal').modal();
}

export { init }