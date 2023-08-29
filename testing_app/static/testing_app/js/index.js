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

});