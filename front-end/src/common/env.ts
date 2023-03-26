const API_ROOT='https://respass-1-k1280343.deta.app/api'
export const ENV = {
    api: {
        db: {
            queryInventory: `${API_ROOT}/db/queryInventory`,
            queryResident: `${API_ROOT}/db/queryResident`,
            addResident: `${API_ROOT}/db/addResident`
        },
        jwt: {
            getSignedJWT: `${API_ROOT}/jwt/getSignedJWT`
        }
    }
}