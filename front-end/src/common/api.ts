import { ItemLog, ItemRecord, QueryableKV, QueryResult } from "../types"
import { ENV } from "./env"
import { fetchJsonPost, isOkayJSON } from './util'

export const DatabaseService = {
    async queryInventory(queryKV: QueryableKV, token: string): Promise<QueryResult | null> {
        const res = await fetchJsonPost(ENV.api.db.queryInventory, queryKV, token)
        if (!isOkayJSON(res)) return null
        const data = await res.json() as DatabaseService.Response.QueryInventory

        // Converts the columns into a KV object with values being their index in the data arrays
        const indexes = data.columns.reduce((acc, cur, i) => { acc[cur] = i; return acc }, {})

        const queryResult: QueryResult = data.data.map(fields => {
            const log = fields[indexes['log']] as ItemLog
            log.sort((a, b) => b.ts - a.ts)

            return {
                type: fields[indexes['type']],
                status: fields[indexes['type']],
                received: Number.parseInt(fields[indexes['received']]),
                receiver: fields[indexes['receiver']],
                lastAt: log[0].to,
                lastUpdate: log[0].ts,
                note: fields[indexes['note']]
            }
        })

        return queryResult
    },
    async querySingleIdentity(kv: { [k: string]: string }, token): Promise<DatabaseService.Response.QueryResident> {
        const res = await fetchJsonPost(ENV.api.db.queryResident, kv, token)
        return isOkayJSON(res) ? await res.json() : null
    },
    async addResident(kv: { [k: string]: string }, token): Promise<DatabaseService.Response.AddResident> {
        const res = await fetchJsonPost(ENV.api.db.queryResident, kv, token)
        if (!res.ok) return null
        const id = Number.parseInt(await res.text())
        return Number.isInteger(id) ? id : null
    },
}

export const JWTService = {
    async getJWT(payload: { [k: string]: any }, token): Promise<string> {
        const res = await fetchJsonPost(ENV.api.jwt.getSignedJWT, payload, token)
        return res.ok ? await res.text() : null
    }
}

export namespace DatabaseService {
    export namespace Response {
        type QueryResult = { columns: Array<string>, data: Array<Array<any>>, index: Array<number> }
        export type QueryInventory = QueryResult
        export type QueryResident = QueryResult
        export type AddResident = number
    }
}
