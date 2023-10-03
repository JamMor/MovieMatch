import {applyTooltips, resetFormErrors} from "/static/js/form_functions.js";
import { ajaxErrorHandler } from "/static/js/ajaxErrorHandler.js";


const changeForm = document.querySelector("#change-nickname-form");
//Every on screen element that displays the user's nickname has this class
const nicknameTagsClass = "displayed-nickname";

const $modal = $("#change-nickname-modal");
const $modalOpenBtn = $("#change-nickname-btn");
const $form = $(changeForm);
const $submitBtn = $("#change-nickname-confirm");

function openChangeNicknameModal(){
    $modal.modal();
    $modal.modal('open');
}

function sendChangeNicknameRequest(){
    resetFormErrors($form);
    const changeFormData = new FormData(changeForm);
    $.ajax({
        url: changeForm.action,
        method:changeForm.method,
        data: changeFormData,
        // processData and contentType needed to properly send formData
        // jQuery tries to make it a string
        processData: false,
        contentType: false
    })
    .done(function(response) {
        console.log(response);
        if(response.status == "success"){
            const newNickname = response.data["nickname"]
            $modal.modal('close');

            console.log(`Changed nickname to ${newNickname}`)
            // Update nicknames on anywhere on page
            const nicknameElements = document.getElementsByClassName(nicknameTagsClass);
            for (let i = 0; i < nicknameElements.length; i++) {
                nicknameElements[i].innerText = newNickname;
            }
            M.toast({html: `<span>Changed nickname to <strong class="cyan-text text-accent-2">${newNickname}</strong>!</span>`})
        }
        else {
            M.toast({html: `<span><strong class="orange-text text-darken-3">Failed</strong> to change nickname.</span>`})
            ajaxErrorHandler(response, $form)
        }
    })
    .fail(function() {
        console.error( "Failed to send change request." );
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