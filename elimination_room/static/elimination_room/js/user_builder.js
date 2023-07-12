//Adds user to DOM
function addUserToDom(uuid, user){
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
}

//Removes user from DOM
function removeUserFromDom(uuid){
    $(`#user_${uuid}`).remove()
}

function reorderUsersInDom(uuids, user_list){
    
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
}

//Updates user list and renders in DOM when intialized or share list updated.
function userListBuilder(old_list, updated_list){
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
        removeUserFromDom(deleted_uuid);
    }

    // Run reorder function if any users have changed position
    for (let this_uuid of existing_uuid_list){
        if (old_list[this_uuid].position != updated_list[this_uuid].position){
            reorderUsersInDom(existing_uuid_list, updated_list)
            break
        }
    }

    // Add new users to DOM
    for (let added_uuid of added_uuid_list){
        addUserToDom(added_uuid, updated_list[added_uuid]);
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
};