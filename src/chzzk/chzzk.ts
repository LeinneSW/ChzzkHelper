import {ChzzkChat, ChzzkClient} from "chzzk";
import {JSONData, delay} from "../utils/utils";

export class Chzzk{
    private static _userId: string = ''
    
    private static _chat: ChzzkChat
    private static _client: ChzzkClient

    static get userId(){
        return this._userId
    }

    static get chat(){
        return this._chat
    }

    static get client(){
        return this._client
    }

    static async setAuth(nidAuth?: string, nidSession?: string): Promise<boolean>{
        if(nidAuth && nidSession){
            this._client = new ChzzkClient({nidAuth, nidSession})
            while(!this._userId){
                try{
                    const res = await this._client.fetch(`https://comm-api.game.naver.com/nng_main/v1/user/getUserStatus`)
                    this._userId = (await res.json()).content?.userIdHash
                }catch{
                    await delay(1000)
                }
            }
            
            this._chat = this._client.chat({
                channelId: this._userId,
                pollInterval: 20 * 1000 // 20초
            })
            this._chat.connect()
            return true
        }
        return false
    }

    static async getFollowerList(size: number = 10): Promise<JSONData[]>{
        try{
            const res = await this._client.fetch(`https://api.chzzk.naver.com/manage/v1/channels/${this._userId}/followers?size=${size}`)
            return (await res.json()).content.data
        }catch{}
        return []
    }
}