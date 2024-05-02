let client, messageProcessCount = 0
const playList = [] // Audio[]

const getRequestUrl = () => window.localStorage.getItem('wsURL') || location.host

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

const addTTS = (nickname, text) => {
    if(localStorage.getItem('tts') === '0' || nickname.match(/^.*(봇|bot)$/i)){ // TODO: tts expection
        return
    }
    
    const repeatData = findRepeatedText(text)
    if(repeatData){
        const {substring, count} = repeatData
        text = substring.repeat(substring.length < 3 ? Math.min(count, 8) : 3)
    }

    const url = localStorage.getItem('ttsURL') || ''
    if(!url.includes('${text}')){
        return
    }

    const sound = new Audio(url.replaceAll('${text}', encodeURIComponent(text)))
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

const addMessageBox = (nickname, message, color = 'white', emojiList = {}, badgeList = []) => {
    const messageBoxDiv = document.createElement('div')
    messageBoxDiv.className = 'messageBox'
    messageBoxDiv.dataset.date = Date.now()
    document.body.appendChild(messageBoxDiv)

    setTimeout(() => messageBoxDiv.style.opacity = '1', 50)

    for(const badgeUrl of badgeList){
        const badgeImg = document.createElement('img')
        badgeImg.src = badgeUrl
        messageBoxDiv.appendChild(badgeImg)
    }

    const userSpan = document.createElement('span')
    userSpan.className = 'nickname'
    userSpan.innerText = nickname
    userSpan.style.color = color
    messageBoxDiv.appendChild(userSpan)

    const messageSpan = document.createElement('span')
    messageSpan.className = 'message'

    message = escapeHTML(message)
    for(const emojiName in emojiList){
        message = message.replaceAll(`{:${emojiName}:}`, `<img src='${emojiList[emojiName]}'>`)
    }
    messageSpan.innerHTML = ` : ${message}`
    messageBoxDiv.appendChild(messageSpan)
}

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return;
    }
    client = new WebSocket(`ws://${getRequestUrl()}/ws`)
    client.onopen = () => client.send(`CHATTING`)
    client.onmessage = e => {
        try{
            const json = JSON.parse(e.data.toString())
            addMessageBox(json.nickname, json.message, json.color, json.emojiList, json.badgeList)
            addTTS(json.nickname, json.message)
        }catch{}
    }
    client.onclose = () => setTimeout(() => connect(), 1000)
}

window.addEventListener('load', () => {
    connect()
    setInterval(() => {
        const current = Date.now()
        const messageRemainSeconds = (localStorage.getItem('messageRemainSeconds') || 0) * 1000
        if(messageRemainSeconds < 1){
            return
        }

        const messageBoxList = document.querySelectorAll(`body > .messageBox`)
        for(const box of messageBoxList){
            if(current - box.dataset.date >= messageRemainSeconds){
                box.style.opacity = '0'
                setTimeout(() => box.remove(), 1000)
            }
        }
    }, 50)
})