$(document).ready(function() {
    //Prepare csrf token to be used outside of template.
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    csrftoken = getCookie('csrftoken');

    //Initialize Mobile Nav Menu item.
    $('.sidenav').sidenav();
    $(".dropdown-trigger").dropdown({
        alignment: 'right',
        constrainWidth: false,
        coverTrigger: false,
        closeOnClick: false
    });
    $('.collapsible').collapsible();

    //Login Submission AJAX
    $(".login-form").on("submit", function (event) {
        console.log("Login Button Pressed")
        event.preventDefault()
        let formAction = $(this).attr('action')
        let formData = $(this).serialize()

        $.post(formAction, formData, "json")
            .done(function (data) {
                console.log(data)
                if (data['status'] == "success") {
                    console.log("Login succesful!");
                    location.reload();
                }
                else {
                    console.log("Login failure!");
                    $(".login-form span.error").remove();
                    formErrorHandler(".login-form", data.errors)
                    $('#nav-bar .dropdown-trigger').dropdown('recalculateDimensions');
                }
            })
            .fail(function () {
                console.log("Failed to send login.");
            })
    })
    
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
                    $(`${formSelector} input[name=${field} ~ label]`)
                        .after(`<span class="error">${errorMsg}</span>`)
                }
            }
        }
    }
    
    //Allows user to tab through dropdown form fields without dropdown closing
    $('nav .login-form').on('keydown', function(event) {
        event.stopPropagation();
    });
})