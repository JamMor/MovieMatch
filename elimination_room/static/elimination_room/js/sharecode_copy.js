const sharecodeId = "sharecode"
const $copySharecode = $("#copy-sharecode");

//This function will copy the text of #share-code to the clipboard
function copyToClipboard() {
    const shareCode = document.getElementById(sharecodeId).textContent;
    navigator.clipboard.writeText(shareCode);
    M.toast({ html: `Sharecode, <strong class="cyan-text text-accent-2">${shareCode}</strong>, copied to clipboard!` });
}

const init = () => {
    $copySharecode.on("click", copyToClipboard);
}

export { init };