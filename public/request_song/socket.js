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
    if(client?.readyState === WebSocket.OPEN){
        return
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
    client.onmessage = handleMessage
}