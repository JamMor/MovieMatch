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
    const image_prefix = "https://image.tmdb.org/t/p/";
    const placeholder_link = DJ_STATIC_FILES.placeholder_path;
    
    var movie_list = [];
    let search_results = [];

    const MovieCard = (id_prefix, {id, title, release_date, overview, poster_path}) => {
        image_link = (poster_path == null) 
                ? `<img src='${placeholder_link}'>`
                : `<img src='${image_prefix}w342${poster_path}'>`

        return    `
            <div class="card sticky-action grey darken-4 carousel-item">
                <div class="card-image">
                    ${image_link}
                    <span class="card-title">${title}</span>
                    <span class="card-title">${release_date.slice(0, 4)}</span>
                </div>
                <div class="card-action">
                    <a id="${id_prefix}_${id}" class="btn card-btn add-btn waves-effect waves-light red accent-4"><i class="material-icons">add</i></a>
                    <a class="btn card-btn waves-effect waves-light red accent-4 activator"><i class="material-icons">info_outline</i></a>
                </div>
                <div class="card-reveal">
                    <span class="card-title grey-text text-darken-4">${title}<i class="material-icons right">close</i></span>
                    <span class="card-title grey-text text-darken-4">${release_date.slice(0, 4)}</span>
                    <p>${overview}</p>
                </div>
            </div>
        `
    };

    //Prevent normal form behavior for search
    $('#search-form').submit(function(e){
        e.preventDefault();
    })

    //Delay wrapper function (to limit ajax queries when typing)
    function delay(fn, ms) {
        let timer = 0
        return function (...args) {
            clearTimeout(timer)
            timer = setTimeout(fn.bind(this, ...args), ms || 0)
        }
    }

    //Custom autocomplete jquery ajax to materialize carousel feature
    $('#moviesearch-input').on("input", delay(function () {
        var searchQuery = this.value;
        if (searchQuery.length >= 2) {
            console.log(searchQuery)
            $.get(`https://api.themoviedb.org/3/search/movie?api_key=${api_key}&query=${searchQuery}`,
                function () {
                    console.log("AJAX sent to TMDB");
                    return
                }, "json")
                .done(function (data) {
                    console.log(data);
                    search_results = data.results;
                    $("div.carousel").html(search_results
                        .map(movie => MovieCard("search-movie", movie))
                        .join('')
                    );
                    $('.carousel').carousel({
                        dist: -50,
                        noWrap: true,
                        numVisible: 20
                        });
                })
        }
        else if (searchQuery.length == 0) {
            $("div.carousel").html("")
        }
    }, 1000));

    //Handler to add movie to list and dom

    //Autocomplete that pulls dynamic data from API. Also adds selected elements 
    //info to an object to send back to server on upload.
    $( "#searchbar" ).autocomplete({
        appendTo: "#searchbox",
        delay: 500,
        minLength:2,
        source: function(request, response) {
            var search_str = request.term;
            $.get(`https://api.themoviedb.org/3/search/movie?api_key=${api_key}&query=${search_str}`,
                function(data){
                    response( data.results );
                    return
                }, "json")
        },
        select: function (event, movie_item){
            let movie = movie_item.item;
            console.log(movie);
            if (movie_list.some(each_movie => each_movie.id == movie.id)) {
                console.log("It's already in here dumdum.")
            }
            //Adds movie to DOM
            else {
                movie_list.push(movie);
                background_img = (movie.poster_path == null) 
                    ? "style='background-color:red'"
                    : `style='background-image: url(${image_link}w154${movie.poster_path})'`
        
                $('#movie_list')
                    .append(
                        `<div class='list_item personal' ${background_img}>\
                        <h5>${movie.title} - ${movie.release_date.slice(0, 4)}</h5>\
                        </div>`);
            }
            
        },
    }).data('ui-autocomplete')._renderItem = function(ul, movie) {
        return $( "<li>" )
        .attr( "item.autocomplete", movie )
        .append( `<a>${movie.title} - ${movie.release_date}<img src='${image_link}w92${movie.poster_path}'></a>` )
        .appendTo( ul );
    }

    // POSTs name, movie list, and sharecode(if any)
    $("#share").click(function (){
        sharecode = $("#sharecode").val();
        nickname = $("#nickname").val();

        //=================TESTING===================
        //Size of POST of object
        const size = new TextEncoder()
            .encode(JSON
                .stringify({
                    "sharecode": sharecode, 
                    "nickname": nickname, 
                    "movie_list": movie_list}))
            .length;
        const kiloBytes = size / 1024;
        const megaBytes = kiloBytes / 1024;
        console.log(`POST data is ${megaBytes} MBs (${kiloBytes} kBs)`);
        //===========================================

        // console.log("DATA for Django: ", {"sharecode": sharecode, "nickname": nickname, "movie_list": movie_list});
        $.post("match/", JSON.stringify({"sharecode": sharecode, "nickname": nickname, "movie_list": movie_list}),"json")
            .done(function(data) {
                console.log( "Movie list successfully sent!" );
                if(data['status'] == "success")
                {window.location.href = `/match/${data.sharecode}`;}
                else
                {console.log(data['status'])}

                })
            .fail(function() {
                console.log( "Failed to send movie list." );
                })
    })

    // Button to clear current user list
    $("#clear").click(function (){
        movie_list = [];
        $('#movie_list').html("");
    })
})