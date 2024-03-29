let client
let sizeSlider, timeSlider, effectTypeBox

const random = (value) => Math.random() * (value - sizeSlider.value)

const showEmoji = (width, height, emojiUrl) => {
    const emoji = document.createElement('img')
    emoji.src = emojiUrl
    emoji.style.width = sizeSlider.value + 'px'
    emoji.style.height = sizeSlider.value + 'px'
            
    emoji.style.position = 'absolute'
    emoji.style.left = random(width) + 'px'
    emoji.style.top = random(height) + 'px'

    switch(effectTypeBox.value){
        case 'fade':{
            emoji.style.opacity = '0';
            emoji.style.transition = 'opacity 1s ease'

            emoji.onload = () => setTimeout(() => {
                emoji.style.opacity = '1';
                setTimeout(() => {
                    emoji.style.opacity = '0';
                    setTimeout(() => emoji.remove(), 1000)
                }, timeSlider.value * 1000)
            }, 0)
            break;
        }
        case 'zoom':{
            emoji.style.transform = 'scale(0)'
            emoji.style.transition = 'transform .6s ease'

            emoji.onload = () => setTimeout(() => {
                emoji.style.transform = 'scale(1)'
                setTimeout(() => {
                    emoji.style.transform = 'scale(0)'
                    setTimeout(() => emoji.remove(), 600)
                }, timeSlider.value * 1000);
            }, 0)
            break;
        }
    }
    emoji.onerror = () => emoji.remove()
    document.body.appendChild(emoji)
}

const checkError = () => {
    if(client?.readyState === WebSocket.OPEN){
        document.body.children[0].innerText = ''
        document.body.classList.remove('error')
    }else{
        document.body.children[0].innerText = '치지직 도우미가 꺼져있습니다'
        document.body.classList.add('error')
    }
}

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return
    }

    client?.close()
    client = new WebSocket(`ws://${window.localStorage.getItem('wsURL') || location.host || '127.0.0.1:54321'}/ws`)
    client.onopen = () => {
        checkError()
        client.send('SHOW_EMOJI')
    }
    client.onmessage = (e) => {
        try{
            const data = JSON.parse(e.data.toString())
            const emojiReg = data.message.match(/{:[\w]*:}/g)
            if(!emojiReg){
                console.log('data.message', data.message)
                console.log('data.emojiList', data.emojiList)
                return
            }
            console.log('emojiText', emojiReg)

            const rect = document.getElementsByTagName('body')[0].getBoundingClientRect()
            for(let i = 0; i < emojiReg.length; ++i){
                const emojiName = emojiReg[i].substring(2, emojiReg[i].length - 2)
                const emojiUrl = data.emojiList[emojiName]
                showEmoji(rect.width, rect.height, emojiUrl.split(`?`)[0])
            }
        }catch{}
    }
    client.onclose = () => {
        checkError()
        setTimeout(() => connect(), 1000)
    }
}

const init = () => {
    sizeSlider = document.getElementById('sizeSlider')
    timeSlider = document.getElementById('timeSlider')
    effectTypeBox = document.getElementById('effectTypeBox')

    const settings = document.getElementById('settings')
    document.body.addEventListener('mouseenter', () => settings.classList.add('show'))
    document.body.addEventListener('mouseleave', () => settings.classList.remove('show'))

    const sizeSliderValue = document.getElementById('sizeSliderValue')
    sizeSlider.value = localStorage.getItem('imgSize') || 150
    sizeSliderValue.textContent = sizeSlider.value + 'px'
    sizeSlider.addEventListener('input', () => {
        sizeSliderValue.textContent = sizeSlider.value + 'px';
        localStorage.setItem('imgSize', sizeSlider.value);
    })

    const timeSliderValue = document.getElementById('timeSliderValue')
    timeSlider.value = localStorage.getItem('remainTime') || 3
    timeSliderValue.textContent = timeSlider.value + '초'
    timeSlider.addEventListener('input', () => {
        timeSliderValue.textContent = timeSlider.value + '초';
        localStorage.setItem('remainTime', timeSlider.value);
    })

    effectTypeBox.value = localStorage.getItem('effectType') || 'fade'
    effectTypeBox.addEventListener('input', () => {
        localStorage.setItem('effectType', effectTypeBox.value)
    })
    connect()
}