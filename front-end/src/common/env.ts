const API_ROOT='https://respass-1-k1280343.deta.app/api'
export const ENV = {
    api: {
        db: {
            queryInventory: `${API_ROOT}/db/inventoryQuery`,
            queryResident: `${API_ROOT}/db/queryResident`,
            addResident: `${API_ROOT}/db/addResident`,
            getAllResidents: `${API_ROOT}/db/getAllResidents`,
            addInventory: `${API_ROOT}/db/addInventory`,
            submitInventoryCollection: `${API_ROOT}/db/submitInventoryCollection`
        },
        jwt: {
            getSignedJWT: `${API_ROOT}/jwt/getSignedJWT`
        }
    }
}