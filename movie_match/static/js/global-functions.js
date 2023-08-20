//Inserts returned form errors into form html
function formErrorHandler(formSelector, errorDict){
    for(const field of Object.keys(errorDict)){
        if(field == "__all__"){
            for(let errorMsg of errorDict[field]){
                $(formSelector)
                    .prepend(`<span class="error center">${errorMsg}</span>`)
            }
        }
        else {
            for(let errorMsg of errorDict[field]){
                $(`${formSelector} input[name=${field}] ~ label`)
                    .after(`<span class="error">${errorMsg}</span>`)
            }
        }
    }
}

export {formErrorHandler}