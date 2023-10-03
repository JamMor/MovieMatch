import { ListModalItem, PaginatorPages } from "/static/js/DOMelements.js";
import { movieList } from "./movie_lists.js";
import { ajaxErrorHandler } from "/static/js/ajaxErrorHandler.js";

const $savedListModal = $("#saved-lists-modal");
const $addFromListBtn = $("#add-from-list");
const $listContainer = $("#list-container");
const $listPages = $("#list-pages");
const selectedRowClass = "selected";
const selectListBtnClass = "select-list";
const selectedListIcon = "playlist_add_check";
const unselectedListIcon = "playlist_add";
const pageLinkClass = "list-page"

const getListIdFromBtnDomId = (domId) => domId.split("_")[1];
const getBtnDomIdFromListId = (listId) => `select_${listId}`;
const getRowDomIdFromListId = (listId) => `row_${listId}`;


let selectedLists = [];
let sortOrder = {
    "field" : "updated-at",
    "direction" : "desc",
}

function addToList(listId) {
    $.get(urlPath.getList(listId))
        .done(function (response) {
            if (response.status == "success") {
                movieList.bulkAddMoviesToList(...response.data.movies);
                addToListStatusToast("success", response.data.list_name);
            }
            else {
                ajaxErrorHandler(response);
                addToListStatusToast("error");
            }
        })
        .fail(function () {
            console.error("Request failure: get list data");
            addToListStatusToast("fail");
        });
}

function addToListStatusToast(status, listName = "") {
    const statusMessages = {
        "success": `Added <strong class="cyan-text text-accent-2">${listName}</strong> to list.`,
        "error": `<strong class="orange-text text-darken-3">Failed</strong> to add to list.`,
        "fail": `<strong class="orange-text text-darken-3">Request failure.</strong>.`,
        "unknown": `<strong class="orange-text text-darken-3">Unknown error.</strong>.`
    }

    const message = statusMessages[status] || statusMessages["unknown"]

    M.toast({ html: `<span>${message}</span>` })
}

function selectList(listId){
    const $listBtn = $(`#${getBtnDomIdFromListId(listId)}`);
    const $listRow = $(`#${getRowDomIdFromListId(listId)}`);
    
    if (selectedLists.includes(listId)){
        return false;
    }
    else {
        selectedLists.push(listId);
        $listRow.addClass(selectedRowClass);
        $listBtn.children("i").text(selectedListIcon);
        return true;
    }
}

function updateListModal(data){
    // Replace list items with data
    $listContainer.empty();
    data.lists.forEach(list => {
        const { list_id, list_name, movies } = list;
        const selected = selectedLists.includes(list_id);
        $listContainer.append(ListModalItem(list_id, list_name, movies, selected));
        $listContainer.find(`a.${selectListBtnClass}`).click(function(e){
            e.stopPropagation();
            const listDomId = $(this).attr("id")
            const listId = getListIdFromBtnDomId(listDomId);
            selectList(listId);
            addToList(listId);
        })
    });

    // Update pagination
    const { field, direction } = sortOrder;
    $listPages.empty();
    $listPages.append(PaginatorPages(data.page_number, field, direction, data.total_count, data.items_per_page));
}

function getLists(pageNumber){
    const { field, direction } = sortOrder;
    $.get(urlPath.getListsOverview(pageNumber, field, direction))
        .done(function(response) {
            if (response.status == "success"){
                updateListModal(response.data);
            }
            else {
                ajaxErrorHandler(response);
                getListsStatusToast("error");
            }
        })
        .fail(function() {
            console.error("Request failure: get lists overview.");
            getListsStatusToast("fail");
        });
}

function getListsStatusToast(status) {
    const statusMessages = {
        "error": `<strong class="orange-text text-darken-3">Failed</strong> to retrieve lists.`,
        "fail": `<strong class="orange-text text-darken-3">Request failure.</strong>.`,
        "unknown": `<strong class="orange-text text-darken-3">Unknown error.</strong>.`
    }

    const message = statusMessages[status] || statusMessages["unknown"]

    M.toast({ html: `<span>${message}</span>` })
}

const init = () => {
    $('.collapsible').collapsible();

    $addFromListBtn.tooltip({
        position: "left",
        html: `<span>Add from saved list...</span>`
    });

    // // Handler clashing with materialize. Propagation not being stopped 
    // // before materialize triggers collapsible.
    // $listContainer.on("click", `a.${selectListBtnClass}`, function(e){
    //     e.stopPropagation();
    //     const listDomId = $(this).attr("id")
    //     const listId = getListIdFromBtnDomId(listDomId);
    //     selectList(listId);
    //     addToList(listId);
    // })

    $addFromListBtn.click(function () {
        selectedLists = [];
        getLists();
    })

    // Handler for pagination links
    $savedListModal.on("click", `a.${pageLinkClass}`, function(e){
        e.preventDefault();
        if ($(this).parent().hasClass("active")){
            return;
        }
        const targetUrl = $(this).attr("href")
        if (targetUrl == "#!"){
            return;
        }
        const queryString = new URLSearchParams(targetUrl.split("?")[1])
        const pageNumber = queryString.get("page");
        getLists(pageNumber);
    })
}

export { init, sortOrder, getLists }