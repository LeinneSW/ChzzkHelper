import {ChzzkChat, ChzzkClient, Follower} from "chzzk";
import {delay} from "../utils/utils";

export class Chzzk{
    private static _userId: string = ''
    
    private static _chat: ChzzkChat
    private static _client: ChzzkClient

    private constructor(){}

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
                    this._userId = (await this._client.user()).userIdHash
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

    static async getFollowerList(size: number = 10): Promise<Follower[]>{
        try{
            return (await this._client.manage.followers(this._userId, {size})).data || []
        }catch{}
        return []
    }
}