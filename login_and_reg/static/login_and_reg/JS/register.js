$(document).ready(function() {
    $('form script').each(function () {
        let thisId = $(this).attr("id").slice(5)
        let thisValue = JSON.parse($(this).text());
        $(`#${thisId}`).siblings("i").tooltip({
            html: `<span>${thisValue}</span>`
        });
    })
})