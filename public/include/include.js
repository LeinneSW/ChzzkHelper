window.addEventListener('load', () => {
    const allElements = document.getElementsByTagName(`*`)
    for(const element of allElements){
        if(!element.dataset.includePath){
            continue
        }
        fetch(element.dataset.includePath).then(async res => {
            element.outerHTML = await res.text()
        })
    }
})