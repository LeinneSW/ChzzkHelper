let client
let voteMap = {}
let countVisible = true
let currentUserListIndex = -1

const getRequestUrl = () => window.localStorage.getItem('wsURL') || location.host || `127.0.0.1:54321`

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
    for(let i = 0; i < elements.length - 1; ++i){
        const input = elements[i]
        input.readOnly = true
        input.style.cursor = 'pointer'

        const span = input.parentElement.children[1]
        span.style.cursor = ''
        span.onclick = () => {}

        const li = input.parentElement
        li.style.cursor = 'pointer'
        li.onclick = () => {
            if(currentUserListIndex === i){
                li.style.outline = ''
                changeUserListIndex(-1)
            }else{
                li.style.outline = '2px solid #000'
                currentUserListIndex === -1 || (document.querySelectorAll(`ol > li`)[currentUserListIndex].style.outline = '')
                changeUserListIndex(i)
            }
        }
    }
    updateVoteCount()
}

const endVote = (event) => {
    event.target.disabled = true
    document.getElementById(`hideBtn`).disabled = true
    if(!countVisible){
        countVisible = true
        updateVoteCount()
    }
}

const updateVoteCount = (elements) => {
    if(!document.getElementById('startBtn').disabled){
        return
    }

    elements = elements || document.querySelectorAll('ol > li > span')
    const totalCount = new Array(elements.length).fill(0)
    for(const id in voteMap){
        ++totalCount[voteMap[id].index]
    }
    for(const index in elements){
        elements[index].innerHTML = (countVisible ? totalCount[index] : '?') + '명'
    }
    document.getElementById('voteUserTotal').innerText = `(총 ${totalCount.reduce((a, c) => a + c)}명)`
}

const changeUserListIndex = (index) => {
    if(currentUserListIndex === index){
        return
    }

    currentUserListIndex = index
    const userList = document.getElementById('userList')
    while(userList.lastChild.id !== 'voteUserListTitle'){
        userList.removeChild(userList.lastChild)
    }

    let current = 0
    for(const userId in voteMap){
        const voteData = voteMap[userId]
        if(voteData.index !== index && index !== -1){
            continue
        }
        ++current
        const element = document.createElement('div')
        element.id = voteData.user.userIdHash
        element.innerText = voteData.user.nickname
        element.classList.add('text-center', 'vote-user')
        userList.appendChild(element)
    }
    document.getElementById('voteUserCurrent').innerText = current + '명'
}

const addVoteUser = (user, index) => {
    if(typeof index !== 'number' || isNaN(index) || !isFinite(index)){
        return
    }

    const elements = document.querySelectorAll('ol > li > span')
    if(0 > index || index > elements.length){
        return
    }

    const before = voteMap[user.userIdHash]
    voteMap[user.userIdHash] = {user, index}
    updateVoteCount(elements)

    if(index !== currentUserListIndex && currentUserListIndex !== -1){
        before && document.getElementById(user.userIdHash)?.remove()
        return
    }

    if(document.getElementById(user.userIdHash)){
        return
    }
    const userDiv = document.createElement('div')
    userDiv.id = user.userIdHash
    userDiv.innerText = user.nickname
    userDiv.classList.add('text-center', 'vote-user')
    document.getElementById('userList').appendChild(userDiv)
    
    const voteCurrent = document.getElementById('voteUserCurrent')
    voteCurrent.innerText = (parseInt(voteCurrent.innerText) + 1) + '명'
}

const changeCountVisibility = (event) => {
    countVisible = !countVisible
    event.target.innerText = countVisible ? '숨기기' : '보이기'
    updateVoteCount()
}

const focusEvent = (event) => {
    if(document.getElementById('startBtn').disabled){
        return
    }

    const temp = event.target.value
    if(!temp){
        return
    }

    const list = document.querySelectorAll('ol > li > input')
    if(list[list.length - 1] === event.target){
        event.target.value = ''
        const element = event.target.parentElement.cloneNode(true)
        event.target.parentElement.parentElement.appendChild(element)
        event.target.value = temp

        const span = event.target.parentElement.children[1]
        span.innerHTML = 'X'
        span.style.cursor = 'pointer'
        span.onclick = (event) => {event.target.parentElement.remove()}
    }
}

const sendChat = () => {
    const input = document.getElementById(`chatInput`)
    fetch(`http://${getRequestUrl()}/req/send_chat`, {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'post',
        body: JSON.stringify({
            message: input.value
        })
    }).then(res => {
        if(res.status !== 200){
            alert('ERROR!')
            return
        }
        input.value = ''
        input.focus()
    })
}

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return
    }

    client?.close()
    client = new WebSocket(`ws://${getRequestUrl()}/ws`)
    client.onopen = () => client.send('VOTE')
    client.onmessage = (e) => {
        try{
            const data = JSON.parse(e.data.toString())

            const chat = document.createElement('div')
            chat.style = 'margin: 0 20px'
            chat.innerText = data.user.nickname + ' : ' + data.message // TODO: show emoji

            const chatBox = document.getElementById('chatBox')
            chatBox.appendChild(chat)
            chatBox.scrollTop = chatBox.scrollHeight // chat auto scroll

            if(
                document.getElementById('startBtn').disabled &&
                !document.getElementById('endBtn').disabled &&
                data.message.startsWith('!투표')
            ){
                addVoteUser(data.user, parseInt(data.message.split(' ')[1] || '') - 1)
            }
        }catch(e){
            console.log(e)
        }
    }
    client.onclose = () => setTimeout(() => connect(), 1000)
}