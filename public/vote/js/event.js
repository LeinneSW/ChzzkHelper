const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const showAlertModal = (title, message) => {
    document.getElementById('alertTitle').innerText = title
    document.getElementById('modalContext').innerText = message
    new bootstrap.Modal(document.getElementById('alertModal')).show()
}

const addVoteItem = (input) => {
    const voteContext = input.value
    if(!voteContext){
        return
    }

    const list = document.querySelectorAll('#vote-item-list > li > input')
    if(list[list.length - 1] === input){
        input.value = ''
        const element = input.parentElement.cloneNode(true)
        input.parentElement.parentElement.appendChild(element)
        input.value = voteContext
        element.children[0].focus()

        const span = input.parentElement.children[1]
        span.innerHTML = 'X'
        span.style.cursor = 'pointer'
        span.onclick = (event) => {event.target.parentElement.remove()}
    }
}

const focusEvent = (event) => {
    if(document.getElementById('startBtn').disabled){
        return
    }
    addVoteItem(event.target)
}

const sendChat = async () => {
    const input = document.getElementById(`chatting-input`)
    try{
        const res = await fetch(`http://${getRequestUrl()}/req/send_chat`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'post',
            body: JSON.stringify({
                message: input.value
            })
        })
        if(res.status === 200){
            input.value = ''
            input.focus()
            return
        }
    }catch{}
    showAlertModal('오류발생', '알 수 없는 오류가 발생했습니다.')
}