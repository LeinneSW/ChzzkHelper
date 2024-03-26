import {mkdir, readFile, writeFile} from "fs/promises";
import fsExists from "fs.promises.exists";
import path from "path";
import {app} from "electron";

export interface JSONData{
    [key: string | number]: any;
}

export const delay = (value: number) => new Promise((res, _) => setTimeout(res, value))
export const isObject = (data: any): boolean => !!data && typeof data === 'object';
export const isArray = (data: any): boolean => isObject(data) && data.constructor === Array;
export const isNumeric = (data: any): boolean => {
    if(typeof data !== 'number'){
        data = parseInt(data);
    }
    return !isNaN(data) && isFinite(data);
}

export const randomInt = (length: number) => `${Math.floor(Math.random() * +(1 + '0'.repeat(length)))}`.padEnd(length, '0')

export const dateToString = (dateData: string | number | Date, full: boolean = false): string => {
    const date = typeof dateData !== 'object' ? new Date(dateData || 0) : dateData;
    let output = `${date.getFullYear()}-${(date.getMonth() + 1 + '').padStart(2, '0')}-${(date.getDate() + '').padStart(2, '0')}`;
    if(full){
        output += ` ${(date.getHours() + '').padStart(2, '0')}:${(date.getMinutes() + '').padStart(2, '0')}:${(date.getSeconds() + '').padStart(2, '0')}`;
    }
    return output;
}

export const getResourcePath = (fileOrDir: string = '') => path.join(app.getPath('userData'), fileOrDir)

export const readResource = (fileName: string): Promise<string> => readFile(getResourcePath(fileName), 'utf-8')

export const saveResource = async (fileName: string, data: JSONData | string, dir: string = '') => {
    dir = getResourcePath(dir)
    if(!await fsExists(dir)){
        await mkdir(dir, {recursive: true})
    }
    await writeFile(path.join(dir, fileName), typeof data === 'string' ? data : JSON.stringify(data, null, 4), 'utf-8')
}