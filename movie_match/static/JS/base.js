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

    //CONSTRUCTOR ELEMENTS
    //==========================================================================

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

    MovieCard = (
        id_prefix,
        { id, title, release_date, overview, poster_path, is_eliminated },
        buttonarray
    ) => {
        let image_tag = (poster_path == null)
            ? `<img src='${placeholder_link}'>`
            : `<img src='${image_prefix}w342${poster_path}'>`
        let release_year = release_date?.slice(0, 4) ?? ""

        //Button options
        let button_elem = buttonarray.map(button => CardButton(button)).join('');

        //Context specific class options
        let card_class = "";
        if (id_prefix == "query") { card_class = "carousel-item"; }
        else if (id_prefix == "shared") { card_class = is_eliminated = is_eliminated ? "eliminated" : ""; }

        return `
            <div id='${id_prefix}_${id}' class="card sticky-action grey darken-4 ${card_class}">
                <div class="card-image">
                    ${image_tag}
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
    
    const ProviderList = (providers) => {
        if(providers.length == 0){
            return `<li class="center-align provider-empty"><em>Not available at this time.</em></li>`
        }
        return providers.map(prv => 
            `<li class="tooltipped" data-position="bottom" data-tooltip="${prv.provider_name}">
                <img src="${image_prefix}w45${prv.logo_path}" alt="${prv.provider_name}">
            </li>`
            ).join('');
    }

    MovieInfoModal = ( 
        {id, title, release_date="", overview, poster_path,
        genres=[], imdb_id="", runtime="", vote_average="", 
        "watch/providers":{results:{US:{flatrate:stream=[], rent=[]}}}
        }) => {
        let image_tag = (poster_path == null) 
            ? `<img class="poster" src='${placeholder_link}'>`
            : `<img class="poster" src='${image_prefix}w342${poster_path}'>`

        // let release_year = release_date?.slice(0, 4) ?? ""
        let runtime_hours = Math.floor(runtime/60);
        runtime_hours = runtime_hours > 0 ? `${runtime_hours} hr ` : ''
        let runtime_minutes = `${runtime%60} min`
        return    `
            <div class="row">
                <div class="col s12 m6">
                    ${image_tag}
                </div>
                <div class="col s12 m6">
                    <h4>${title}</h4>
                    <span>
                        <h6>${release_date}</h6>
                        <h6">${runtime_hours}${runtime_minutes}</h6>
                    </span>
                    <h5>TMDb Rating: ${vote_average}/10 <i class="material-icons">grade</i></h5>
                    <p>${genres.map(genre => genre.name).join(", ")}</p>
                    <p>${overview}</p>
                </div>
            </div>
            <div class="row">
                <ul class="collapsible">
                    <li>
                        <div class="collapsible-header"><i class="material-icons">live_tv</i>Stream</div>
                        <div class="collapsible-body">
                            <ul class="providers">
                                ${ProviderList(stream)}
                            </ul>
                        </div>
                    </li>
                    <li>
                        <div class="collapsible-header"><i class="material-icons">monetization_on</i>Rent</div>
                        <div class="collapsible-body">
                            <ul class="providers">
                                ${ProviderList(rent)}
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
        `
    };
})