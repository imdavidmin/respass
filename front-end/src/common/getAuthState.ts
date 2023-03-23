import { LocalStorageKey } from "../enums"
import { AuthTokenPayload } from "../types"

export function getAuthState() {
    const info = getAuthInfo()

    // Auth state codes are 0: unauthenticated, 1: resident, and 2: staff
    if (!info) return 0
    switch (info.role) {
        case 'res': return 1
        case 'staff': return 2
    }
}

export function getAuthInfo(){
    return JSON.parse(localStorage.getItem(LocalStorageKey.AuthInfo)) as AuthTokenPayload
}