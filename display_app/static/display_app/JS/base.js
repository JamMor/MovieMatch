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

    //Button Constructor
    const CardButton = (type) => {
        let color = ''; let customClass = ''; let icon = '';
        switch(type){
            case 'add':
                color = "blue darken-2"
                customClass = "add-btn"
                icon = "add"
                break;
            case 'remove':
                color = "orange darken-3"
                customClass = "remove-btn"
                icon = "remove"
                break;
            case 'info':
                color = "purple accent-2"
                customClass = "activator"
                icon = "info_outline"
                break;
            default:
                console.log("Error: Button type unrecognized.");
        }
        return `<a class="btn card-btn waves-effect waves-light ${color} ${customClass}"><i class="material-icons">${icon}</i></a>`
    }

    //MovieCard HTML Constructor
    const image_prefix = "https://image.tmdb.org/t/p/";
    const placeholder_link = DJ_STATIC_FILES.placeholder_path;

    MovieCard = (id_prefix, {id, title, release_date, overview, poster_path, is_eliminated}, buttonarray) => {
        let image_link = (poster_path == null) 
            ? `<img src='${placeholder_link}'>`
            : `<img src='${image_prefix}w342${poster_path}'>`
        let release_year = release_date?.slice(0, 4) ?? ""

        //Button options
        let button_elem = buttonarray.map(button => CardButton(button)).join('');

        //Context specific class options
        let card_class;
        if(id_prefix == "query"){card_class = "carousel-item";}
        else if(id_prefix == "shared"){card_class = is_eliminated = is_eliminated ? "eliminated" : "";}

        return    `
            <div id='${id_prefix}_${id}' class="card sticky-action grey darken-4 ${card_class}">
                <div class="card-image">
                    ${image_link}
                    <span class="card-title">${title}<br />${release_year}</span>
                </div>
                <div class="card-action">
                    ${button_elem}
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