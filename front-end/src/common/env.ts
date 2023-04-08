const API_ROOT = 'https://respass-1-k1280343.deta.app/api'
export const ENV = {
    api: {
        db: {
            addInventory: `${API_ROOT}/db/addInventory`,
            addResident: `${API_ROOT}/db/addResident`,
            deleteResident: `${API_ROOT}/db/deleteResident`,
            getAllResidents: `${API_ROOT}/db/getAllResidents`,
            queryInventory: `${API_ROOT}/db/inventoryQuery`,
            queryResident: `${API_ROOT}/db/queryResident`,
            submitInventoryCollection: `${API_ROOT}/db/submitInventoryCollection`,
            updateResident: `${API_ROOT}/db/updateResident`
        },
        jwt: {
            getSignedJWT: `${API_ROOT}/jwt/getSignedJWT`
        }
    }
}