function switchIconText() {
    if ($(this).is(":checked")) {
        $("#icons div h6 span").css("visibility", "hidden");
    } else {
        $("#icons div h6 span").css("visibility", "visible");
    }
}

$(document).ready(function () {
    $("#icon-text-switch").click(function () {
        switchIconText.call(this);
    });

});