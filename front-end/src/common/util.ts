import { LocalStorageKey } from "../types"

export const fetchJsonPost = (url: string | URL, payload, bearerToken?: string) => {
    const headers = {
        'Content-Type': 'application/json',
    }
    if (bearerToken) { headers['Authorization'] = `Bearer ${bearerToken}` }

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    })
}

export function isOkayJSON(r: Response) { return r.ok && r.headers.get('content-type')?.includes('application/json') }

type ConfigData = Array<{ label?: string, value: string }>
type SiteConfig = {
    OBJECT_TYPES: ConfigData
    INVENTORY_LOCATIONS: ConfigData
    BUILDINGS: ConfigData
}
export enum ConfigKey {
    AvailableBuildings,
    InventoryObjectTypes,
    InventoryLocations
}

export function getSiteConfig(key: ConfigKey) {
    const data: SiteConfig = JSON.parse(localStorage.getItem(LocalStorageKey.SiteConfig))
    switch (key) {
        case ConfigKey.AvailableBuildings: return data?.BUILDINGS ?? []
        case ConfigKey.InventoryLocations: return data?.INVENTORY_LOCATIONS ?? []
        case ConfigKey.InventoryObjectTypes: return data?.OBJECT_TYPES ?? []
    }
}

export async function getResidentDirectory(){
    return JSON.parse(localStorage.getItem(LocalStorageKey.ResidentDirectory))
}