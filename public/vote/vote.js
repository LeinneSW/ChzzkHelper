let client
let voteData = {}
let countVisible = true

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return
    }

    client?.close()
    client = new WebSocket(`ws://${location.host || `127.0.0.1:54321`}/ws`)
    client.onopen = () => client.send('VOTE')
    client.onmessage = (e) => {
        try{
            const data = JSON.parse(e.data.toString())

            const chat = document.createElement('div')
            chat.style = 'margin: 0 20px'
            chat.innerHTML = data.user.nickname + ': ' + data.message
            document.getElementById('chatBox').appendChild(chat)
            
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
                        userDiv.classList.add('text-center')
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
    const last = elements[elements.length - 1]
    last.parentElement.remove()

    document.getElementById
    delete elements[elements.length - 1]
    for(const input of elements){
        input.readOnly = true
        const span = input.parentElement.children[1]
        span.innerHTML = '0명'
        span.onclick = () => {}
    }
}

const endVote = (event) => {
    event.target.disabled = true
    if(!countVisible){
        countVisible = true
        updateCount()
    }
}

const updateCount = (elements) => {
    if(!elements){
        elements = document.querySelectorAll('ol > li > span')
    }
    const totalCount = new Array(elements.length).fill(0)
    for(const id in voteData){
        ++totalCount[voteData[id].index]
    }
    for(const index in elements){
        elements[index].innerHTML = (countVisible ? totalCount[index] : '?')+ '명'
    }
}

const changeCountVisibility = (event) => {
    countVisible = !countVisible
    event.target.innerHTML = countVisible ? '숨기기' : '보이기'
    updateCount()

}

const focusEvent = (event) => {
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
            span.onclick = (event) => {event.target.parentElement.remove()}
        }
    }
}