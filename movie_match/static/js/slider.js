const sliders = document.querySelectorAll('.slider-x');

let pos = { left: 0, x: 0 };
let activeSlider;

const mouseMoveHandler = function (e) {
    // How far the mouse has been moved
    const dx = e.clientX - pos.x;

    // Scroll the element
    activeSlider.scrollLeft = pos.left - dx;
};

const mouseUpHandler = function () {
    // activeSlider.style.cursor = 'grab';
    activeSlider.style.removeProperty('user-select');

    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
};

const mouseDownHandler = function (e) {
    e.preventDefault();
    // this.style.cursor = 'grabbing';
    this.style.userSelect = 'none';

    pos = {
        // Current scroll position
        left: this.scrollLeft,
        // Current mouse position
        x: e.clientX,
    };

    activeSlider = this;

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
};

function scrollHorizontallyTo(element) {
    const parent = element.parentNode;
    // If the element is to the left of the current scroll position, scroll to the beginning of element
    if (parent.scrollLeft > element.offsetLeft) {
        parent.scrollTo({left:element.offsetLeft, top:0, behavior: 'smooth'});
    } 
    // If the element is to the right of the rightmost visible area, scroll to the right end of element
    else if (parent.scrollLeft + parent.offsetWidth < element.offsetLeft + element.offsetWidth) {
        const leftVal = element.offsetLeft + element.offsetWidth - parent.offsetWidth
        parent.scrollTo(
            {left: leftVal, top: 0, behavior: 'smooth'}
        );
    }
}

const init = () => {
    // Attach the handler
    sliders.forEach(slider => {
        slider.addEventListener('mousedown', mouseDownHandler);
        // slider.style.cursor = "grab";
    })
}

export { init, scrollHorizontallyTo }