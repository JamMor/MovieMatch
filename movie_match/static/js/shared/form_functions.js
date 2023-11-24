//Parses script tags from form template containing JSON of any tooltips
//and applies them to the appropriate form fields
function applyTooltips() {
    $('form script').each(function () {
        // Script Ids are in the format "help_${field_element_id}"
        const thisId = $(this).attr("id").slice(5)
        const thisValue = JSON.parse($(this).text());
        $(`#${thisId}`).siblings("i").tooltip({
            html: `<span>${thisValue}</span>`
        });
    })
}

//Parses dictionary of form errors for each field and applies them in a span
//where appropriate. (For AJAX form submissions)
function formErrorHandler($form, errorDict) {
    for (const field of Object.keys(errorDict)) {
        if (field == "__all__") {
            for (let errorMsg of errorDict[field]) {
                $form
                    .prepend(`<span class="error center">${errorMsg}</span>`)
            }
        }
        else {
            for (let errorMsg of errorDict[field]) {
                $form.find(`input[name=${field}] ~ label`)
                    .after(`<span class="error">${errorMsg}</span>`)
            }
        }
    }
}

function resetFormErrors($form) {
    $form.find("span.error").remove();
}


export { applyTooltips, formErrorHandler, resetFormErrors }