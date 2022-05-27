document.addEventListener('DOMContentLoaded', function () {
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


    // Attach the handler
    sliders.forEach(slider => {
        slider.addEventListener('mousedown', mouseDownHandler);
        // slider.style.cursor = "grab";
    })
})