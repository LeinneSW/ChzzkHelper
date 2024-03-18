const convertSongDataToHTML = (songData) => {
    const name = songData.name; // 곡 이름
    const composer = songData.composer; // 곡 작곡가
    const category = name === 'Alone' && songData.category === 'R' ? composer : songData.category; // 곡 카테고리

    // message 변수를 수정하여 어떤식으로 출력될지 결정
    message = `${name}`;
    if(songData.difficulty){ // 난이도 정보(미기입하는경우 없을 수 있음)
        const level = songData.difficulty.level; // DJMAX 레벨
        const floor = songData.difficulty.floor; // v-archive 레벨
        const button = songData.difficulty.button; // 버튼
        const pattern = songData.difficulty.pattern; // 곡 난이도
        message += ` ${button}${pattern}(${floor || level})`;
    }
    return message + ` <span class='dlc'>[${category}]</span>`
}

const handleMessage = (e) => {
    let requestSongList = [];
    try{
        requestSongList = JSON.parse(e.data); // SongData[]
    }catch{}

    if(requestSongList.length < 1){
        title.style = parentElement.style = 'display: none !important';
        return;
    }else{
        title.style = parentElement.style = '';
    }

    let result = '';
    for(const index in requestSongList){
        const songData = requestSongList[index];
        result += `<div class="song" onclick="client.send('${index}')">` + 
            `${+index + 1}.&nbsp;` +
            `<marquee id='mar${index}' behavior='alternate' scrollamount='0'>` + 
                `<span id='span${index}'>${convertSongDataToHTML(songData)}</span>` + 
            `</marquee>` +
        `</div>`;
    }
    songList.innerHTML = result;
    
    for(const index in requestSongList){
        const span = document.getElementById(`span${index}`)
        const marquee = document.getElementById(`mar${index}`)
        console.log(`${+index + 1}. span: ${span.offsetWidth}, marquee: ${marquee.clientWidth}`)

        const diff = span.offsetWidth - marquee.clientWidth - 10;
        if(diff < 1){
            continue;
        }

        let scrollamount = 6;
        switch(true){
            case diff < 8:
                scrollamount = 1;
                break;
            case diff < 16:
                scrollamount = 2;
                break;
            case diff < 24:
                scrollamount = 3;
                break;
            case diff < 32:
                scrollamount = 4;
                break;
        }
        console.log((+index + 1) + ' ' + scrollamount)
        marquee.setAttribute('scrollamount', scrollamount);
    }
}