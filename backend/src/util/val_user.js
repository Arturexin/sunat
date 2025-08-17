export async function userExists(pool, user) {
    try {
        const [existing]  = await pool.query(
            'SELECT id, name, last_name, email, user, phone, password_hash, role, date_record, state ' +
            'FROM users WHERE user = ?',
            [user]
        );
        return {
            data: existing,
            validation: existing.length > 0
        };
    } catch (error) {
        return { data: [], validation: false, error };
    }
}