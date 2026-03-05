import { pool } from '../mysql_db.js';



export const getCoins = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM v_coins ORDER BY ISO ASC');
        return res.status(200).json({
            status: 'success',
            data: rows
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error al obtener las monedas.'
        })
    }
}

export const getUsers = async (req, res) => {

    try {
        const [rows] = await pool.query('SELECT ID_USER, ID_ENTITY, PASSWORD_HASH, DATE_RECORD, STATE ' +
                                        'FROM users')
        return res.status(200).json({
            status: 'success',
            data: rows
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error al obtener los usuarios.'
        })
    } 
}