import {ChzzkChat, ChzzkClient, Follower} from "chzzk";
import {delay} from "../utils/utils";

export class Chzzk{
    private static _instance: Chzzk

    static get instance(): Chzzk{
        return this._instance
    }

    static async setAuth(nidAuth: string, nidSession: string): Promise<boolean>{
        if(nidAuth && nidSession){
            let channelId = ''
            const client = new ChzzkClient({nidAuth, nidSession})
            while(!channelId){
                try{
                    channelId = (await client.user()).userIdHash
                }catch{
                    await delay(1000)
                }
            }
            const chat = client.chat({
                channelId,
                pollInterval: 20 * 1000 // 20초
            })
            chat.connect()
            this._instance = new Chzzk(chat, client, channelId)
            return true
        }
        return false
    }

    private constructor(
        public readonly chat: ChzzkChat,
        public readonly client: ChzzkClient,
        public readonly channelId: string
    ){}

    async getFollowerList(size: number = 10): Promise<Follower[]>{
        try{
            return (await this.client.manage.followers(this.channelId, {size})).data || []
        }catch{}
        return []
    }
}