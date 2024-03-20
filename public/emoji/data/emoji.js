let body, client

const random = (value, size = 112) => Math.random() * (value - size)

const showEmoji = (width, height, emojiUrl) => {
    const emoji = document.createElement('img')
    emoji.classList.add('fadeIn')
    emoji.style.position = 'absolute'
    emoji.style.left = random(width) + 'px'
    emoji.style.top = random(height) + 'px'

    emoji.src = emojiUrl.split(`?`)[0]
    emoji.onload = () => setTimeout(() => {
        emoji.classList.add('fadeOut')
        setTimeout(() => emoji.remove(), 998)
    }, 3000)
    emoji.onerror = () => emoji.remove()
    body.appendChild(emoji)
}

const checkError = () => {
    if(client?.readyState === WebSocket.OPEN){
        body.innerHTML = ''
        body.classList.remove('error')
    }else{
        body.innerText = '치지직 도우미가 꺼져있습니다'
        body.classList.add('error')
    }
}

const connect = () => {
    body = document.getElementsByTagName('body')[0]
    if(client?.readyState === WebSocket.OPEN){
        return
    }

    client?.close()
    client = new WebSocket(`ws://${location.host || `127.0.0.1:54321`}/ws`)
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
                showEmoji(rect.width, rect.height, emojiUrl)
            }
        }catch{}
    }
    client.onclose = () => {
        checkError()
        setTimeout(() => connect(), 1000)
    }
}