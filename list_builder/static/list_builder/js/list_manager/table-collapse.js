const init = () => {
    // Prevents selecting a list action from also triggering list expand/collapse
    $(".list-actions-td").on("click", function (e) {
        e.stopPropagation();
    })

    // Adds/removes 'content-collapsed' class to collapse slider row
    $(".row-collapse-trigger").on("click", function () {
        $(this).next()
            .find("div.slider-x")
            .toggleClass('content-collapsed')
    })
}

export { init }