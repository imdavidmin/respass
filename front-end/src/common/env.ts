const API_ROOT = 'https://respass-api.lansburysquare.com'
export const ENV = {
    api: {
        db: {
            addInventory: `${API_ROOT}/db/addInventory`,
            addResident: `${API_ROOT}/db/addResident`,
            deleteResident: `${API_ROOT}/db/deleteResident`,
            getAllResidents: `${API_ROOT}/db/getAllResidents`,
            getResidentContact: `${API_ROOT}/db/getResidentContact`,
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