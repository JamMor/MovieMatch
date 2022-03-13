// $(document).ready(function() {

//     //Prepare csrf token to be used outside of template.
//     function getCookie(name) {
//         let cookieValue = null;
//         if (document.cookie && document.cookie !== '') {
//             const cookies = document.cookie.split(';');
//             for (let i = 0; i < cookies.length; i++) {
//                 const cookie = cookies[i].trim();
//                 // Does this cookie string begin with the name we want?
//                 if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                     cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                     break;
//                 }
//             }
//         }
//         return cookieValue;
//     }

//     function csrfSafeMethod(method) {
//         // these HTTP methods do not require CSRF protection
//         return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
//     }
//     $.ajaxSetup({
//         beforeSend: function(xhr, settings) {
//             if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
//                 xhr.setRequestHeader("X-CSRFToken", csrftoken);
//             }
//         }
//     });

//     const csrftoken = getCookie('csrftoken');
//     const api_key = "f4f5f258379baf10796e1d3aeb5add05";
//     const image_link = "https://image.tmdb.org/t/p/";
//     var movie_list = []

//     //First load of all shared list and user data returned from server
//     function intialize_shared_lists (data) {
//         console.log("Data from new list: ",data);
//         window.sharecode = data['sharecode']
//         users = data['users'].split(",");
//         var user_id = 1;
//         for (var each of users){
//             user = each.split('*')
//             $('#shared_users').append("<div id='user_"+user_id+"' class='"+user[0]+"'><p>"+user[1]+ "</p></div>");
//             user_id++;
//         }
//         for (var movie of data['movies']){
//             $('#shared_list').append("<div id='movie_"+movie.movie_id+"' class='list_item shared' style='background-image: url(" + image_link+"w154"+movie.poster_path + ")'><h5>"+movie.title+ " - " +movie.release_date.slice(0,4)+ "</h5></div>");
//         }
//         var chosen = data['chosen'].split(',')
//         for (var i = 1; i<chosen.length; i+=2){
//             if (chosen[i] > 1){
//                 $('#movie_'+chosen[i-1]).addClass("matched");
//             }
//         }
//         startUpdating();
//     }

//     //Sends post request to delete clicked movie from shared list model
//     function deleter(){
//         var delete_me = $(this).attr("id");
//         console.log(delete_me);
//         $.post("delete", JSON.stringify({"to_delete":delete_me, "sharecode":sharecode}), function(data){
//             console.log(data['status'])
//         },"json")
//             .done(function() {
//                 console.log( "Deletion sent!" );
//                 })
//             .fail(function() {
//                 console.log( "Failed to send delete." );
//                 })
//     }

//     //Attach click event handler to parent of shared movies
//     $('#shared_list').on('click', '.list_item', deleter)

//     //Syncs data from server. Add/remove movies. Add new users. Highlight shared movies.
//     function update(){
//         console.log("We updatin yall")
//         var movie_ids = [];
//         $( ".shared" ).each(function() {
//             movie_ids.push(this.id.slice(6));
//         });
//         console.log("Current Movie IDs: ",movie_ids)
//         var user_num = $( "#shared_users div" ).length;
//         console.log("movie IDs: ", movie_ids, ", Users: ",user_num, ", Sharecode: ",sharecode )
//         $.post("update", JSON.stringify({"movie_ids":movie_ids, "user_num":user_num, "sharecode":sharecode}),function (data){
//             console.log("Here's ya changes: ", data)
//             if (data['new_users']) {
//                 user_num++
//                 for (var each_user of data['new_users']) {
//                     $('#shared_users').append("<div id='user_"+user_num+"' class='wait'><p>"+each_user+ "</p></div>");
//                 }
//             }
//             if (data['added']) {
//                 console.log("Movies have been added!")
//                 for (new_movie of data['added']) {
//                     $('#shared_list').append("<div id='movie_"+new_movie.movie_id+"' class='list_item shared' style='background-image: url("+image_link+"w154"+new_movie.poster_path+"'><h5>"+new_movie.title+ " - " +new_movie.release_date.slice(0,4)+ "</h5></div>");
//                 }
//             }
//             if (data['deleted']) {
//                 for (deleted_id of data['deleted']) {
//                     $('#movie_'+deleted_id).fadeOut("slow", function(){
//                         $(this).remove()
//                     })
//                 }
//             }
//         }, "json")
//             .done(function() {
//                 console.log( "Update request completed." );
//                 })
//             .fail(function() {
//                 console.log( "Failed to update." );
//                 })
//     }

//     //Starts a recurring update request to keep the shared list up to date
//     function startUpdating(){
//         setInterval(update,4000)
//     }

//     //Autocomplete that pulls dynamic data from API. Also adds selected elements info to an object to send back to server on upload.
//     $( "#searchbar" ).autocomplete({
//         appendTo: "#searchbox",
//         delay: 500,
//         minLength:2,
//         source: function(request, response) {
//             var search_str = request.term;
//             // if (search_str in cache) {
//             //     response (cache[search_str]);
//             //     return
//             // }
//             $.get("https://api.themoviedb.org/3/search/movie?api_key="+api_key+"&query="+search_str,
//                 function(data){
//                     // cache[search_str] = data;
//                     response( data.results );
//                     return
//                 }, "json")
//         },
//         select: function (event, movie){
//             console.log(movie);
//             if (movie_list.some(each_movie => each_movie.id == movie.item.id)) {
//                 console.log("It's already in here dumdum.")
//             }
//             else {
//                 movie_list.push(movie.item);
//                 $('#user_list').append("<div class='list_item personal' style='background-image: url(" + image_link+"w154"+movie.item.poster_path + ")'><h5>"+movie.item.title+ " - " +movie.item.release_date.slice(0,4)+ "</h5></div>");
//             }
            
//         },
//     }).data('ui-autocomplete')._renderItem = function(ul, movie) {
//         return $( "<li>" )
//         .attr( "item.autocomplete", movie )
//         .append( "<a>" +movie.title+ " - " +movie.release_date+ "<img src='"+image_link+"w92"+movie.poster_path+"'></a>" )
//         .appendTo( ul );
//     }

//     // Shares list
//     $("#share").click(function (){
//         sharecode = $("#sharecode").val();
//         nickname = $("#nickname").val();
//         // console.log("DATA for Django: ", {"sharecode": sharecode, "nickname": nickname, "results": movie_list});
//         $.post("new", JSON.stringify({"sharecode": sharecode, "nickname": nickname, "results": movie_list}), function(data){
//             intialize_shared_lists(data)
//         }
//             ,"json")
//             .done(function() {
//                 console.log( "Ajax successfully sent!" );
//                 })
//             .fail(function() {
//                 console.log( "Failed to send Ajax." );
//                 })
//     })

//     // Button to clear current user list
//     $("#clear").click(function (){
//         movie_list = [];
//         $('#user_list').html("");
//     })
// })