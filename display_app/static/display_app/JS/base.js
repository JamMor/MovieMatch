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

    //MovieCard HTML Constructor
    
    const image_prefix = "https://image.tmdb.org/t/p/";
    const placeholder_link = DJ_STATIC_FILES.placeholder_path;

    MovieCard = (id_prefix, {id, title, release_date, overview, poster_path, shared_movie_id, is_eliminated}) => {
        let card_class;
        let image_link = (poster_path == null) 
                ? `<img src='${placeholder_link}'>`
                : `<img src='${image_prefix}w342${poster_path}'>`
        let release_year = release_date?.slice(0, 4) ?? ""
        
        if(id_prefix == "query"){card_class = "carousel-item"}
        else if(id_prefix == "shared"){
            id = shared_movie_id;
            card_class = is_eliminated = is_eliminated ? "eliminated" : ""
        }

        return    `
            <div class="card sticky-action grey darken-4 ${card_class}">
                <div class="card-image">
                    ${image_link}
                    <span class="card-title">${title}<br />${release_year}</span>
                </div>
                <div class="card-action">
                    <a id="${id_prefix}_${id}" class="btn card-btn add-btn waves-effect waves-light blue darken-2"><i class="material-icons">add</i></a>
                    <a class="btn card-btn waves-effect waves-light purple accent-2 activator"><i class="material-icons">info_outline</i></a>
                </div>
                <div class="card-reveal">
                    <span class="card-title grey-text text-darken-4"><i class="material-icons right">close</i></span>
                    <span class="card-title grey-text text-darken-4">${title}</span>
                    <span class="grey-text text-darken-4">${release_year}</span>
                    <p>${overview}</p>
                </div>
            </div>
        `
    };
})