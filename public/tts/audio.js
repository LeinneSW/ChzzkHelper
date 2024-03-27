let ttsURL, client
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

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return;
    }
    client = new WebSocket(`ws://${window.localStorage.getItem('wsURL') || location.host || '127.0.0.1:54321'}/ws`)
    client.onopen = () => client.send(`TTS`)
    client.onmessage = e => {
        try{
            const json = JSON.parse(e.data.toString())
            if(json.user.nickname.endsWith('봇')){
                return
            }

            const repeatData = findRepeatedText(json.message)
            if(repeatData){
                const {substring, count} = repeatData
                playTTS(substring.repeat(substring.length < 3 ? Math.min(count, 8) : 3))
            }else{
                playTTS(json.message)
            }
        }catch{}
    }
    client.onclose = () => setTimeout(() => connect(), 1000)
}

function init(){
    const storage = window.localStorage
    ttsURL = storage.getItem('ttsURL')
    while(!ttsURL){
        ttsURL = prompt('사용하실 TTS 엔진 URL을 입력해주세요.')
        !ttsURL || storage.setItem('ttsURL', ttsURL)
    }
    connect()
}