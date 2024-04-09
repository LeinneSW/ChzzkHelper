const easeOutExpo = (x) => 1 - Math.pow(2, -10 * x)

const createRouletteData = (data) => {
    let container = document.getElementById('roulette-container')
    if(!container){
        container = document.createElement('div')
        container.id = `roulette-container`
        document.getElementById('modalContext').appendChild(container)
    }

    while(container.firstChild){
        container.removeChild(container.firstChild)
    }
    let currentIndex = Math.floor(Math.random() * data.length) // 당첨될 index 설정
    for(let i = 0; i < data.length; ++i){
        const div = document.createElement('div')
        div.classList.add('roulette-item', 'p-2')
        div.innerText = data[currentIndex++]
        if(data.length <= currentIndex){
            currentIndex = 0
        }
        container.appendChild(div)
    }
    container.appendChild(container.children[0].cloneNode(true)) // 룰렛이 자연스럽게 이어지도록 처음과 끝을 같은값으로 설정
}

const startRoulette = (data) => {
    let time = 0;
    const field = document.getElementById('roulette-container')
    field.classList.add('roll-effect');
    const interval = setInterval(() => {
        if(time > 1){
            time += 0.002
        }else{
            time += 0.001
        }
        // 자연스러운 애니메이션때문에 데이터가 하나 더 추가되었기때문에 길이에 -1을 하지않음
        const y = ((easeOutExpo(time) * 1000) % 100) * data.length * -1;
        field.style.setProperty('--y', `${y}%`);
        if(time > 1 && y / (Math.round(y / 100) * 100) >= 0.9995){
            clearInterval(interval)
            field.classList.remove('roll-effect');
            field.scrollTop = field.scrollHeight
            field.children[data.length].style.transition = `all .5s ease`

            document.getElementById(`modalFooter`).style.display = ''
            document.querySelector('#modalHeader .btn-close').style.display = ''
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

    document.getElementById('alertTitle').innerText = `추첨`
    document.getElementById('modalContext').innerHTML = ``
    document.getElementById(`modalFooter`).style.display = 'none'
    document.querySelector('#modalHeader .btn-close').style.display = 'none'

    const data = []
    for(const element of users){
        data.push(element.innerText)
    }
    createRouletteData(data)

    const modal = document.getElementById('alertModal')
    modal.dataset.bsBackdrop = 'static'
    const listener = () => {
        modal.dataset.bsBackdrop = 'true'
        modal.removeEventListener('hidden.bs.modal', listener)
    }
    modal.addEventListener('hidden.bs.modal', listener)
    new bootstrap.Modal(modal).show()
    await new Promise((res, _) => setTimeout(res, 200)) // modal 출력 딜레이
    startRoulette(data)
}