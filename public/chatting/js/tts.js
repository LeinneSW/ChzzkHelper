let korVoice
const playList = [] // Audio[]

const changeTTSEngine = () => {
    let url
    while(true){
        url = prompt('TTS 엔진 주소를 작성해주세요', url)
        if(url === null){
            return
        }else if(url.startsWith('http') && url.includes('${text}')){
            break
        }else if(url === ''){
            localStorage.removeItem('ttsURL')
            return
        }
        alert('올바른 URL 형식이 아니거나 ${text} 파라미터가 없습니다.')
    }
    localStorage.setItem('ttsURL', url)
}

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

const addTTS = async (nickname, text) => {
    if(localStorage.getItem('tts') === '0' || nickname.match(/^.*(봇|bot)$/i)){ // TODO: tts expection
        return
    }
    
    const repeatData = findRepeatedText(text)
    if(repeatData){
        const {substring, count} = repeatData
        text = substring.repeat(substring.length < 3 ? Math.min(count, 8) : 3)
    }

    const url = localStorage.getItem('ttsURL') || ''
    if(url.includes('${text}')){
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
        return
    }

    const findKrVoice = () => {
        const voiceList = window.speechSynthesis.getVoices()
        for(const voice of voiceList){
            if(!['ko-KR', 'ko_KR'].includes(voice.lang)){
                continue
            }

            if(voice.name.includes('Google')){
                korVoice = voice
                break;
            }else if(!korVoice){
                korVoice = voice
            }
        }
    }
    for(let i = 0; !korVoice && i < 3; ++i){
        findKrVoice()
        await new Promise((res, _) => setTimeout(res, 500))
    }

    if(korVoice){
        const sound = new SpeechSynthesisUtterance(text);
        sound.lang = 'ko-KR';
        sound.voice = korVoice;
        //utterThis.rate = 1; // rate : speech 속도 조절 (기본값 1 / 조절 0.1 ~ 10 -> 숫자가 클수록 속도가 빠름)
        window.speechSynthesis.speak(sound);
    }
}