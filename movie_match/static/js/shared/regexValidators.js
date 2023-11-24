function validateSharecode(sharecode) {
    if (!/^$|^[2-9a-hj-np-zA-HJ-NP-Z]{8}$/.test(sharecode)) {
        console.log("Invalid Sharecode format.")
        return { isValid: false, errorMsg: "Invalid sharecode format." }
    }
    return { isValid: true }
}

function validateUserInput(userInput) {
    if (!/^$|^[\w,.!?:"' $&()+-]+$/u.test(userInput)) {
        return { isValid: false, errorMsg: "Name can only contain letters, numbers, spaces, basic punctuation: , . ! ? : ' \" $ & + - ( ) characters." }
    }
    return { isValid: true }
}

export { validateSharecode, validateUserInput }