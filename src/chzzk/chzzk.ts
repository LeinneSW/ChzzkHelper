import {ChzzkChat, ChzzkClient, Follower} from "chzzk";
import {delay} from "../utils/utils";

export class Chzzk{
    private static _instance: Chzzk

    static get instance(): Chzzk{
        return this._instance
    }

    static async setAuth(nidAuth: string, nidSession: string): Promise<boolean>{
        if(nidAuth && nidSession){
            let userId = ''
            const client = new ChzzkClient({nidAuth, nidSession})
            while(!userId){
                try{
                    userId = (await client.user()).userIdHash
                }catch{
                    await delay(1000)
                }
            }
            const chat = client.chat({
                channelId: userId,
                pollInterval: 20 * 1000 // 20초
            })
            chat.connect()
            this._instance = new Chzzk(chat, client, userId)
            return true
        }
        return false
    }

    private constructor(
        public readonly chat: ChzzkChat,
        public readonly client: ChzzkClient,
        public readonly userId: string
    ){}

    async getFollowerList(size: number = 10): Promise<Follower[]>{
        try{
            return (await this.client.manage.followers(this.userId, {size})).data || []
        }catch{}
        return []
    }
}