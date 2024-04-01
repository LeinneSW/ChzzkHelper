let client
const alertQueue = []

const makeStrWithPulse = (str = 'undefined') => {
    let html = ''
    for(let i = 0; i < str.length; ++i){
        let charAt = str[i]
        if(charAt === ' '){
            charAt = '&nbsp;'
        }
        html += `<span class='pulse' style='animation-delay: ${i * 0.1}s'>${charAt}</span>`
    }
    return html
}

const showAlert = (data) => {
    const profile = document.getElementById('profile')
    document.getElementById('type').innerHTML = makeStrWithPulse(data.type || '팔로우')
    document.getElementById('nickname').innerHTML = makeStrWithPulse(data.user?.nickname)

    profile.src = data.user?.profileImageUrl || './data/profile_default.png'
    profile.onload = () => setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease'
        document.body.style.opacity = '1'

        setTimeout(() => {
            if(client?.readyState !== WebSocket.OPEN){
                return
            }

            document.body.style.opacity = '0'
            setTimeout(async () => {
                document.body.style.transition = ''
                await new Promise(res => setTimeout(res, 500))
                alertQueue.splice(alertQueue.indexOf(data), 1)
                if(alertQueue.length > 0){
                    showAlert(alertQueue[0])
                }
            }, 1000)
        }, 4000)
    }, 0)
    new Audio('./data/follow.mp3').play()
}
const addAlertData = (data) => {
    if(!data || typeof data !== 'object'){
        return
    }

    alertQueue.push(data)
    if(alertQueue.length === 1){
        showAlert(data)
    }
}

const checkError = () => {
    if(client?.readyState === WebSocket.OPEN){
        document.body.style.opacity = '0'
        document.getElementById('error').classList.add('hidden')
        document.getElementById('img').classList.remove('hidden')
        document.getElementById('text').classList.remove('hidden')
    }else{
        document.body.style.opacity = '1'
        document.getElementById('img').classList.add('hidden')
        document.getElementById('text').classList.add('hidden')
        document.getElementById('error').classList.remove('hidden')
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
        client.send('ALERT')
    }
    client.onmessage = (e) => {
        try{
            const data = JSON.parse(e.data.toString())
            addAlertData(data)
        }catch{}
    }
    client.onclose = () => {
        checkError()
        setTimeout(() => connect(), 1000)
    }
}