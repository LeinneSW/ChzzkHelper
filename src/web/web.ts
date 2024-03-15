import express, {Express} from "express"
import {Server} from "http";
import path from "path";
import {WebSocketServer} from 'ws'

export class Web{
    private static _instance: Web

    static get instance(): Web{
        if(!this._instance){
            this._instance = new Web()
        }
        return this._instance
    }

    public readonly app: Express
    public readonly server: Server
    public readonly socket: WebSocketServer

    private constructor(){
        if(Web._instance){
            throw new Error('Web instance는 한개만 존재해야합니다.')   
        }

        Web._instance = this
        this.app = express()
        this.app.use('/', express.static(path.join(__dirname , './../../public/')))

        this.server = this.app.listen(54321, () => {})
        this.socket = new WebSocketServer({server: this.server, path: '/ws'})
    }
}