let client
let sizeSlider, timeSlider, effectTypeBox

const random = (value) => Math.random() * (value - parseInt(document.documentElement.style.getPropertyValue('--emoji-size')))

const showEmoji = (width, height, emojiUrl) => {
    const emoji = document.createElement('img')
    emoji.src = emojiUrl

    emoji.style.position = 'absolute'
    emoji.style.left = random(width) + 'px'
    emoji.style.top = random(height) + 'px'

    switch(localStorage.getItem('effectType')){
        case 'fade':{
            emoji.style.opacity = '0';
            emoji.style.transition = 'opacity 1s ease'
            emoji.onload = () => setTimeout(() => {
                emoji.style.opacity = '1';
                setTimeout(() => {
                    emoji.style.opacity = '0';
                    setTimeout(() => emoji.remove(), 1000)
                }, localStorage.getItem('remainTime') * 1000)
            }, 30)
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
                }, localStorage.getItem('remainTime') * 1000);
            }, 30)
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
            const {width, height} = document.body.getBoundingClientRect()
            for(const emojiName of data.emojiList){
                showEmoji(width, height, data.emojiUrlList[emojiName].split('?')[0])
            }
        }catch{}
    }
    client.onclose = () => {
        checkError()
        setTimeout(() => connect(), 1000)
    }
}
window.addEventListener('load', () => {
    // TODO: 모든 세팅기능은 setting.js 로 이관되어야함
    effectTypeBox = document.getElementById('effectTypeBox')
    effectTypeBox.value = localStorage.getItem('effectType') || 'fade'
    effectTypeBox.addEventListener('input', () => localStorage.setItem('effectType', effectTypeBox.value))
    connect()
})