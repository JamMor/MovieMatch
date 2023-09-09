/**
 * Constructor namespace.
 * @namespace domElements
 */

//DOM Element Constructors

//Button Constructor
//Takes type of button and returns html as string for a card button
const CardButton = (type) => {
    let color = ''; let customClass = ''; let icon = '';
    switch(type){
        case 'add':
            color = "neon-cyan neon-glow-hover"
            customClass = "add-btn"
            icon = "add"
            break;
        case 'remove':
            color = "neon-orange neon-glow-hover"
            customClass = "remove-btn"
            icon = "remove"
            break;
        case 'info':
            color = "neon-purple neon-glow-hover"
            customClass = "activator info-btn"
            icon = "info_outline"
            break;
        default:
            console.log("Error: Button type unrecognized.");
    }
    return `<btn class="btn card-btn waves-effect waves-light ${color} ${customClass}"><i class="material-icons">${icon}</i></btn>`
}


/**
 * Constructs MovieCard HTML element from options and movie info.
 * @param {string} id_prefix - prefix of card element's ID
 * @param {(number|string)} card_id  - suffix of card element's ID
 * @param {object} movie - A Movie object containing movie info
 * @param {string} movie.title - Movie title.
 * @param {string} movie.overview - Plot overview of movie.
 * @param {boolean} [movie.is_eliminated] - Elimination status for shared movies.
 * @param {string} movie.releaseYear - Year movie released.
 * @param {string} movie.fullPosterURL - Complete url for movie poster or fallback.
 * @param {string[]} buttonArray - List of desired button types for card in order.
 * @param {string} [card_css_class]  - string of css classes to be applied to card element
 * @returns {string} Html for complete movie card element.
 */
const MovieCard = (
    id_prefix,
    card_id,
    { title, overview, is_eliminated, releaseYear, fullPosterURL },
    buttonArray,
    card_css_class = ""
) => {

    //Button options
    let button_elem = buttonArray.map(button => CardButton(button)).join('');

    //Append Elimination css class for match cards
    card_css_class += is_eliminated ? " eliminated" : "";

    return `
        <div id='${id_prefix}_${card_id}' class="movie-card card sticky-action grey darken-4 ${card_css_class}">
            <div class="card-image">
                <img src='${fullPosterURL}'>
                <span class="card-title">${title}<br />${releaseYear}</span>
            </div>
            <div class="card-action">
                ${button_elem}
            </div>
            <div class="card-reveal">
                <span class="card-title grey-text text-darken-4"><i class="material-icons right">close</i></span>
                <span class="card-title grey-text text-darken-4">${title}</span>
                <span class="grey-text text-darken-4">${releaseYear}</span>
                <p>${overview}</p>
            </div>
        </div>
    `
};


//Returns HTML string for watch providers display in MovieInfo
const ProviderList = (providers) => {
    if(providers.length == 0){
        return `<li class="center-align provider-empty"><em>Not available at this time.</em></li>`
    }
    return providers.map(prv => 
        `<li class="tooltipped" data-position="bottom" data-tooltip="${prv.provider_name}">
            <img src="${resourcePath.imagePrefix}w45${prv.logo_path}" alt="${prv.provider_name}">
        </li>`
        ).join('');
}

//Takes object from the movieDB movie query and returns the html as a string for 
//the 'More Info' modal
const MovieInfoModal = ( 
        {tmdb_id, title, release_date, overview, fullPosterURL,
        genres, formattedRuntime, vote_average, stream, rent}
    ) => {

    return    `
        <div class="row">
            <div class="col s12 m6">
                <img class="poster" src='${fullPosterURL}'>
            </div>
            <div class="col s12 m6">
                <h4>${title}</h4>
                <span>
                    <h6>${release_date}</h6>
                    <h6">${formattedRuntime}</h6>
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

export { MovieCard, MovieInfoModal }