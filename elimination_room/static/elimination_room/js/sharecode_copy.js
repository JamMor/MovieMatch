//This function will copy the text of #share-code to the clipboard
function copyToClipboard() {
    let shareCode = document.getElementById("sharecode").textContent;
    navigator.clipboard.writeText(shareCode);
    M.toast({html: `Sharecode, <strong class="cyan-text text-accent-2">${shareCode}</strong>, copied to clipboard!`});
}

// This attaches an event listener to the copy button that calls the copyToClipboard function when the document is ready
$(document).ready(function () {
    $("#copy-sharecode").on("click", copyToClipboard);
});