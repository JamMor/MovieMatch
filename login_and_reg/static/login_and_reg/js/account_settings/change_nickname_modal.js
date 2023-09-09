import {applyTooltips, formErrorHandler} from "/static/js/form_functions.js";


const formId = "change-nickname-form";
//Every on screen element that displays the user's nickname has this class
const nicknameTagsClass = "displayed-nickname";

const $modal = $("#change-nickname-modal");
const $modalOpenBtn = $("#change-nickname-btn");
const $form = $("#change-nickname-form");
const $submitBtn = $("#change-nickname-confirm");
//Every on screen element that displays the user's nickname has this class
const $nicknameTags = $(".displayed-nickname");

function openChangeNicknameModal(){
    $modal.modal();
    $modal.modal('open');
}

function sendChangeNicknameRequest(){
    console.log("Change request sent.")
    let changeForm = document.querySelector(`#${formId}`);
    const changeFormData = new FormData(changeForm);
    $.ajax({
        url: urlPath.changeNickname,
        method:"POST",
        data: changeFormData,
        // processData and contentType needed to properly send formData
        // jQuery tries to make it a string
        processData: false,
        contentType: false
    })
    .done(function(response) {
        console.log(response);
        if(response.status == "success"){
            let newNickname = response.data["nickname"]
            $modal.modal('close');
            //FLAG Reset old form errors
            $form.find("span.error").remove();
            console.log(`Changed nickname to ${newNickname}`)
            // Update nicknames on anywhere on page
            let nicknameElements = document.getElementsByClassName(nicknameTagsClass);
            for (let i = 0; i < nicknameElements.length; i++) {
                nicknameElements[i].innerText = newNickname;
            }
            M.toast({html: `<span>Changed nickname to <strong class="cyan-text text-accent-2">${newNickname}</strong>!</span>`})
        }
        else {
            console.log("Failed to change.")
            console.log(response.errors)
            console.log(response.form_errors)
            M.toast({html: `<span><strong class="orange-text text-darken-3">Failed</strong> to change nickname.</span>`})
            //FLAG Reset old form errors
            $form.find("span.error").remove();
            formErrorHandler(`#${formId}`, response.form_errors)
        }
    })
    .fail(function() {
        console.log( "Failed to send change request." );
        M.toast({html: `<span><strong class="orange-text text-darken-3">Failed</strong> to send change nickname request.</span>`})
    })
}

const init = () => {
    applyTooltips()

    //Initializes then calls change nickname modal
    $modalOpenBtn.on("click", function(){
        openChangeNicknameModal();
    })

    //Sends change nickname request to server.
    $submitBtn.on("click", function(e){
        e.preventDefault();
        sendChangeNicknameRequest();
    })
}

export {init}