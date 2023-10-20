import {applyTooltips, resetFormErrors} from "/static/js/shared/form_functions.js";
import { ajaxErrorHandler } from "/static/js/shared/ajaxErrorHandler.js";
import { escapeHtml } from "/static/js/shared/htmlEscaping.js";


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

function sendChangeNicknameRequest() {
    resetFormErrors($form);
    const changeFormData = new FormData(changeForm);
    $.ajax({
        url: changeForm.action,
        method: changeForm.method,
        data: changeFormData,
        // processData and contentType needed to properly send formData
        // jQuery tries to make it a string
        processData: false,
        contentType: false,
        dataType: "json",
    })
        .done(function (response) {
            console.log(response);
            if (response.status == "success") {
                const newNickname = response.data["nickname"]
                $modal.modal('close');

                console.log(`Changed nickname to ${newNickname}`)
                // Update nicknames on anywhere on page
                const nicknameElements = document.getElementsByClassName(nicknameTagsClass);
                for (let i = 0; i < nicknameElements.length; i++) {
                    nicknameElements[i].innerText = newNickname;
                }
                if (newNickname == "") {
                    changeNicknameStatusToast("blank");
                }
                else {
                    changeNicknameStatusToast("success", newNickname);
                }
            }
            else {
                console.log("Failed to change nickname.")
                ajaxErrorHandler(response, $form)
                changeNicknameStatusToast("error")
            }
        })
        .fail(function () {
            console.error("Request failure: change nickname.");
            changeNicknameStatusToast("fail");
        })
}

function changeNicknameStatusToast(status, nickname = "") {
    const escapedNickname = escapeHtml(nickname);
    const statusMessages = {
        "success" : `Changed nickname to <strong class="cyan-text text-accent-2">${escapedNickname}</strong>!`,
        "blank" : `Reset nickname to <strong class="purple-text text-accent-2">blank</strong>.`,
        "error" : `<strong class="orange-text text-darken-3">Failed</strong> to change nickname.`,
        "fail" : `<strong class="orange-text text-darken-3">Request failure.</strong>.`,
        "unknown" : `<strong class="orange-text text-darken-3">Unknown error.</strong>.`
    }
    
    const message = statusMessages[status] || statusMessages["unknown"]
    
    M.toast({html: `<span>${message}</span>`})
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