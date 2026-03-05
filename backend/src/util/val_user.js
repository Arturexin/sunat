export async function userExists(pool, user, state) {
    try {
        const [existing]  = await pool.query(
            'SELECT u.ID_USER, u.ID_ENTITY, u.USER, u.PASSWORD_HASH, en.NAME AS NAME, en.LAST_NAME AS LAST_NAME, er.NAME AS ROLE ' +
            'FROM users AS u ' +
            'JOIN entity AS e ON e.ID_ENTITY = u.ID_ENTITY ' +
            'JOIN entity_natural AS en ON en.ID_ENTITY = u.ID_ENTITY ' +
            'JOIN entity_role AS er ON er.ID_ROLE = e.ID_ROLE ' +
            'WHERE u.USER = ? AND u.STATE = ?',
            [user, state]
        );
        return {
            data: existing,
            validation: existing.length > 0
        };
    } catch (error) {
        return { data: [], validation: false, error };
    }
}
export async  function docExists(pool, doc, id_user) {
    try {
        const [existing] = await pool.query(
            `SELECT ed.NUMBER_DOCUMENT 
            FROM entity AS e
            JOIN entity_document AS ed ON ed.ID_DOCUMENT = e.ID_DOCUMENT
            JOIN users AS u ON u.ID_ENTITY = e.ID_ENTITY
            WHERE ed.NUMBER_DOCUMENT = ? AND u.ID_USER = ?`,    
            [doc, id_user]
        );
        if (existing.length > 0) {
            return true
        }
        return false
    } catch (error) {
        return {
            status: 'error',
            message: 'Error al verificar el documento.'
        }
    }
}