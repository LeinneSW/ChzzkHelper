import express, {Express} from "express"
import {Server} from "http";
import path from "path";
import {WebSocketServer} from 'ws'

export class Web{
    private readonly app: Express
    private _server: Server
    private _socket: WebSocketServer

    constructor(){
        this.app = express()
        this.app.use('/', express.static(path.join(__dirname , '/../public/')))
        this.app.get('/alert', (_, res) => {
            res.sendFile(path.join(__dirname, '/../public/alert/alert.html'))
        })

        this._server = this.app.listen(54321, () => {})
        this._socket = new WebSocketServer({server: this._server, path: '/ws'})
    }

    get server(){
        return this._server
    }

    get socket(){
        return this._socket
    }
}