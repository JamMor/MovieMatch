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
        //Send user info
        //Populate current share list.
        matchSocket.send(JSON.stringify({
            'command' : 'initialize',
            'message': 'Test intialize send.'
        }))
    };

    //Receive messages
    matchSocket.onmessage = function(e) {
        console.log(e);
        responseData = JSON.parse(e.data);
        console.log(responseData);
        //Initialize list of movies
        if(responseData.command == "initialized"){
            init_list = responseData.share_list.movie_list
            movieAdder(movie_list, init_list)
            movie_list = init_list
            console.log("Initialized.")
        }
    };

    matchSocket.onclose = function(e) {
        console.error('Match socket closed unexpectedly');
    };

    //Send which movie to delete on click
    $('#deleteButton').click(function() {
        matchSocket.send(JSON.stringify({
            'command' : 'eliminate',
            'movie_id' : 'FakeId',
            'message': 'Test delete send.'
        })
    )});
})