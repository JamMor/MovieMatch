$(document).ready(function(){
    $(".row-collapse-trigger").on("click", function() {
        console.log("Row Clicked")
        $(this).next()
            .find("div.slider-x")
            .toggleClass('content-collapsed')
    })
})