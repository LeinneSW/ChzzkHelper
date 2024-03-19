let client

const random = (value, size = 112) => Math.random() * (value - size)

const showEmoji = (data) => {
    const body = document.getElementsByTagName('body')[0]
    const rect = body.getBoundingClientRect()

    const emojis = data.extras?.emojis || []
    for(const name in emojis){
        const profile = document.createElement('img')
        profile.style.position = 'absolute'
        profile.style.left = random(rect.width) + 'px'
        profile.style.top = random(rect.height) + 'px'

        profile.classList.add('fadeIn')
        profile.src = emojis[name].split(`?`)[0]
        profile.onload = () => setTimeout(() => {
            profile.classList.add('fadeOut')
            setTimeout(() => profile.remove(), 998)
        }, 2000)
        profile.onerror = () => profile.remove()
        body.appendChild(profile)
    }
}

const checkError = () => {
    const body = document.getElementsByTagName('body')[0]
    if(client?.readyState === WebSocket.OPEN){
        body.innerHTML = ''
        body.classList.remove('error')
    }else{
        body.innerText = '치지직 도우미가 꺼져있습니다'
        body.classList.add('error')
    }
}

const connect = () => {
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
            showEmoji(JSON.parse(e.data.toString()))
        }catch{}
    }
    client.onclose = () => {
        checkError()
        setTimeout(() => connect(), 1000)
    }
}