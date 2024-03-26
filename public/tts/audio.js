let client
let wsURL, ttsURL
const playList = [] // Audio[]

const findRepeatedText = (str) => {
    const len = Math.ceil(str.length / 3)
    for(let i = 1; i <= len; ++i){// 문자열의 길이의 1/3 까지만 확인(4회이상 반복시를 판단하기 위해서임)
        const substring = str.substring(0, i)
        let index = 0, count = 0
        while((index = str.indexOf(substring, index + i)) !== -1){
            ++count;
        }
        console.log(`count: ${count}, substring: ${substring}`)
        if(count > 1 && count * substring.length === len){
            return {substring, count};
        }
    }
    return null;
}

const playTTS = (text) => {
    const sound = new Audio(ttsURL.replaceAll('${text}' ,encodeURIComponent(text)))
    sound.onended = () => {
        console.log('재생완료:', text)
        playList.splice(playList.indexOf(sound), 1);
        if(playList.length > 0){
            playList[0].play()
        }
    }
    playList.push(sound);
    if(playList.length === 1){
        sound.play()
    }
}

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return;
    }
    client = new WebSocket(`ws://${wsURL}/ws`)
    client.onopen = () => client.send(`TTS`)
    client.onmessage = e => {
        try{
            const json = JSON.parse(e.data.toString())
            const repeatData = findRepeatedText(json.message)
            if(repeatData){
                playTTS(repeatData.substring.repeat(repeatData.substring.length === 1 ? Math.min(count, 8) : Math.min(count, 3)))
            }else{
                console.log('실패...')
                playTTS(json.message)
            }
        }catch{}
    }
    client.onclose = () => setTimeout(() => connect(), 1000)
}

function init(){
    const storage = window.localStorage
    wsURL = storage.getItem('wsURL') || '127.0.0.1:54321'

    ttsURL = storage.getItem('ttsURL');
    while(!ttsURL){
        ttsURL = prompt('사용하실 TTS 엔진 URL을 입력해주세요.')
        !ttsURL || storage.setItem('ttsURL', ttsURL)
    }
    connect()
}