import {Movie} from "/static/js/constructors.js"
import {MovieCard} from "/static/js/DOMelements.js"

function switchIconText() {
    if ($(this).is(":checked")) {
        $("#icons div h6 span").css("visibility", "hidden");
    } else {
        $("#icons div h6 span").css("visibility", "visible");
    }
}

function getHueValues() {
    // get value of neon-cyan css variable
    const neonCyan = $(".neon-cyan").css("--hue");
    const neonPurple = $(".neon-purple").css("--hue");
    const neonOrange = $(".neon-orange").css("--hue");
    return [neonCyan, neonPurple, neonOrange];
}

function setInitInputValues() {
    const hueValues = getHueValues();
    
    $("#cyan-adj").val(hueValues[0]);
    $("#cyan-inp").val(hueValues[0]);
    $("#magenta-adj").val(hueValues[1]);
    $("#magenta-inp").val(hueValues[1]);
    $("#orange-adj").val(hueValues[2]);
    $("#orange-inp").val(hueValues[2]);
}

function setHueValuefromRange() {
    //set the hue value based on which slider is being adjusted
    const rangeId = $(this).attr("id");
    const rangeValue = $(this).val();

    const idMap = {
        "cyan-adj": [".neon-cyan", "#cyan-inp"],
        "magenta-adj": [".neon-purple", "#magenta-inp"],
        "orange-adj": [".neon-orange", "#orange-inp"]
    };

    if (rangeId in idMap) {
        $(idMap[rangeId][0]).css("--hue", rangeValue);
        $(idMap[rangeId][1]).val(rangeValue);
    }
}

function setHueValuefromInput() {
    //set the hue value based on which input is being adjusted
    const inputId = $(this).attr("id");
    const inputValue = $(this).val();

    const idMap = {
        "cyan-inp": [".neon-cyan", "#cyan-adj"],
        "magenta-inp": [".neon-purple", "#magenta-adj"],
        "orange-inp": [".neon-orange", "#orange-adj"]
    };

    if (inputId in idMap) {
        $(idMap[inputId][0]).css("--hue", inputValue);
        $(idMap[inputId][1]).val(inputValue);
    }
}

function cardInit() {
    const movie1 = new Movie({
        "title": "Alien",
        "poster_path": "/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg",
        "release_date": "1979-05-25",
        "overview": "During its return to the earth, commercial spaceship Nostromo intercepts a distress signal from a distant planet. When a three-member team of the crew discovers a chamber containing thousands of eggs on the planet, a creature inside one of the eggs attacks an explorer. The entire crew is unaware of the impending nightmare set to descend upon them when the alien parasite planted inside its unfortunate host is birthed.",
        "tmdb_id": "348"
    });
    const movie2 = new Movie({
        "title": "Aliens",
        "poster_path": "/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg",
        "release_date": "1986-07-18",
        "overview": "When Ripley's lifepod is found by a salvage crew over 50 years later, she finds that terra-formers are on the very planet they found the alien species. When the company sends a family of colonists out to investigate her story—all contact is lost with the planet and colonists. They enlist Ripley and the colonial marines to return and search for answers.",
        "tmdb_id": "679"
    });
    const gridIter = 2;
    $("#card-btns div.bi-col").each(function(index){
        let n=0;
        let customClass = index == 0 ? "" : "custom-style";
        let idSuffix = index == 0 ? "1" : "2";
        for(let i=0; i<gridIter; i++){
            $(this).append(MovieCard(
                `test_${idSuffix}`, 
                `${movie1.tmdb_id}_${n}`,
                movie1,
                ["remove", "info"],
                customClass
            ))
            $(this).append(MovieCard(
                `test_${idSuffix}`, 
                `${movie1.tmdb_id}_${n}`,
                movie2,
                ["add", "info"],
                customClass
            ))
            n++;
        }
    })
    
    let cardCustomBtns = $("#card-btns div.movie-list div.custom-style btn");
    cardCustomBtns.each(function(index){
        $(this).addClass("dimmed");
    })
}

const saveData = JSON.stringify({
    "list_name":"", 
    "tmdb_ids": [679, 348, 8077, 8078]
})
const deleteListId = 99
function testRequest(url, method, data = null) {
    $.ajax({
        url: url,
        method:method,
        data: data
    })
    .done(function(response) {
        console.log(response);
        M.toast({html: response.status})
    })
    .fail(function() {
        console.error( "Failed to send test request.");
        M.toast({html: "Failed to send test request."})
    })
}

$(document).ready(function () {
    setInitInputValues();

    $("#icon-text-switch").click(function () {
        switchIconText.call(this);
    });

    //attach click handlers to all range inputs of forms in #hue-adj div
    $("#hue-adj input[type=range]").click(function () {
        setHueValuefromRange.call(this);
    });

    //attach click handlers to all range inputs of forms in #hue-adj div
    $("#hue-adj input[type=text]").change(function () {
        setHueValuefromInput.call(this);
    });

    cardInit();

    $("#test-requests").on("click", "button", function(){
        console.log("click")
        const domID = $(this).attr("id");
        const idData = domID.split("_");
        const idView = idData[1];
        const method = idData[2];
        let url;
        if (idView == "save"){
            url = urlPath.saveList();
            testRequest(url, method, saveData);
        }
        if (idView == "delete"){
            url = urlPath.deleteList(deleteListId);
            testRequest(url, method);
        }
    })
});