import { JSONData, delay } from "../utils/utils";

export class Chzzk{
    private static _userId: string = ''
    static option: JSONData = {
        headers: {
            'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.111 Safari/537.36`,
        }
    }

    static get userId(){
        return this._userId
    }

    static async setAuth(nidAut?: string, nidSes?: string): Promise<boolean>{
        if(nidSes && nidAut){
            this.option.headers.Cookie = `NID_AUT=${nidAut}; NID_SES=${nidSes}`
            await this.acquireUserId()
            return true
        }
        return false
    }

    static async acquireUserId(){
        if(this._userId){
            return
        }

        try{
            const res = await this.fetch(`https://comm-api.game.naver.com/nng_main/v1/user/getUserStatus`)
            this._userId = (await res.json()).content?.userIdHash
        }catch{
            await delay(1000)
            await this.acquireUserId()
        }
    }

    static async getFollowerList(size: number = 10): Promise<JSONData[]>{
        try{
            const res = await this.fetch(`https://api.chzzk.naver.com/manage/v1/channels/${this._userId}/followers?size=${size}`)
            return (await res.json()).content.data
        }catch{}
        return []
    }

    static fetch(url: string, option: JSONData = {}){
        return fetch(url, {...this.option, ...option})
    }
}