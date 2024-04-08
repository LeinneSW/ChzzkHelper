let ttsURL, client, isProcessing = false, messageQueue = []
const playList = [] // Audio[]

const findRepeatedText = (str) => {
    const len = Math.ceil(str.length / 4)
    for(let i = 1; i <= len; ++i){ // 문자열의 길이의 1/4 까지만 확인(4회이상 반복시를 판단하기 위해서임)
        let index = 0, count = 1
        const substring = str.substring(0, i)
        while((index = str.indexOf(substring, index + i)) !== -1){
            ++count;
        }
        if(count > 3 && count * substring.length === str.length){
            return {substring, count};
        }
    }
    return null;
}

const playTTS = (text) => {
    const sound = new Audio(ttsURL.replaceAll('${text}', encodeURIComponent(text)))
    sound.onended = () => {
        playList.splice(playList.indexOf(sound), 1);
        if(playList.length > 0){
            playList[0].play()
        }
    }
    playList.push(sound)
    if(playList.length === 1){
        sound.play()
    }
}

const escapeHTML = (text) => text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const addChat = (nickname, text) => {
    const messageBoxDiv = document.createElement('div')
    messageBoxDiv.className = 'messageBox'
    document.body.appendChild(messageBoxDiv)
    setTimeout(() => messageBoxDiv.style.opacity = '1', 50)

    const userSpan = document.createElement('span')
    userSpan.className = 'nickname'
    userSpan.innerText = nickname
    userSpan.style.color = 'blue'
    messageBoxDiv.appendChild(userSpan)

    const messageSpan = document.createElement('span')
    messageSpan.className = 'message'
    messageSpan.innerHTML = ` : ${escapeHTML(text)}`
    messageBoxDiv.appendChild(messageSpan)
}

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return;
    }
    client = new WebSocket(`ws://${window.localStorage.getItem('wsURL') || location.host || '127.0.0.1:54321'}/ws`)
    client.onopen = () => client.send(`TTS`)
    client.onmessage = e => {
        try{
            messageQueue.push(e.data)
            if(isProcessing){
                return
            }

            isProcessing = true
            const processMessage = () => {
                let delay = 75 // 기본 딜레이 75ms
                if(messageQueue.length >= 50){
                    delay = 0 // 대기 메시지 50개 이상 -> 0ms
                }else if(messageQueue.length >= 10){
                    delay = 10 // 대기 메시지 10개 이상 -> 10ms
                }
                
                setTimeout(() => {
                    if(messageQueue.length === 0){
                        isProcessing = false
                        return
                    }

                    /*
                    interface ChatData{
                        nickname: string,
                        color: string,
                        message: string,
                        emojiList: {[name: string]: string},
                        badgeList: string[]
                    }
                    */
                    const json = JSON.parse(messageQueue.shift())

                    const messageBoxDiv = document.createElement('div')
                    messageBoxDiv.className = 'messageBox'
                    document.body.appendChild(messageBoxDiv)

                    setTimeout(() => messageBoxDiv.style.opacity = '1', 50)

                    for(const badgeUrl of json.badgeList){
                        const badgeImg = document.createElement('img')
                        badgeImg.src = badgeUrl
                        messageBoxDiv.appendChild(badgeImg)
                    }

                    const userSpan = document.createElement('span')
                    userSpan.className = 'nickname'
                    userSpan.innerText = json.nickname
                    userSpan.style.color = json.color
                    messageBoxDiv.appendChild(userSpan)

                    const messageSpan = document.createElement('span')
                    messageSpan.className = 'message'

                    let message = escapeHTML(json.message)
                    for(const emojiName in json.emojiList){
                        message = message.replaceAll(`{:${emojiName}:}`, `<img src='${json.emojiList[emojiName]}'>`)
                    }
                    messageSpan.innerHTML = ` : ${message}`
                    messageBoxDiv.appendChild(messageSpan)
            
                    if(json.nickname.endsWith('봇')){
                        return
                    }

                    const repeatData = findRepeatedText(json.message)
                    if(repeatData){
                        const {substring, count} = repeatData
                        playTTS(substring.repeat(substring.length < 3 ? Math.min(count, 8) : 3))
                    }else{
                        playTTS(json.message)
                    }
                    processMessage()
                }, delay)
            }
            processMessage()
        }catch{}
    }
    client.onclose = () => setTimeout(() => connect(), 1000)
}

window.addEventListener('load', () => {
    const storage = window.localStorage
    ttsURL = storage.getItem('ttsURL')
    while(!ttsURL){
        ttsURL = prompt('사용하실 TTS 엔진 URL을 입력해주세요.')
        !ttsURL || storage.setItem('ttsURL', ttsURL)
    }
    connect()
})