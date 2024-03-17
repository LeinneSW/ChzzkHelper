let client;
let title, parentElement, error, songList;

function init(){
    error = document.getElementById("error");
    title = document.getElementById('title');
    songList = document.getElementById("content");
    parentElement = document.getElementById('radius');

    error.style = title.style = parentElement.style = 'display: none !important';
    connect();
}

function visibleElement(bool){
    if(bool){
        error.style = "display: none !important";
        title.style = parentElement.style = '';
    }else{
        error.style = '';
        title.style = parentElement.style = 'display: none !important';
    }
}

function connect(){
    if(client){
        return;
    }

    client = new WebSocket(`ws://${location.host || `127.0.0.1:54321`}:54321/ws`)
    client.onopen = () => {
        visibleElement(true)
        client.send('REQUEST_SONG');
    }
    client.onclose = () => {
        client = null;
        visibleElement(false);
        setTimeout(() => connect(), 1000);
    }
    client.onmessage = (e) => {
        try{
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
                const data = requestSongList[index];

                // ------------- 건들여야하는 부분 -------------
                const name = data.name; // 곡 이름
                const composer = data.composer; // 곡 작곡가
                const dlcCode = name === 'Alone' ? composer : data.dlcCode; // 곡 DLC 카테고리(NXN, MD 등) Alone만 작곡가로 출력

                // message 변수를 수정하여 어떤식으로 출력될지 결정
                let message = `${name}`;
                if(data.difficulty){ // 난이도 정보(미기입하는경우 없을 수 있음)
                    const level = data.difficulty.level; // DJMAX 레벨
                    const floor = data.difficulty.floor; // v-archive 유저 투표 레벨(없을수도 있음)
                    const button = data.difficulty.button; // 버튼(4, 5, 6, 8)
                    const pattern = data.difficulty.pattern; // 난이도 패턴(NM, HD, MX, SC)
                    message += ` ${button}${pattern}(${floor || level})`;
                }
                message += ` <span class='dlc'>[${dlcCode}]</span>`;
                // ------------- 건들여야하는 부분 -------------
                
                result += `<div class='song' onclick='client.send("{\\"remove\\": ${index}}")'>` + 
                    `${+index + 1}.&nbsp;` +
                    `<marquee id='mar${index}' behavior='alternate' scrollamount='0'>` + 
                        `<span id='span${index}'>${message}</span>` + 
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
        }catch{
            client.close();
        }
    };
}