const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const easeOutExpo = (x) => 1 - Math.pow(2, -10 * x)

const showAlertModal = (title, message) => {
    document.getElementById('alertTitle').innerText = title
    document.getElementById('modalContext').innerText = message
    new bootstrap.Modal(document.getElementById('alertModal')).show()
}

const testAdd = () => {
    const list = document.getElementById('user-list')
    const data = [
        "레이누",
        "라링",
        "BBQ1호점",
        "삥삥이지유",
        "점프마스터흥이",
        "쓰리스트",
        "에피메라",
        "버섯인데요",
        "최종병기드라군",
        "시티",
    ]
    for(const name of data){
        const div = document.createElement('div')
        div.className = 'user'
        div.innerHTML = name
        list.appendChild(div)
    }
}

const createRouletteData = (data) => {
    let field = document.getElementById('roll-field')
    if(!field){
        field = document.createElement('div')
        field.id = `roll-field`
        document.getElementById('modalContext').appendChild(field)
    }

    while(field.firstChild){
        field.removeChild(field.firstChild)
    }
    let currentIndex = Math.floor(Math.random() * data.length)
    for(let i = 0; i < data.length; ++i){
        const div = document.createElement('div')
        div.classList.add('roll-item', 'p-2')
        div.innerText = data[currentIndex++]
        if(data.length <= currentIndex){
            currentIndex = 0
        }
        field.appendChild(div)
    }
    field.appendChild(field.children[0].cloneNode(true))
}

const startRoulette = (users) => {
    const data = []
    for(const element of users){
        data.push(element.innerText)
    }
    createRouletteData(data)

    let time = 0;
    const field = document.getElementById('roll-field')
    field.classList.add('roll');
    const interval = setInterval(() => {
        const y = ((easeOutExpo(time += 0.001) * 1000) % 100) * data.length * -1;
        field.style.setProperty('--y', `${y}%`);
        if(time > 0.999){
            field.scrollTop = field.scrollHeight * y / (Math.round(y / 100) * 100)
            clearInterval(interval)
            field.scrollTo({
                top: field.scrollHeight,
                behavior: 'smooth'
            })
            field.children[data.length].style.transition = `all .5s ease`
            setTimeout(() => field.children[data.length].style.transform = 'scale(1.4)', 40)
        }
    }, 1);
}

const selectRandomUser = async () => {
    const users = document.getElementById('user-list').children
    if(!users || users.length < 2){
        showAlertModal('인원 부족', '추첨은 최소 2명 이상부터 가능합니다.')
        return
    }
    showAlertModal('추첨', ``)
    await new Promise((res, _) => setTimeout(res, 250))
    startRoulette(users)
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