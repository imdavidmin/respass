export type AuthTokenPayload = {
    sub: string,
    role: string,
    name: string,
    bld: string,
    unit: string,
    iss: string,
    ic: number
}

export type QueryableKV = Partial<{ [k in keyof AuthTokenPayload]: Array<AuthTokenPayload[k]> }>
export type QueryResult = Array<ItemRecord>

export type ItemRecord = {
    type: 'parcel' | string,
    received: number,
    receiver: string,
    lastAt: string,
    lastUpdate: number,
    owner: string,
    note: string
}

export type ItemLog = Array<{ ts: number, to: string, by: string }>

export type ResidentDirectory = { [bld: string]: { [unit: string]: Array<[string, string]> } }

export enum ItemStatus {
    Special = 's',
    Completed = 'c',
    AwaitCollection = 'w',
    Available = 'r',
    Unavailable = 'u'
}

export enum LocalStorageKey {
    JWT = 'authJWT',
    AuthInfo = 'authInfo',
    ResidentDirectory = 'resDir',
    SiteConfig = 'siteConfig'
}