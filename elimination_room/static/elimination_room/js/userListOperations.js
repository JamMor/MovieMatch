import { UserChip } from "/static/js/shared/DOMelements.js";
import { unescapeHtml } from "/static/js/shared/htmlEscaping.js";

class UserList {
    constructor($listDomContainer, selfUUID, users = {}){
        this.$listDomContainer = $listDomContainer;
        this.selfUUID = selfUUID;
        this.users = users;
    }
    prefix = "user";

    activeClass = "neon-lit";
    inactiveClass = "neon-unlit";
    
    isSelf(uuid){
        return uuid == this.selfUUID;
    }

    convertNestedToFlat(userObject){
        const uuid = Object.keys(userObject)[0];
        const {position, nickname} = userObject[uuid];
        return {uuid, position, nickname}
    }

    getUserByUuidFlat(uuid){
        if(this.users.hasOwnProperty(uuid)){
            const user = this.users[uuid];
            user.uuid = uuid;
            return user;
        }
        else{
            console.log(`ERROR: User ${uuid} not found.`)
            return null;
        }
    }

    getChipHtml({uuid,nickname,position}) {
        return UserChip(this.prefix, {uuid,nickname,position}, this.isSelf(uuid))
    }

    get$userChipFromUuid(uuid) {
        return $(`#${this.domIdFromUuid(uuid)}`);
    }

    get$userChips() {
        return this.$listDomContainer.children(".chip");
    }

    deactivateUsers() {
        this.get$userChips().removeClass(this.activeClass).addClass(this.inactiveClass);
    }

    activateUser(uuid) {
        const $activatedUser = this.get$userChipFromUuid(uuid);
        $activatedUser.removeClass(this.inactiveClass).addClass(this.activeClass);
        return $activatedUser;
    }

    uuidFromUserChipDomId(domId) {
        return domId.split("_")[1];
    }

    domIdFromUuid(uuid) {
        return `${this.prefix}_${uuid}`;
    }

    getUuids() {
        return Object.keys(this.users)
    }

    getDomIds() {
        return this.get$userChips().map(function(index, userElement) {
            const $chip = $(userElement);
            return this.uuidFromUserChipDomId($chip.attr('id'));
            })
            .get()
    }

    updateUser({uuid, position, nickname}) {
        let changePosition = false;
        let changeNickname = false;
        const originalUser = this.getUserByUuidFlat(uuid);
        const $userChip = this.get$userChipFromUuid(uuid);
        if (originalUser.position != position){
            originalUser.position = position;
            $userChip.attr('data-position', position);
            changePosition = true;
        }
        if (originalUser.nickname != nickname){
            originalUser.nickname = nickname;
            $userChip.text(nickname);
            changeNickname = true;
        }

        return {"position": changePosition, "nickname": changeNickname}
    }

    addUserToOrderedDOM(chipHtml, position) {
        // Chip must be inserted at the right position
        let $userElements = this.get$userChips();
        // Default to end of list
        let insertBeforeIndex = $userElements.length;

        // Return the index of the first element with a position greater than the new user's position
        // Multiple users can have position 0, so they will be ordered by arrival
        $userElements.each(function(index){
            let elementPosition = parseInt($(this).attr('data-position'));
            if (elementPosition > position){
                insertBeforeIndex = index
                return false
            }
        })

        if (insertBeforeIndex < $userElements.length){
            $userElements.eq(insertBeforeIndex).before(chipHtml);
        }
        else{
            this.$listDomContainer.append(chipHtml);
        }
    }

    addUserToListFlat({uuid,nickname,position}) {
        const user = this.getUserByUuidFlat(uuid);
        if (user != null){
            console.log(`ERROR: User ${uuid} already in list.`)
            return false;
        }
        else{
            this.users[uuid] = {"position": position, "nickname": nickname};
            const chipHtml = this.getChipHtml({uuid,nickname,position});
            this.addUserToOrderedDOM(chipHtml, position);
            console.log(`${nickname} has joined the room. UUID: ${uuid}`)
            return true;
        }
    }

    addUserToListNested(userObject) {
        const flatUser = this.convertNestedToFlat(userObject);
        this.addUserToListFlat(flatUser);
    }

    removeUserFromListByUuid(uuid) {
        const removedUser = this.getUserByUuidFlat(uuid);
        if (removedUser != null){
            delete this.users[uuid];
            this.get$userChipFromUuid(uuid).remove();
            return removedUser;
        }
        else{
            console.log(`ERROR: User ${uuid} not found in list.`)
            return null;
        }
    }

    updateDomOrder(){
        function sortByDataPosition(a, b){
            return parseInt($(a).attr('data-position')) - parseInt($(b).attr('data-position'))
        }
        const $userElements = this.get$userChips();
        $userElements.sort(sortByDataPosition).appendTo(this.$listDomContainer);
    }

    syncLists(newList){
        const currentUuids = new Set(this.getUuids())
        const newUuids = new Set(Object.keys(newList))
        
        //Get the removed users
        const removedUuids = new Set([...currentUuids].filter(oldUuid => !newUuids.has(oldUuid)))
        //Get the added users
        const addedUuids = new Set([...newUuids].filter(newUuid => !currentUuids.has(newUuid)))
        
        //Remove users from list and DOM
        removedUuids.forEach(uuid => this.removeUserFromListByUuid(uuid))

        //Update persisting users with new positions and nicknames
        // FLAG: Fix newList format when server changed
        let needReorder = false;
        this.getUuids().forEach(uuid => {
            const userObj = this.convertNestedToFlat({[uuid]: newList[uuid]})
            const {position} = this.updateUser(userObj)
            if (position == true){
                needReorder = true;
            }
        })
        if (needReorder){
            this.updateDomOrder();
        }

        //Add users to DOM and user_list
        addedUuids.forEach(uuid => this.addUserToListNested({[uuid]: newList[uuid]}))
    }

    clearList() {
        this.users = {};
        this.$listDomContainer.empty();
    }

    verifyUserListDOMSync(){
        const $userElements = this.get$userChips();
        //Confirming DOM and user list are in sync FLAG
        const domUsers = $userElements.map((index, userElement) => {
            const $chip = $(userElement);
            const thisUuid = this.uuidFromUserChipDomId($chip.attr('id'));
            const thisPosition = parseInt($chip.attr('data-position'));
            const thisNickname = unescapeHtml($chip.text().trim());
            return {"uuid": thisUuid, "position": thisPosition, "nickname": thisNickname} ;
            })
            .get()
            
        let errorMessage;
        const errorMessages = {
            "length": "DOM and user list are not the same length.",
            "missing_uuid": "DOM has a user that is not in user list.",
            "position": "Positions not synced.",
            "nickname": "Nicknames not synced."
        }
    
        const sourceLength = this.getUuids().length;
        if(domUsers.length == sourceLength){
            for(let domUser of domUsers){
                const user = this.getUserByUuidFlat(domUser.uuid);
                if(user == null){
                    errorMessage = errorMessages.missing_uuid;
                    break;
                }
                if(user.position != domUser.position){
                    errorMessage = errorMessages.position;
                    break;
                }
                if(user.nickname != domUser.nickname){
                    errorMessage = errorMessages.nickname;
                    break;
                }
            }
        }
        else {
            errorMessage = errorMessages.length
        }
        
        console.log(`DOM and user list are${errorMessage ? " NOT" : ""} in sync.`)
        if (errorMessage){
            console.log(errorMessage)
        }
        
        return !errorMessage;
    }
}

export { UserList }