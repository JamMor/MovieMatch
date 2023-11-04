import { applyTooltips, resetFormErrors } from "/static/js/shared/form_functions.js";
import { ajaxErrorHandler } from "/static/js/shared/ajaxErrorHandler.js";

const changeListNameForm = document.querySelector("#change-list-name-form");
const $form = $(changeListNameForm);
const listNameKey = "change-list_name";
const $saveFormListName = $("#id_save-list_name")

const $modalOpenBtn = $("#open-list-name-btn");
const $btnListNameSpan = $modalOpenBtn.find("span");
const $modal = $("#change-list-name-modal");
const $submitBtn = $("#change-list-name-confirm");

function validateListName(listName) {
    if (!/^[\w,.!:"' $&()+-]+$/u.test(listName)) {
        console.log("Invalid list name.")
        return false
    }
    return true
}

function changeListName() {
    resetFormErrors($form);

    const listNameFormData = new FormData(changeListNameForm);
    const listName = listNameFormData.get(listNameKey);

    if (!validateListName(listName)) {
        const errorMsg = "Name can only contain letters, numbers, spaces, basic punctuation: ,/./!/:/\"/'/$/&/+/-/() characters."
        ajaxErrorHandler({ form_errors: { [listNameKey]: [errorMsg] } }, $form)
        return
    }

    $btnListNameSpan.text(listName);
    $saveFormListName.val(listName);
    $modal.modal('close');
}


const init = () => {
    applyTooltips();

    $submitBtn.on("click", function(e){
        e.preventDefault();
        changeListName();  
    })
}

export { init }