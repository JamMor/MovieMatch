const init = () => {
    //Initialize Mobile Nav Menu item.
    $('.sidenav').sidenav();
    $(".dropdown-trigger").dropdown({
        alignment: 'right',
        constrainWidth: false,
        coverTrigger: false,
        closeOnClick: false
    });
    $('.collapsible').collapsible();
}

export { init }