$(document).ready(function() {
    var api_key = "f4f5f258379baf10796e1d3aeb5add05";
    var image_link = "https://image.tmdb.org/t/p/";
    // var cache = {};
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
                    // titles = [];
                    // for (var i = 0; i < 10; i++){
                    //     titles.push(data.results[i].title);
                    // }
                    // console.log(titles)
                    // response (titles);
                    return
                }, "json")
        },
        // select: FUNCTION TO RUN ON MOVIE SELECT
    }).data('ui-autocomplete')._renderItem = function(ul, movie) {
        return $( "<li>" )
        .attr( "item.autocomplete", movie )
        .append( "<a>" +movie.title+ " - " +movie.release_date+ "<img src='"+image_link+"w92"+movie.poster_path+"'></a>" )
        .appendTo( ul );
    }
})