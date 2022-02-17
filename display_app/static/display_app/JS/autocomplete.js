$(document).ready(function() {

    const api_key = "f4f5f258379baf10796e1d3aeb5add05";
    const image_link = "https://image.tmdb.org/t/p/";
    var movie_list = []

    //Autocomplete that pulls dynamic data from API. Also adds selected elements 
    //info to an object to send back to server on upload.
    $( "#searchbar" ).autocomplete({
        appendTo: "#searchbox",
        delay: 500,
        minLength:2,
        source: function(request, response) {
            var search_str = request.term;
            // if (search_str in cache) {
            //     response (cache[search_str]);
            //     return
            // }
            $.get("https://api.themoviedb.org/3/search/movie?api_key="+api_key+"&query="+search_str,
                function(data){
                    // cache[search_str] = data;
                    response( data.results );
                    return
                }, "json")
        },
        select: function (event, movie){
            console.log(movie);
            if (movie_list.some(each_movie => each_movie.id == movie.item.id)) {
                console.log("It's already in here dumdum.")
            }
            else {
                movie_list.push(movie.item);
                $('#user_list').append("<div class='list_item personal' style='background-image: url(" + image_link+"w154"+movie.item.poster_path + ")'><h5>"+movie.item.title+ " - " +movie.item.release_date.slice(0,4)+ "</h5></div>");
            }
            
        },
    }).data('ui-autocomplete')._renderItem = function(ul, movie) {
        return $( "<li>" )
        .attr( "item.autocomplete", movie )
        .append( "<a>" +movie.title+ " - " +movie.release_date+ "<img src='"+image_link+"w92"+movie.poster_path+"'></a>" )
        .appendTo( ul );
    }
})