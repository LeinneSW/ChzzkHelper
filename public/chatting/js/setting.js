window.addEventListener('load', () => {
    const settings = document.getElementById('settings')
    console.log(settings)
    document.documentElement.addEventListener('mouseenter', () => settings.classList.add('show'))
    document.documentElement.addEventListener('mouseleave', () => settings.classList.remove('show'))

    const sizeSliderValue = document.getElementById('sizeSliderValue')
    sizeSlider.value = localStorage.getItem('chatFontSize') || 20
    document.documentElement.style.setProperty('--font-size', sizeSliderValue.textContent = sizeSlider.value + 'px')
    sizeSlider.addEventListener('input', () => {
        localStorage.setItem('chatFontSize', sizeSlider.value)
        document.documentElement.style.setProperty('--font-size', sizeSliderValue.textContent = sizeSlider.value + 'px')
    })
})