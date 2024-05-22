let client;

const isNumeric = (data) => typeof data === 'number' && !isNaN(data) && isFinite(data);

const getRequestUrl = () => window.localStorage.getItem('wsURL') || location.host || '127.0.0.1:54321'

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return
    }

    client?.close();
    client = new WebSocket(`ws://${getRequestUrl()}/ws`);
    client.onopen = () => client.send('FOLLOW_GOAL');
    client.onmessage = (e) => {
        const countDiv = document.getElementById('follower-count');
        const background = document.getElementById('follower-progress-bar');
        if(!background || !countDiv){
            return;
        }

        try{
            const followCount = parseInt(e.data.toString());
            if(!isNaN(followCount) && isFinite(followCount)){
                const goalCount = Math.floor(+(localStorage.getItem('followerGoalCount') || 150));
                if(!isNumeric(goalCount) || goalCount < 1){
                    background.style.width = '100%';
                    return;
                }else{
                    background.style.width = Math.ceil(followCount / goalCount * 100) + '%';
                }
                countDiv.innerText = `${followCount}/${goalCount} 팔로워`;
            }
        }catch{}
    }
    client.onclose = () => setTimeout(connect, 1000);
}
window.onload = connect;