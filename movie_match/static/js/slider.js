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
    const elRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    const computedStyle = getComputedStyle(parent);
    const parentPaddingRight = parseInt(computedStyle.getPropertyValue('padding-right'), 10);
    const parentPaddingLeft = parseInt(computedStyle.getPropertyValue('padding-left'), 10);

    console.log('Padding Right:', parentPaddingRight);
    console.log('Padding Left:', parentPaddingLeft);

    
    // Get the distance (+/-) from the parent's left edge (current scroll position) to the element's left edge
    const leftOffset = elRect.left - (parentRect.left + parentPaddingLeft/2)
    // Get the distance (+/-) from the parent's right edge (current scroll position + width) to the element's right edge
    const rightOffset = elRect.right - (parentRect.right - parentPaddingRight/2)

    // If the element is to the left of the parent's left edge (current scroll position),
    // scroll to the beginning of element
    if (leftOffset < 0) {
        // Get the distance (+/-) from the parent's left edge to the element's left edge and add to the current scroll position
        const leftVal = parent.scrollLeft + leftOffset;
        parent.scrollTo({left:leftVal, top:0, behavior: 'smooth'});
    }

    // If the element is to the right of the rightmost visible area, scroll to the right end of element
    else if (rightOffset > 0) {
        // Get the distance (+/-) from the parent's right edge to the element's right edge and add to the current scroll position
        const rightVal = parent.scrollLeft + rightOffset;
        parent.scrollTo(
            {left: rightVal, top: 0, behavior: 'smooth'}
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