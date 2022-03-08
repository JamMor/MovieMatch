//Adds user to DOM
function addUserToDom(uuid, user){
    let nickname = user['nickname']
    let is_ready = user['is_ready'] 
        ? "class='user_ready'"
        : ""
    
    if(uuid == user_uuid){
        $('#user_list')
            .prepend(
                `<div id='user_${uuid}' ${is_ready}>\
                <h5>${nickname}</h5>\
                </div>`
                );
    }
    else {
        $('#user_list')
            .append(
                `<div id='user_${uuid}' ${is_ready}>\
                <h5>${nickname}</h5>\
                </div>`
                );
    }
}

//Removes user from DOM
function removeUserFromDom(uuid){
    console.log(`Trying to remove #user_${uuid}`)
    $(`#user_${uuid}`).remove()
}


//Updates user list and renders in DOM
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
