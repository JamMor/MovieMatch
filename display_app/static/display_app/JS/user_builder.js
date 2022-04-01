//Adds user to DOM
function addUserToDom(uuid, user){
    let nickname = user['nickname']
    //Other users are fuschia, this user is blue
    let color = user_uuid == uuid ? "neon-blue" : "neon-fuschia"
    let is_users_turn = user['is_users_turn'] 
        ? "active"
        : "inactive"
    
    $('#user_list')
        .append(
            `<div id='user_${uuid}' class="chip ${color} ${is_users_turn}">
                ${nickname}
            </div>`
            );
}

//Removes user from DOM
function removeUserFromDom(uuid){
    console.log(`Trying to remove User ${uuid}`)
    $(`#user_${uuid}`).remove()
}


//Updates user list and renders in DOM when intialized or share list updated.
function userListBuilder(old_list, updated_list){
    let old_uuids = new Set(Object.keys(old_list))
    let added_uuid_list = new Set();
    let deleted_uuid_list = new Set();
    let updated_uuids = new Set(Object.keys(updated_list));

    if (old_uuids.size > 0){
        added_uuid_list = new Set(updated_uuids)
        deleted_uuid_list = new Set()
    
        // Get differences in user lists
        for (let old_uuid of old_uuids){
            if (added_uuid_list.has(old_uuid)){
                added_uuid_list.delete(old_uuid)
            }
            else {
                deleted_uuid_list.add(old_uuid)
            }
        }
    }
    else {
        added_uuid_list = updated_uuids
    }

    for (let deleted_uuid of deleted_uuid_list){
        removeUserFromDom(deleted_uuid);
    }
    for (let added_uuid of added_uuid_list){
        addUserToDom(added_uuid, updated_list[added_uuid]);
    }
    
    console.log("Updated User List.")

    //Confirming DOM and user list are in sync
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