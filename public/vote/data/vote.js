let client
let voteData = {}
let countVisible = true

const startVote = (event) => {
    if(event.target.disabled){
        return
    }

    const elements = document.querySelectorAll('ol > li > input')
    if(elements.length < 2){
        alert('투표할 항목을 입력해주세요')
        return
    }
    
    event.target.disabled = true
    document.getElementById('endBtn').disabled = false
    document.getElementById('hideBtn').disabled = false

    const last = elements[elements.length - 1]
    last.parentElement.remove()

    delete elements[elements.length - 1]
    updateCount()
}

const endVote = (event) => {
    event.target.disabled = true
    document.getElementById(`hideBtn`).disabled = true
    if(!countVisible){
        countVisible = true
        updateCount()
    }
}

const updateCount = (elements) => {
    if(!document.getElementById('startBtn').disabled){
        return
    }

    elements = elements || document.querySelectorAll('ol > li > span')
    const totalCount = new Array(elements.length).fill(0)
    for(const id in voteData){
        ++totalCount[voteData[id].index]
    }
    for(const index in elements){
        elements[index].innerHTML = (countVisible ? totalCount[index] : '?') + '명'
    }
    document.getElementById('voteCountTitle').innerHTML = `참여자 - ${totalCount.reduce((a, c) => a + c)}명`
}

const changeCountVisibility = (event) => {
    countVisible = !countVisible
    event.target.innerHTML = countVisible ? '숨기기' : '보이기'
    updateCount()
}

const focusEvent = (event) => {
    if(document.getElementById('startBtn').disabled){
        return
    }

    const temp = event.target.value
    if(temp){
        const list = document.querySelectorAll('ol > li > input')
        if(list[list.length - 1] === event.target){
            event.target.value = ''
            const element = event.target.parentElement.cloneNode(true)
            event.target.parentElement.parentElement.appendChild(element)
            event.target.value = temp

            const span = event.target.parentElement.children[1]
            span.innerHTML = 'X'
            span.style = 'cursor: pointer'
            span.onclick = (event) => {event.target.parentElement.remove()}
        }
    }
}

const onVoteInputClick = (event) => {
    event.target.children[0]?.focus()
}

const sendChat = () => {
    const input = document.getElementById(`chatInput`)
    alert('아직 준비중인 기능입니다.')
    input.value = ''
    setTimeout(() => input.focus(), 150)
}

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return
    }

    client?.close()
    client = new WebSocket(`ws://${window.localStorage.getItem('wsURL') || location.host || `127.0.0.1:54321`}/ws`)
    client.onopen = () => client.send('VOTE')
    client.onmessage = (e) => {
        try{
            const data = JSON.parse(e.data.toString())

            const chat = document.createElement('div')
            chat.style = 'margin: 0 20px'
            chat.innerText = data.user.nickname + ' : ' + data.message // TODO: show emoji

            const chatBox = document.getElementById('chatBox')
            chatBox.appendChild(chat)
            chatBox.scrollTop = chatBox.scrollHeight
            
            if(!document.getElementById('startBtn').disabled || document.getElementById('endBtn').disabled){
                return
            }

            if(data.message.startsWith('!투표')){
                const index = parseInt(data.message.split(' ')[1] || '')
                const elements = document.querySelectorAll('ol > li > span')
                if(!isNaN(index) && 0 < index && index <= elements.length){
                    if(!voteData[data.user.userIdHash]){
                        const userDiv = document.createElement('div')
                        userDiv.innerHTML = data.user.nickname
                        userDiv.classList.add('text-center', 'vote-participant')
                        document.getElementById('userList').appendChild(userDiv)
                    }
                    voteData[data.user.userIdHash] = {
                        user: data.user,
                        index: index - 1
                    };
                }else{
                    return
                }
                updateCount(elements)
            }
        }catch(e){
            console.log(e)
        }
    }
    client.onclose = () => setTimeout(() => connect(), 1000)
}