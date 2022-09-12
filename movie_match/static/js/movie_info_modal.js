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