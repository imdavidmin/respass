//@ts-nocheck

import { InventoryReceiptForm } from "../staff/ReceiveItems"
import { ResidentData } from "../staff/ResidentManagement/ResidentInformationForm"
import { AuthTokenPayload, ItemLog, ItemRecord, QueryableKV, QueryResult, ResidentDirectory } from "../types"
import { ENV, PROP_ID } from "./env"
import { fetchJsonPost, isOkayJSON } from './util'

export const DatabaseService = {
    async addInventory(form: InventoryReceiptForm, token: string) {
        const res = await fetchJsonPost(ENV.api.db.addInventory, form, token)
        return res.ok ? { success: true } : { success: false, res: res }
    },
    async addResident(kv: ResidentData, token: string): Promise<DatabaseService.Response.AddResident> {
        const res = await fetchJsonPost(ENV.api.db.addResident, kv, token)
        if (!res.ok) return null
        const id = Number.parseInt(await res.text())
        return Number.isInteger(id) ? id : null
    },
    async deleteResident(id: string, token: stirng): Promise<boolean> {
        const res = await fetch(`${ENV.api.db.deleteResident}?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) return true
    },
    async updateResident(form: ResidentData, id: string, token: string): Promise<boolean> {
        const res = await fetchJsonPost(`${ENV.api.db.updateResident}?id=${id}`, form, token)
        if (res.ok) return true
    },
    async getAllResidents(token: string): Promise<ResidentDirectory> {
        const res = await fetch(ENV.api.db.getAllResidents, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const result: ResidentDirectory = {}

        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return result
        const data: DatabaseService.Response.GetAllResidents = await res.json()

        const fields = ['name', 'bld', 'unit', 'id']
        const [nameIndex, buildingIndex, unitIndex, idIndex] = fields.map(f => data.columns.indexOf(f))
        data.data.forEach(row => {
            const [bld, unit, name, id]: Array<string> = [row[buildingIndex], row[unitIndex], row[nameIndex], row[idIndex]]
            result[bld] ??= {}
            result[bld][unit] ??= []
            result[bld][unit].push([name, id])
        })
        return result
    },
    async getResidentContact(id: string, token: string) {
        const res = await fetch(`${ENV.api.db.getResidentContact}?id=${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        if (isOkayJSON(res)) {
            return await res.json()
        }
    },
    async queryInventory(queryKV: Partial<AuthTokenPayload>, token: string): Promise<QueryResult | null> {
        const res = await fetchJsonPost(ENV.api.db.queryInventory, queryKV, token)
        if (!isOkayJSON(res)) return null
        const data = await res.json() as DatabaseService.Response.QueryInventory

        // Converts the columns into a KV object with values being their index in the data arrays
        const indexes = data.columns.reduce((acc, cur, i) => { acc[cur] = i; return acc }, {})

        const queryResult: QueryResult = data.data
            .filter(d => d[indexes.status] == 'w') // Filters only records where item is awaiting collection
            .map(fields => {
                const log = fields[indexes['log']] as ItemLog
                log.sort((a, b) => b.ts - a.ts)
                const record: ItemRecord = {
                    type: fields[indexes['type']],
                    owner: fields[indexes.owner_name],
                    received: Number.parseInt(fields[indexes['received']]),
                    receiver: fields[indexes['receiver']],
                    lastAt: log[0].to,
                    lastUpdate: log[0].ts,
                    note: fields[indexes['note']],
                    id: fields[indexes['id']]
                }
                return record
            })

        return queryResult
    },
    async querySingleIdentity(kv: { [k: string]: string }, token): Promise<DatabaseService.Response.QueryResident> {
        const res = await fetchJsonPost(ENV.api.db.queryResident, kv, token)
        return isOkayJSON(res) ? await res.json() : null
    },
    async submitInventoryCollection(collectedIds: Array<number>, recipientJWT: string, token: string) {
        const res = await fetchJsonPost(ENV.api.db.submitInventoryCollection, {
            collected: collectedIds,
            reciipentJWT: recipientJWT,
        }, token)
        return res.ok ? { success: true } : { success: false, res: res }
    }
}

export const JWTService = {
    async getJWT(payload: { [k: string]: any }, token: string, sendEmail?: boolean): Promise<string> {
        const res = await fetchJsonPost(`${ENV.api.jwt.getSignedJWT}${sendEmail ? '?sendToEmail=true' : ''}`, payload, token)
        return res.ok ? await res.text() : null
    }
}

export const KVService = {
    async getSiteConfig(): Promise<SiteConfig> {
        const res = await fetch(`${ENV.api.kv.getConfig}?prop=${PROP_ID}`)
        if (isOkayJSON(res)) {
            return await res.json()
        } else {
            return {}
        }
    }
}

export namespace DatabaseService {
    export namespace Response {
        type QueryResult = { columns: Array<string>, data: Array<Array<any>>, index: Array<number> }
        export type QueryInventory = QueryResult
        export type QueryResident = QueryResult
        export type AddResident = number
        export type GetAllResidents = QueryResult
    }
}

type ConfigData = Array<{ label?: string, value: string }>
export type SiteConfig = {
    OBJECT_TYPES: ConfigData
    INVENTORY_LOCATIONS: ConfigData
    BUILDINGS: ConfigData
}