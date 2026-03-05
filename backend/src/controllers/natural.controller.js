import { pool } from '../mysql_db.js';
import bcrypt from 'bcrypt'
import { ACTIVO, INACTIVO, SAL_ROUNDS } from '../config.js';


export const getNaturals = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * ' +
                                        'FROM entity_natural')
        return res.status(200).json({
            status: 'success',
            data: rows
        })
        
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error al obtener las personas naturales. ' + error
        })
    }
} 

export const createNatural = async (req, res) => {
    try {
        const { NAME, LAST_NAME, EMAIL, USER, GENERO, PASSWORD, DATE_BIRTH } = req.body;

        const [rows] = await pool.query('SELECT * ' +
            'FROM entity_role ' +
            'WHERE ID_ROLE = ?',
            [1]
        );
        //hash password
        const hashedPassword = await bcrypt.hash(PASSWORD, SAL_ROUNDS)

        const [res_entity] = await pool.query('INSERT INTO entity ' +
            '(ID_DOCUMENT, ID_PHONE, ID_ADDRESS, ID_ROLE, STATE, DATE_RECORD) ' +
            'VALUES (?, ?, ?, ?, ?, NOW())',
            [null, null, null, rows[0].ID_ROLE, ACTIVO]
        );

        const [res_natural] = await pool.query('INSERT INTO entity_natural ' +
            '(ID_ENTITY, NAME, LAST_NAME, GENERO, DATE_BIRTH, STATE) ' +
            'VALUES (?, ?, ?, ?, ?, ?)',
            [res_entity.insertId, NAME, LAST_NAME, Number(GENERO), DATE_BIRTH, ACTIVO]
        );

        const [res_email] = await pool.query('INSERT INTO entity_email ' +
            '(EMAIL, EMAIL_2, STATE) ' +
            'VALUES (?, ?, ?)',
            [EMAIL, null, ACTIVO]
        )

        const [res_users] = await pool.query('INSERT INTO users ' +
            '(ID_ENTITY, USER, PASSWORD_HASH, STATE, DATE_RECORD) ' +
            'VALUES (?, ?, ?, ?, NOW())',
            [res_entity.insertId, USER, hashedPassword, ACTIVO]
        )

        return res.status(200).json({
            status: 'success',
            data: rows,
            id_entity: res_entity.insertId,
            id_natural: res_natural.insertId,
            id_users: res_users.insertId,
            id_email: res_email.insertId,
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error al crear la persona natural. ' + error
        })
    }
}