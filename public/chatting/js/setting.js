const setInputValue = (input, suffix) => {
    input.nextElementSibling.innerText = input.value + suffix
    const customCss = input.dataset.customCss
    customCss && document.documentElement.style.setProperty(customCss, input.value + 'px')
}

window.addEventListener('load', () => {
    const settings = document.getElementById('settings')
    document.documentElement.addEventListener('mouseenter', () => settings.classList.add('show'))
    document.documentElement.addEventListener('mouseleave', () => settings.classList.remove('show'))

    const sliders = document.querySelectorAll('.slider-container > .slider')
    for(const slider of sliders){
        const saveName = slider.dataset.saveName
        slider.value = (saveName && localStorage.getItem(saveName)) || slider.value
        setInputValue(slider, 'px')
        slider.addEventListener('input', () => {
            setInputValue(slider, 'px')
            const saveName = slider.dataset.saveName
            saveName && localStorage.setItem(saveName, slider.value + '')
        })
    }
})