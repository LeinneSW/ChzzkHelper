import {app, BrowserWindow, Tray, dialog, Menu} from "electron";
import {WebSocket} from 'ws'
import path from 'path'
import {Chzzk} from "./chzzk/chzzk";
import {getUserColor, readResource, saveResource} from "./utils/utils";
import {Web} from "./web/web";

const ttsSocket: WebSocket[] = []
const createTTSTask = () => {
    Web.instance.socket.on('connection', client => client.on('message', data => {
        const message = data.toString('utf-8')
        if(message === 'TTS' && !ttsSocket.includes(client)){
            ttsSocket.push(client)
            client.onclose = () => ttsSocket.splice(ttsSocket.indexOf(client), 1)
            return
        }
    }))
    Chzzk.instance.chat.on('chat', chat => {
        const badgeList: string[] = []
        if(chat.profile?.badge?.imageUrl){
            badgeList.push(chat.profile.badge.imageUrl)
        }
        if(chat.profile.streamingProperty?.subscription?.badge?.imageUrl){
            badgeList.push(chat.profile.streamingProperty.subscription.badge.imageUrl)
        }
        if(chat.profile.streamingProperty?.realTimeDonationRanking?.badge?.imageUrl){
            badgeList.push(chat.profile.streamingProperty?.realTimeDonationRanking?.badge?.imageUrl)
        }
        for(const activityBadge of chat.profile.activityBadges){
            if(activityBadge.activated){
                badgeList.push(activityBadge.imageUrl)
                break
            }
        }
        const jsonStr = JSON.stringify({
            nickname: chat.profile.nickname,
            color: chat.profile.title?.color || getUserColor(chat.profile.userIdHash + Chzzk.instance.chat.chatChannelId),
            message: chat.message,
            emojiList: chat.extras?.emojis || {},
            badgeList
        })
        for(const client of ttsSocket){
            client.send(jsonStr)
        }
    })
}

const voteSocket: WebSocket[] = []
const createVoteTask = () => {
    Web.instance.app.post('/req/send_chat', (req, res) => {
        res.sendStatus(200)
        const message = req.body?.message
        if(message){
            Chzzk.instance.chat.sendChat(message)
        }
    })
    Web.instance.socket.on('connection', client => client.on('message', data => {
        const message = data.toString('utf-8')
        if(message === 'VOTE' && !voteSocket.includes(client)){
            voteSocket.push(client)
            client.onclose = () => voteSocket.splice(voteSocket.indexOf(client), 1)
            return
        }

        try{
            const json = JSON.parse(message)
            switch(json.type){
                case 'SEND_MESSAGE':
                    json.message && Chzzk.instance.chat.sendChat(json.message)
                    break;
            }
            return
        }catch{}
    }))
    Chzzk.instance.chat.on('chat', chat => {
        const jsonData = JSON.stringify({
            user: chat.profile,
            message: chat.message,
        })
        for(const client of voteSocket){
            client.send(jsonData)
        }
    })
}

const emojiSocket: WebSocket[] = []
const createEmojiTask = () => {
    Web.instance.app.post('/req/test_emoji', (req, res) => {
        res.sendStatus(200)
        const jsonData = JSON.stringify({
            emojiList: new Array(5).fill('d_47'),
            emojiUrlList: {'d_47': 'https://ssl.pstatic.net/static/nng/glive/icon/b_07.gif'},
        })
        for(const client of emojiSocket){
            client.send(jsonData)
        }
    })
    Web.instance.socket.on('connection', client => client.on('message', data => {
        if(data.toString('utf-8') === 'SHOW_EMOJI' && !emojiSocket.includes(client)){
            emojiSocket.push(client)
            client.on('close', () => emojiSocket.splice(emojiSocket.indexOf(client), 1))
        }
    }))
    Chzzk.instance.chat.on('chat', chat => {
        const emojiUrlList = chat.extras?.emojis
        if(!emojiUrlList || Object.keys(emojiUrlList).length < 1){
            return
        }

        let match
        const emojiList = []
        const regex = /{:([\w]*):}/g
        while((match = regex.exec(chat.message)) !== null){
            emojiList.push(match[1])
        }

        const jsonData = JSON.stringify({emojiList, emojiUrlList})
        for(const client of emojiSocket){
            client.send(jsonData)
        }
    })
}

let followList: string[] = []
const alertSocket: WebSocket[] = []
const createCheckFollowTask = () => {
    Web.instance.socket.on('connection', client => {
        client.on('message', data => {
            if(data.toString('utf-8') === 'ALERT' && !alertSocket.includes(client)){
                alertSocket.push(client)
                client.onclose = () => alertSocket.splice(alertSocket.indexOf(client), 1)
            }
        })
    })
    Web.instance.app.post('/req/test_alert', (_, res) => {
        res.sendStatus(200)
        const json = JSON.stringify({
            type: `팔로우`,
            user: {
                nickname: '테스트'
            },
        });
        for(const client of alertSocket){
            client.send(json)
        }
    })

    readResource(`follow.txt`).then(file => {
        for(let data of file.split('\n')){
            data = data.trim().replace(/\s/g, '')
            data && followList.push(data)
        }
    }).catch(async () => {
        const list = [];
        for(const user of await Chzzk.instance.getFollowerList(10000)){
            list.push(user.user.userIdHash)
        }
        await saveResource('follow.txt', list.join('\n'))
    }).then(() => setInterval(async () => {
        const newData = (await Chzzk.instance.getFollowerList(10)).filter(user => !followList.includes(user.user.userIdHash))
        if(newData.length > 0){
            for(const followData of newData){
                followList.push(followData.user.userIdHash)
                const json = JSON.stringify({type: '팔로우', user: followData.user});
                for(const client of alertSocket){
                    client.send(json)
                }
            }
            await saveResource('follow.txt', followList.join('\n'))
        }
    }, 10000))
}

const acquireAuthPhase = async (session: Electron.Session): Promise<boolean> => {
    const nidAuth = (await session.cookies.get({name: 'NID_AUT'}))[0]?.value || ''
    const nidSession = (await session.cookies.get({name: 'NID_SES'}))[0]?.value || ''
    if(!await Chzzk.setAuth(nidAuth, nidSession)){
        return false
    }

    createTTSTask()
    createVoteTask()
    createEmojiTask()
    createCheckFollowTask()
    
    const icon = path.join(__dirname, '../resources/icon.png')
    const window = new BrowserWindow({
        width: 1366,
        height: 768,
        icon,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            defaultEncoding: 'utf-8',
        },
    })
    window.setMenu(null)

    const tray = new Tray(icon)
    tray.setToolTip('치지직 도우미')
    tray.on('double-click', () => window.show())
    const trayMenu = Menu.buildFromTemplate([
        {label: '설정', type: 'normal', click: () => {
            dialog.showMessageBoxSync(window, {
                type: 'info',
                title: `준비중인 기능`,
                message: '아직 구현되지 않은 기능입니다.'
            })
        }},
        {label: '프로그램 종료', type: 'normal', click: () => window.destroy()},
    ]);
    tray.setContextMenu(trayMenu)

    window.on('minimize', () => window.hide())
    window.on('close', event => {
        const response = dialog.showMessageBoxSync(window, {
            type: 'question',
            buttons: ['아니오', '트레이로 이동', '프로그램 종료'],
            title: `치지직 도우미 종료`,
            message: '치치직 도우미를 종료하시겠습니까?\n(OBS에 추가한 브라우저 위젯들은 도우미가 켜져있어야 동작합니다.)'
        })
        
        switch(response){
            case 1:
                window.hide()
            case 0:
                event.preventDefault()
                break;
        }
    })
    await window.loadFile(path.join(__dirname, '../public/index.html'))
    window.show()
    return true
}

app.whenReady().then(async () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            defaultEncoding: 'utf-8',
        },
        icon: path.join(__dirname, '../resources/icon.png')
    })
    window.setMenu(null)

    await window.loadURL(`https://chzzk.naver.com/`)
    if(await acquireAuthPhase(window.webContents.session)){
        window.destroy()
        return
    }

    await window.loadURL(`https://nid.naver.com/nidlogin.login?url=https://chzzk.naver.com/`)
    window.webContents.on('did-navigate', async (_: any, newUrl: string) => {
        const url = new URL(newUrl)
        if(url.hostname === 'chzzk.naver.com' && url.pathname === '/'){ // 로그인 성공
            if(!await acquireAuthPhase(window.webContents.session)){
                dialog.showMessageBox(window, {
                    type: 'error',
                    title: '로그인 도중 문제 발생',
                    message: '로그인 도중 알 수 없는 문제가 발견되었습니다. 프로그램을 다시 실행해주세요.'
                })
            }
            window.destroy()
        }
    })
    window.show()
    
    dialog.showMessageBox(window, {
        type: 'info',
        title: '네이버 로그인 필요',
        message: '로그인이 필요한 서비스입니다.\n로그인 후 진행해주세요.'
    })
})