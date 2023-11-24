import { movieList, userList } from "./movie_lists.js";
import { DetailedMovie } from "/static/js/shared/constructors.js";
import { MovieInfoModal } from "/static/js/shared/DOMelements.js";
import { scrollHorizontallyTo } from "/static/js/shared/slider.js";
import { escapeHtml } from "/static/js/shared/htmlEscaping.js";

//These are the functions that are called when a succesful socket command is 
// received from the server

const finalModalId = "final_modal";

const $statusBtn = $("#status-btn");
const $finalModal = $("#final_modal");

// Eliminate Movie
function commandEliminate(commandData) {
    const { shared_movie_id, eliminating_uuid, next_eliminating_uuid = null } = commandData

    const eliminated_movie = movieList.eliminateMovieBySharedId(shared_movie_id);

    let toastClass = "purple-text text-accent-2"
    let nickname = userList.getUserByUuidFlat(eliminating_uuid)['nickname']
    if (eliminating_uuid == user_uuid) {
        toastClass = "cyan-text text-accent-2"
        nickname = "YOU"
    }
    const toastHtml = `<span><strong class="${toastClass}">${escapeHtml(nickname)} </strong>&nbsp;eliminated&nbsp;<strong class="orange-text text-darken-3"> ${eliminated_movie.title}</strong></span>`
    M.toast({ html: toastHtml })

    if (commandData.hasOwnProperty("updated_positions")) {
        userList.syncLists(commandData.updated_positions);
    }

    if (next_eliminating_uuid != null) {
        setUserTurn(next_eliminating_uuid);
    }

    if (commandData.hasOwnProperty('final_shared_movie_id')) {
        commandFinalized(commandData.final_shared_movie_id);
    }
}

// Final Movie
function commandFinalized(finalSharedId = null) {
    let finalMovie;
    // If ID given, find the movie via ID
    if (finalSharedId !== null) {
        finalMovie = movieList.getMovieBySharedId(finalSharedId);
    }
    // If no ID, find the movie that is not eliminated
    else {
        finalMovie = movieList.getFinalMovie();
    }
    console.log(`${finalMovie.title} is the final choice!`)

    getMoreMovieInfo(finalMovie.tmdb_id)
        .done(returnInfo => {
            console.log(returnInfo)
            const finalMovieInfo = new DetailedMovie(returnInfo ?? finalMovie)
            openMoreInfoModal(finalMovieInfo, finalModalId)
        })
        .fail(function () {
            console.error("Request failure: get more movie info");
            M.toast({ html: `<span><strong class="orange-text text-darken-3">Request failure.</strong></span>` })
        })

    setUserTurn(null);
    setStatusBar("final");
    elimination_active = false;
    current_eliminating_uuid = null;
}

// Connect User
function commandConnected(commandData) {
    const { uuid: connected_uuid, nickname, position } = commandData
    console.log("Connected User: " + connected_uuid);
    const added = userList.addUserToListFlat({ "uuid": connected_uuid, "position": position, "nickname": nickname });
    if (added && connected_uuid != user_uuid) {
        const toastHtml = `<span><strong class="purple-text text-accent-2">${escapeHtml(nickname)} </strong>&nbsp;has connected.</span>`
        M.toast({ html: toastHtml })
    }
}

// Disconnect User
function commandDisconnected(commandData) {
    if (commandData.hasOwnProperty("updated_positions")) {
        userList.syncLists(commandData.updated_positions);
    }
    if (commandData.hasOwnProperty("next_eliminating_uuid")) {
        setUserTurn(commandData.next_eliminating_uuid)
    }

    const disconnected_uuid = commandData.disconnected_uuid;
    console.log('Disconnected UUID: ' + disconnected_uuid)
    const removedUser = userList.removeUserFromListByUuid(disconnected_uuid);
    if (removedUser != null && disconnected_uuid != user_uuid) {
        const toastHtml = `<span><strong class="purple-text text-accent-2">${escapeHtml(removedUser.nickname)} </strong>&nbsp;has disconnected.</span>`
        M.toast({ html: toastHtml })
    }
}

//Initialize/Update Elimination Session
function commandSyncRoom(commandData) {
    const {
        movie_list: received_movie_list,
        active_user_dict: received_user_list,
        is_active,
        eliminating_uuid = null
    } = commandData.elimination_session

    movieList.syncLists(received_movie_list);

    userList.syncLists(received_user_list);

    elimination_active = is_active;

    if (movieList.isFinalSelected()) {
        commandFinalized();
    }
    else if (elimination_active) {
        setStatusBar("eliminating")
    }
    else {
        setStatusBar("start")
    }

    if (eliminating_uuid != null) {
        setUserTurn(eliminating_uuid);
    }
}

// Refreshes Movie List
function commandRefreshMovieList(commandData) {
    userList.clearList();
    movieList.clearList();

    $finalModal.modal('close');

    commandSyncRoom(commandData)
}

// Start Elimination
function commandStartElimination(commandData) {
    const { eliminating_uuid, updated_positions } = commandData;

    userList.syncLists(updated_positions);

    elimination_active = true;

    setStatusBar("eliminating");
    setUserTurn(eliminating_uuid);

}

// Failed Command
function commandFailed(commandData) {
    console.log("Command failed.")
    console.log(responseData)
    if (responseData.hasOwnProperty('errors')) {
        responseData.errors.forEach(error => { console.log(error) }
        )
    }
    return
}

// Private Functions

//Sets status bar
function setStatusBar(status) {
    // Map of status bar text, css, and flanking icons
    const statusMap = {
        "start": {
            "styleClass": "status-start waves-effect waves-light neon-cyan neon-glow neon-hover btn-large btn-rounded",
            "icons": "cast",
            "statusText": "Start Matching"
        },
        "waiting": {
            "styleClass": "status-waiting neon-cyan neon-glow neon-unlit btn-large btn-rounded",
            "icons": "cast",
            "statusText": "Waiting for matching to begin..."
        },
        "eliminating": {
            "styleClass": "status-eliminating neon-cyan neon-glow neon-lit dimmed btn-small btn-rounded",
            "icons": "cast_connected",
            "statusText": "Elimination Activated!"
        },
        "final": {
            "styleClass": "status-final waves-effect waves-light neon-magenta neon-glow neon-lit btn-large btn-rounded",
            "icons": "movie",
            "statusText": "Open final movie info"
        }
    }

    if (!statusMap.hasOwnProperty(status)) {
        status = "start"
    }

    const { styleClass, icons, statusText } = statusMap[status];

    // Edit DOM
    $statusBtn.removeClass().addClass(styleClass);
    $statusBtn.find("i").text(icons);
    $statusBtn.find("span").text(statusText);
}

//Set active user turn
function setUserTurn(turnUUID = null) {
    //Remove any active classes
    userList.deactivateUsers();

    // If no next user, return with no active class set
    if (turnUUID == null) {
        return
    }

    //Set current user turn to true and add active class, then scroll user into view
    current_eliminating_uuid = turnUUID;
    const $activatedUser = userList.activateUser(turnUUID);
    scrollHorizontallyTo($activatedUser.get(0));

    //Toast new user turn
    const eliminatingUser = userList.getUserByUuidFlat(turnUUID);
    const toastName = (turnUUID != user_uuid)
        ? `<strong class="purple-text text-accent-2">${escapeHtml(eliminatingUser.nickname)}</strong>'s`
        : '<strong class="cyan-text text-accent-2">YOUR</strong>'
    const toastHtml = `<span>${toastName}&nbsp;turn.</span>`
    M.toast({ html: toastHtml })

    //Put username in status bar
    const statusText = (turnUUID == user_uuid)
        ? "Waiting on YOUR turn..."
        : `Waiting on ${eliminatingUser.nickname}'s turn...`

    $statusBtn.find("span").text(statusText);
}

function getMoreMovieInfo(movieId) {
    //Ajax for more movie detail w/ watch provider data
    return $.get({
        url: resourcePath.moreMovieInfoUrl(movieId),
        dataType: "json",
    })
}

//Sets a movie-info modal content, initializes, and opens
//Movie Info object from getMoreMovieInfo, and the ID name of the modal element
function openMoreInfoModal(movieInfo, targetModalId) {
    $(`#${targetModalId} div.modal-content`)
        .html(MovieInfoModal(movieInfo))

    $(`#${targetModalId}`).modal({
        inDuration: 1500,
        dismissible: false,
        endingTop: "2%"
    });
    $(`#${targetModalId} .collapsible`).collapsible();
    $(`#${targetModalId} .tooltipped`).tooltip();
    $(`#${targetModalId}`).modal('open');
}

export {
    commandEliminate,
    commandConnected,
    commandDisconnected,
    commandSyncRoom,
    commandRefreshMovieList,
    commandStartElimination,
    commandFinalized
};