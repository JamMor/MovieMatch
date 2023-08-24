const init = () => {
    // Materialize FAB button initialize
    $('.fixed-action-btn').floatingActionButton({
        toolbarEnabled: true
    });

    // Materialize Modal initialize
    $('.modal').modal();
}

export { init }