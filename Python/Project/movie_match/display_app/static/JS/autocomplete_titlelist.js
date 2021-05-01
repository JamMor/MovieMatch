$(document).ready(function() {
    console.log("Doc Ready.");
    var api_key = "f4f5f258379baf10796e1d3aeb5add05";

    function load_movies(){
        console.log("Running Load movies")
        var movie_query = $('input').val();
        console.log(movie_query);
        console.log(api_key);
        $.get("https://api.themoviedb.org/3/search/movie?api_key="+api_key+"&query="+movie_query, function(response){
            console.log("Request gotten.");
            console.log("RESPONSE from TMDB: ", response);
            $( "#movieinfo" ).append( "<p>Here's yo shit. You got this.</p>");
            response.results.forEach(movie => {
                $( "#movieinfo" ).append( "<p>" + movie.title+" " +movie.release_date+ "</p><hr>"
                );
            });
            
        }, "json")
    }
    $("button").click(load_movies)
})