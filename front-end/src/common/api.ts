import { ItemLog, ItemRecord, QueryableKV, QueryResult } from "../types"
import { ENV } from "./env"
import { fetchJsonPost, isOkayJSON } from './util'

export const DatabaseService = {
    async query(queryKV: QueryableKV, token: string): Promise<QueryResult | null> {
        const res = await fetchJsonPost(ENV.api.db.queryInventory, queryKV, token)
        if (!isOkayJSON(res)) return null
        const data = await res.json() as DatabaseService.Response.QueryInventory

        // Converts the columns into a KV object with values being their index in the data arrays
        const indexes = data.columns.reduce((acc, cur, i) => { acc[cur] = i; return acc }, {})

        const queryResult: QueryResult = data.data.map(fields => {
            const log = JSON.parse(fields[indexes['log']]) as ItemLog
            log.sort((a, b) => b.ts - a.ts)

            return {
                type: fields[indexes['type']],
                status: fields[indexes['type']],
                received: Number.parseInt(fields[indexes['received']]),
                receiver: fields[indexes['receiver']],
                lastAt: log[0].to,
                lastUpdate: log[0].ts,
                notes: fields[indexes['notes']]
            }
        })

        return queryResult
    }
}

export namespace DatabaseService {
    export namespace Response {
        export type QueryInventory = { columns: Array<string>, data: Array<Array<any>>, index: Array<number> }
    }
}
