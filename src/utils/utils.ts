import {mkdir, readFile, writeFile} from "fs/promises";
import fsExists from "fs.promises.exists";
import path from "path";
import {app} from "electron";

const nicknameColors = [
    "#EEA05D", "#EAA35F", "#E98158", "#E97F58", "#E76D53", "#E66D5F", "#E16490", "#E481AE", "#E481AE", "#D25FAC",
    "#D263AE", "#D66CB4", "#D071B6", "#AF71B5", "#A96BB2", "#905FAA", "#B38BC2", "#9D78B8", "#8D7AB8", "#7F68AE",
    "#9F99C8", "#717DC6", "#7E8BC2", "#5A90C0", "#628DCC", "#81A1CA", "#ADD2DE", "#83C5D6", "#8BC8CB", "#91CBC6",
    "#83C3BB", "#7DBFB2", "#AAD6C2", "#84C194", "#92C896", "#94C994", "#9FCE8E", "#A6D293", "#ABD373", "#BFDE73"
]

const cheatKeyNicknameColors = [
    "#E2BE61", "#ECA843", "#EC8A43", "#EA723D", "#E56B79", "#E68199", "#E16CB5", "#BC7ACC", "#A983E7", "#8B89E1",
    "#7194EE", "#7994D0", "#71AAED", "#5FB7E8", "#80BDD3", "#80D3CE", "#99D3BA", "#94D59A", "#BBE69A", "#CCE57D"
]

export interface JSONData{
    [key: string | number]: any;
}

export const getUserColor = (seed: string): string => {
    const index = seed.split("")
        .map((c) => c.charCodeAt(0))
        .reduce((a, b) => a + b, 0) % nicknameColors.length
    return nicknameColors[index]
}

export const getCheatKeyColor = (code: string): string => {
    const colorCode = parseInt(code.replace("CC", ""))
    return cheatKeyNicknameColors[colorCode - 1]
}

export const delay = (value: number) => new Promise((res, _) => setTimeout(res, value))
export const isObject = (data: any): boolean => !!data && typeof data === 'object';
export const isArray = (data: any): boolean => isObject(data) && data.constructor === Array
export const isNumeric = (data: any): boolean => {
    typeof data === 'number' || (data = parseInt(data))
    return !isNaN(data) && isFinite(data);
}

export const dateToString = (dateData: string | number | Date, full: boolean = false): string => {
    const date = typeof dateData !== 'object' ? new Date(dateData || 0) : dateData
    let output = `${date.getFullYear()}-${(date.getMonth() + 1 + '').padStart(2, '0')}-${(date.getDate() + '').padStart(2, '0')}`
    if(full){
        output += ` ${(date.getHours() + '').padStart(2, '0')}:${(date.getMinutes() + '').padStart(2, '0')}:${(date.getSeconds() + '').padStart(2, '0')}`
    }
    return output
}

export const getResourcePath = (fileOrDir: string = ''): string => path.join(app.getPath('userData'), 'resources', fileOrDir)

export const readResource = (fileName: string): Promise<string> => readFile(getResourcePath(fileName), 'utf-8')

export const saveResource = async (fileName: string, data: JSONData | string, dir: string = ''): Promise<void> => {
    dir = getResourcePath(dir)
    if(!await fsExists(dir)){
        await mkdir(dir, {recursive: true})
    }
    await writeFile(path.join(dir, fileName), typeof data === 'string' ? data : JSON.stringify(data, null, 4), 'utf-8')
}