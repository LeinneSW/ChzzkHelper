import {app, BrowserWindow, Tray, dialog, Menu} from "electron";
import {WebSocket} from 'ws'
import path from 'path'
import {Chzzk} from "./chzzk/chzzk";
import fsExists from "fs.promises.exists";
import {readFile} from "fs/promises";
import {JSONData, isNumeric, saveFile} from "./utils/utils";
import {Web} from "./web/web";

const voteSocket: WebSocket[] = []
const createVoteTask = async () => {
    Web.instance.socket.on('connection', async client => {
        client.onmessage = data => {
            const message = data.data.toString('utf-8')
            if(message === 'VOTE'){
                if(!voteSocket.includes(client)){
                    voteSocket.push(client)
                    client.onclose = () => voteSocket.splice(voteSocket.indexOf(client), 1)
                }
            }else{
                try{
                    const json = JSON.parse(message)
                    switch(json.type){
                        case 'SEND_MESSAGE':
                            json.message && Chzzk.instance.chat.sendChat(json.message)
                            break;
                    }
                }catch{}
            }
        }
    })
}

let followList: string[] = []
const alertSocket: WebSocket[] = []
const createCheckFollowTask = () => {
    Web.instance.socket.on('connection', async client => {
        client.onmessage = data => {
            if(data.data.toString('utf-8') === 'ALERT' && !alertSocket.includes(client)){
                alertSocket.push(client)
                client.onclose = () => alertSocket.splice(alertSocket.indexOf(client), 1)
            }
        }
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

    const filePath = path.join(app.getPath('userData'), 'follow.txt')
    fsExists(filePath).then(async v => {
        if(!v){
            const list = [];
            for(const user of await Chzzk.instance.getFollowerList(10000)){
                list.push(user.user.userIdHash)
            }
            saveFile(app.getPath('userData'), 'follow.txt', list.join('\n'))
        }else{
            followList = (await readFile(filePath, 'utf-8')).split('\n').map(v => v.trim()).filter(v => !!v)
        }
    }).then(() => {
        setInterval(async () => {
            const newData = (await Chzzk.instance.getFollowerList(10)).filter(user => !followList.includes(user.user.userIdHash))
            if(newData.length > 0){
                for(const followData of newData){
                    followList.push(followData.user.userIdHash)
                    const json = JSON.stringify({type: '팔로우', user: followData.user});
                    for(const client of alertSocket){
                        client.send(json)
                    }
                }
                saveFile(app.getPath('userData'), 'follow.txt', followList.join('\n'))
            }
        }, 10000)
    })
}

const songList: JSONData[] = [] // TODO: remove song & send song data
const reqSongSocket: WebSocket[] = []
const createRequestSongTask = async () => {
    Web.instance.socket.on('connection', client => {
        client.on('message', (data) => {
            try{
                const message = data.toString('utf-8')
                if(message === 'REQUEST_SONG'){
                    if(!reqSongSocket.includes(client)){
                        reqSongSocket.push(client)
                        client.onclose = () => alertSocket.splice(alertSocket.indexOf(client), 1)
                    }
                }else if(isNumeric(message)){
                    const index = parseInt(message)
                    if(0 <= index && index < songList.length){
                        songList.splice(index, 1)
                        const jsonTest = JSON.stringify(songList)
                        for(const client of reqSongSocket){
                            client.send(jsonTest)
                        }
                    }
                }
            }catch{}
        });
        client.on('close', () => reqSongSocket.splice(reqSongSocket.indexOf(client), 1));
    })
}

const acquireAuthPhase = async (session: Electron.Session): Promise<boolean> => {
    const nidAuth = (await session.cookies.get({name: 'NID_AUT'}))[0]?.value || ''
    const nidSession = (await session.cookies.get({name: 'NID_SES'}))[0]?.value || ''
    if(!await Chzzk.setAuth(nidAuth, nidSession)){
        return false
    }

    createVoteTask()
    createCheckFollowTask()
    createRequestSongTask()
    Chzzk.instance.chat.on('chat', chat => {
        for(const client of voteSocket){
            client.send(JSON.stringify({
                user: chat.profile,
                message: chat.message,
            }))
        }
    })
    
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
        minimizable: false,
        autoHideMenuBar: true,
    })

    const tray = new Tray(icon)
    tray.setToolTip('치지직 도우미')
    tray.on('double-click', () => window.show())
    const trayMenu = Menu.buildFromTemplate([
        {label: '종료', type: 'normal', click: () => {
            dialog.showMessageBoxSync(window, {
                type: 'question',
                buttons: ['예', '아니오'],
                title: `치지직 도우미 종료`,
                message: '치치직 도우미를 종료하시겠습니까?\n(프로그램이 켜져있어야 기능들이 동작합니다.)'
            }) !== 1 && window.destroy()
        }}
    ]);
    tray.setContextMenu(trayMenu)

    window.once('close', event => {
        dialog.showMessageBoxSync(window, {
            type: 'info',
            title: `트레이로 최소화`,
            message: '도우미는 종료되지않고 트레이로 최소화됩니다.\n(프로그램이 켜져있어야 기능들이 동작합니다.)'
        })
        window.hide()
        event.preventDefault()
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
        webPreferences: {
            nodeIntegration: true,
            defaultEncoding: 'utf-8',
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, '../resources/icon.png')
    })

    await window.loadURL(`https://chzzk.naver.com/`)
    if(await acquireAuthPhase(window.webContents.session)){
        window.close()
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
            window.close()
        }
    })
    window.show()
    
    dialog.showMessageBox(window, {
        type: 'info',
        title: '네이버 로그인 필요',
        message: '로그인이 필요한 서비스입니다.\n로그인 후 진행해주세요.'
    })
})