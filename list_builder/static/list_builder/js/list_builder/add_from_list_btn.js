import { ListModalItem, PaginatorPages } from "/static/js/DOMelements.js";
import { movieList } from "./movie_lists.js";

const $savedListModal = $("#saved-lists-modal");
const $addFromListBtn = $("#add-from-list");
const $listContainer = $("#list-container");
const $listPages = $("#list-pages");
const selectedRowClass = "selected";
const selectListBtnClass = "select-list";
const selectedListIcon = "playlist_add_check";
const uneselectedListIcon = "playlist_add";
const pageLinkClass = "list-page"
const get$selectListBtns = () => $(`.${selectListBtnClass}`);
const getListIdFromBtnDomId = (domId) => domId.split("_")[1];
const getBtnDomIdFromListId = (listId) => `select_${listId}`;
const getRowDomIdFromListId = (listId) => `row_${listId}`;
const get$iconFromId = (listId) => $(`#${getBtnDomIdFromListId(listId)} > i`);


let selectedLists = [];
let sortOrder = {
    "field" : "updated-at",
    "direction" : "desc",
}

function addToList(listId) {
    $.get(urlPath.getList(listId))
        .done(function (response) {
            console.log(response);
            if (response.status == "success") {
                console.log("success")
                console.log(response.data)
                movieList.bulkAddMoviesToList(...response.data.movies);
            }
            else {
                console.log(response.status)
                console.log(response.errors)
            }
        })
        .fail(function () {
            console.log("Server error");
        });
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
    for (const list_id in data.lists){
        const { list_name, movies } = data.lists[list_id];
        const selected = selectedLists.includes(list_id);
        $listContainer.append(ListModalItem(list_id, list_name, movies, selected));
        $listContainer.find(`a.${selectListBtnClass}`).click(function(e){
            e.stopPropagation();
            const listDomId = $(this).attr("id")
            const listId = getListIdFromBtnDomId(listDomId);
            selectList(listId);
            addToList(listId);
        })
    }

    // Update pagination
    $listPages.empty();
    $listPages.append(PaginatorPages(data.page_number, data.total_count, data.items_per_page));
}

function getLists(pageNumber){
    const { field, direction } = sortOrder;
    $.get(urlPath.getListsOverview(pageNumber, field, direction))
        .done(function(response) {
            console.log(response);
            if (response.status == "success"){
                console.log("success")
                console.log(response.data)
                updateListModal(response.data);
            }
            else {
                console.log(response.status)
                console.log(response.errors)
            }
        })
        .fail(function() {
            console.log("Server error");
        });
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

    $savedListModal.on("click", `a.${pageLinkClass}`, function(e){
        e.preventDefault();
        if ($(this).parent().hasClass("active")){
            return;
        }
        const targetUrl = $(this).attr("href")
        if (targetUrl == "#!"){
            return;
        }
        const pageNumber = targetUrl.split("/").pop();
        getLists(pageNumber);
    })
}

export { init, sortOrder, getLists }