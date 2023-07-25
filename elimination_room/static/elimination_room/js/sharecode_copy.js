//This function will copy the text of #share-code to the clipboard
function copyToClipboard() {
    let shareCode = document.getElementById("sharecode").textContent;
    navigator.clipboard.writeText(shareCode);
    M.toast({html: `Sharecode, <strong class="cyan-text text-accent-2">${shareCode}</strong>, copied to clipboard!`});
}

const init = () => {
    $("#copy-sharecode").on("click", copyToClipboard);
}

export {init};