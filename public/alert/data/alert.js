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
    try{
        new Audio('./data/follow.mp3').play()
    }catch(e){}

    profile.src = data.user?.profileImageUrl || './data/profile_default.png'
    profile.onload = () => setTimeout(() => {
        document.body.classList.add('fadeIn')
        document.body.classList.remove('hidden')
        setTimeout(() => {
            element.classList.add('fadeOut')
            setTimeout(async () => {
                document.body.classList = []
                document.body.classList.add('hidden')
    
                await new Promise(res => setTimeout(res, 500))
                alertQueue.splice(alertQueue.indexOf(data), 1)
                if(alertQueue.length > 0){
                    showAlert(alertQueue[0])
                }
            }, 995)
        }, 4000)
    }, 0)
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
    console.log('readyState', client?.readyState)
    if(client?.readyState === WebSocket.OPEN){
        document.body.classList.add('hidden')
        document.getElementById('error').classList.add('hidden')
        document.getElementById('img').classList.remove('hidden')
        document.getElementById('text').classList.remove('hidden')
    }else{
        document.body.classList.remove('hidden')
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