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

    const csrftoken = getCookie('csrftoken');
    const api_key = "f4f5f258379baf10796e1d3aeb5add05";
    const image_link = "https://image.tmdb.org/t/p/";
    var movie_list = []

    const shareCode = $('#share-code').text();

    const matchSocket = new WebSocket(
        'ws://'
        + window.location.host
        + '/ws/match/'
        + shareCode
        + '/'
    );

    console.log(matchSocket);
    
    matchSocket.onopen = function(e) {
        console.log("Match socket opened");
        //Populate current share list.
        //Send user info
    };

    //delete movie from html when told
    matchSocket.onmessage = function(e) {
        console.log("Message received");
        console.log(e);


    };

    matchSocket.onclose = function(e) {
        console.error('Match socket closed unexpectedly');
    };

    //Send which movie to delete on click
    $('#testButton').click(function() {
        matchSocket.send(JSON.stringify({
            'message': 'Test send.'
        })
    )});
})