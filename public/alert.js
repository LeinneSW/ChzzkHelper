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
        new Audio('./follow.mp3').play()
    }catch(e){
        console.log(e)
    }

    profile.src = data.user?.profileImageUrl || './profile_default.png'
    profile.onload = () => {
        const element = document.getElementsByTagName('body')[0]
        element.classList.add('fadeIn')
        element.style = ''
    
        setTimeout(() => {
            element.classList.add('fadeOut')
            setTimeout(async () => {
                element.classList = []
                element.style = 'visibility: hidden'
    
                await new Promise(res => setTimeout(res, 500))
                alertQueue.splice(alertQueue.indexOf(data), 1)
                if(alertQueue.length > 0){
                    showAlert(alertQueue[0])
                }
            }, 995)
        }, 4000)
    }
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

let client
const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return
    }

    client?.close()
    client = new WebSocket(`ws://${location.host || `127.0.0.1:54321`}/ws`)
    client.onopen = () => client.send('ALERT')
    client.onmessage = (e) => {
        try{
            const data = JSON.parse(e.data.toString())
            addAlertData(data)
        }catch{}
    }
    client.onclose = () => setTimeout(() => connect(), 1000)
}