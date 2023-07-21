const share_list_prefix = "shared";

const MovieListManager = {
    
    //Adds new movies into DOM when a shared list is updated.
    syncMovieList : (current_list, new_list) => {
        let added_movie_list;
        if (current_list.length > 0){
            // Filter movies from updated list that aren't already in old list
            //FLAG maybe just compare sets of ID's
            added_movie_list = new_list
                .filter(new_movie => !current_list
                    .some(current_movie => (current_movie.tmdb_id == new_movie.tmdb_id)))
        }
        //If no movies in list yet, all are to be added
        else {added_movie_list = new_list}
        
        added_movie_list.forEach((movie) => {
            $("#movie_list")
                .append(
                    construct.MovieCard(share_list_prefix, movie.tmdb_id, movie, ["remove", "info"])
                );
        })

        
        console.log("Updated Movie List.")

        //Confirming DOM and movie list are in sync FLAG
        let dom_tmdb_ids = $('#movie_list div').map(function() {
            return this.id.split("_")[1];
            })
            .get()
        let new_tmdb_ids = new Set(new_list.map(x => x.shared_tmdb_id))
        let list_verified = false;
        if(dom_tmdb_ids.length == new_list.length){
            for(let id of dom_tmdb_ids){
                if(!new_tmdb_ids.has(id)){
                    break;
                }
            }
            list_verified = true;
        }
        console.log(`DOM and movie_list are${list_verified ? "" : " NOT"} in sync.`)

    }
}

const UserListManager = {
    //Adds user to DOM
    addUserToDom : (uuid, user) => {
        const { nickname, position } = user;
        //Other users are fuschia, this user is blue
        const color = user_uuid == uuid ? "neon-blue" : "neon-fuschia"
        
        const userContainer = $('#user_list')
        let insertBeforePosition = userContainer.children().length

        userContainer.children().each(function(index){
            let element_position = parseInt($(this).data('position'))
            if (element_position > position){
                insertBeforePosition = index
                return false
            }
        })
        const userDomHTML = `<div id='user_${uuid}' class="chip ${color} inactive" data-position="${position}">
            ${nickname}
        </div>`
        if (insertBeforePosition < userContainer.children().length){
            userContainer.children().eq(insertBeforePosition).before(userDomHTML);
        }
        else {
            userContainer.append(userDomHTML);
        }
    },

    //Removes user from DOM
    removeUserFromDom : (uuid) => {
        $(`#user_${uuid}`).remove()
    },

    //Reorders users in DOM based on the current user dict and a list of the uuids to reorder
    reorderUsersInDom : (uuids, user_list) => {
        
        // Get current user elements
        const userContainer = $('#user_list')
        const userElements = userContainer.children()

        // Get sorted list of uuids
        const sortedUUIDs = uuids.sort((a, b) => user_list[a].position - user_list[b].position)

        // Insertion sort user elements and update data-position
        userElements.each(function(elementIndex){
            const elementUUID = $(this).attr('id').split("_")[1]
            $(this).data('position', user_list[elementUUID].position)
            const newIndex = sortedUUIDs.indexOf(elementUUID)
            if (newIndex != elementIndex){
                $(this).insertBefore(userElements.eq(newIndex))
            }
        })
    },
    //Syncs the DOM with changes from the old user list to the new one
    syncUserList : (old_list, updated_list) => {
        let old_uuids = new Set(Object.keys(old_list))
        let added_uuid_list = new Set();
        let deleted_uuid_list = new Set();
        let updated_uuids = new Set(Object.keys(updated_list));
        let existing_uuid_list = [];

        if (old_uuids.size > 0){
            added_uuid_list = new Set(updated_uuids)
            deleted_uuid_list = new Set()
        
            // Get differences in user lists
            for (let old_uuid of old_uuids){
                if (added_uuid_list.has(old_uuid)){
                    added_uuid_list.delete(old_uuid)
                    existing_uuid_list.push(old_uuid)
                }
                else {
                    deleted_uuid_list.add(old_uuid)
                }
            }
        }
        else {
            added_uuid_list = updated_uuids
        }

        // Remove deleted users from DOM
        for (let deleted_uuid of deleted_uuid_list){
            UserListManager.removeUserFromDom(deleted_uuid);
        }

        // Run reorder function if any users have changed position
        for (let this_uuid of existing_uuid_list){
            if (old_list[this_uuid].position != updated_list[this_uuid].position){
                UserListManager.reorderUsersInDom(existing_uuid_list, updated_list)
                break
            }
        }

        // Add new users to DOM
        for (let added_uuid of added_uuid_list){
            UserListManager.addUserToDom(added_uuid, updated_list[added_uuid]);
        }
        
        console.log("Updated User List.")

        //Confirming DOM and user list are in sync FLAG
        let dom_uuids = $('#user_list div').map(function() {
            return this.id.split("_")[1];
            })
            .get()
        let list_verified = false;
        if(dom_uuids.length == updated_uuids.size){
            for(let uuid of dom_uuids){
                if(!updated_uuids.has(uuid)){
                    break;
                }
            }
            list_verified = true;
        }
        console.log(`DOM and user_list are${list_verified ? "" : " NOT"} in sync.`)
    }
}

export { MovieListManager, UserListManager }