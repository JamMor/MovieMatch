//Parses script tags from form template containing JSON of any tooltips
//and applies them to the appropriate form fields
function applyTooltips(){
    $('form script').each(function () {
        let thisId = $(this).attr("id").slice(5)
        let thisValue = JSON.parse($(this).text());
        $(`#${thisId}`).siblings("i").tooltip({
            html: `<span>${thisValue}</span>`
        });
    })
}
