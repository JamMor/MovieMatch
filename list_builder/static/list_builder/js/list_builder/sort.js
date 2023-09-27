import {sortOrder, getLists} from './add_from_list_btn.js'

const $sortContainer = $('#sort-container');
const $sortOptionBtns = $sortContainer.find('a');
const fieldFromDomId = (domId) => domId.split('_')[1];
const domIdFromField = (field) => `sort_${field}`;
const $changeOrderBtn = $('#change-order');

const defaultSortDirection = {
    "updated-at" : "desc",
    "name" : "asc",
    "count" : "desc",
    "created-at" : "desc",
}

function setActiveSortBtn(field){
    $sortOptionBtns.removeClass('active');
    $(`#${domIdFromField(field)}`).addClass('active');
}

function setSortField(field){
    sortOrder.field = field;
    sortOrder.direction = defaultSortDirection[field];

    setActiveSortBtn(field);
}

function setReverseDirection(){
    if (sortOrder.direction == "asc"){
        sortOrder.direction = "desc";
    }
    else {
        sortOrder.direction = "asc";
    }
}

const init = () => {
    $('#sort-btns .dropdown-trigger').dropdown({
        alignment: 'right',
        closeOnClick: true,
        direction: 'up',
    });

    $sortContainer.on('click', 'a', function(e){
        e.preventDefault();
        const field = fieldFromDomId($(this).attr('id'));
        setSortField(field);
        getLists(1);
    });

    $changeOrderBtn.click(function(e){
        e.preventDefault();
        setReverseDirection();
        getLists(1);
    });
    
}

export { init }