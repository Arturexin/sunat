import { pool } from '../mysql_db.js';
import { validation } from '../util/validate.js';

export const getTransit = async (req, res) => {

    const { id_project, id_location, id_employee, id_area } = req.query;

    try {
        const [rows] = await pool.query(
            'SELECT t.id, t.tipo, t.serie, t.n_serie, t.ruc, t.rs, t.concept, t.amount, t.e_c, t.c_c, t.cpe, t.date_record, t.id_project, t.id_location, t.id_employees, ' +
            'p.name AS name_project, l.name AS name_location, e.name AS name_employee, e.last_name AS last_name_employee, a.name AS name_area ' +
            'FROM transit t ' +
            'JOIN project p ON t.id_project = p.id ' +
            'JOIN location l ON t.id_location = l.id ' +
            'JOIN employees e ON t.id_employees = e.id ' +
            'JOIN area a ON t.id_area = e.id ' +
            'WHERE t.id_user = ? ' +
            'AND (? = "0" OR t.id_project = ?) ' + 
            'AND (? = "0" OR t.id_location = ?) ' + 
            'AND (? = "0" OR t.id_employees = ?) ' +
            'AND (? = "0" OR t.id_area = ?) ' +
            'AND t.state = 1 ' +
            'ORDER BY t.id ASC',
            [1, id_project, id_project, id_location, id_location, id_employee, id_employee, id_area, id_area]
        )
        res.status(200).json({
            status: 'success',
            message: 'Comprobantes obtenidos correctamente.',
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener los comprobantes. | ' + error,
        })
    }
}

export const createTransitBulk = async (req, res) => {
    const {comprobante} = req.body; // Espera un array de objetos en req.body.transits

    if (!Array.isArray(comprobante) || comprobante.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Se requiere un array de comprobantes para la inserción masiva.'
        });
    }

    // Prepara los valores para la consulta
    const values = comprobante.map(item => [
        item['TIPO'], item['SERIE'], item['Nº SERIE'], item['RUC'], item['RAZÓN SOCIAL DE PROVEEDOR'], 
        item['CONCEPTO'], item['IMPORTE TOTAL EN SOLES'], item['ESTADO DEL CONTRIBUYENTE'], item['CONDICION DEL CONTRIBUYENTE'], 
        item['OBSERVACION CONSULTA CPE'], item['FECHA'], 1, item.id_project, item.id_location, item.id_employee, item.id_area, 1
    ]);

    try {
        const [result] = await pool.query(
            'INSERT INTO transit ' +
            '(tipo, serie, n_serie, ruc, rs, concept, amount, e_c, c_c, cpe, date_record, id_user, id_project, id_location, id_employees, id_area, state) ' +
            'VALUES ?',
            [values]
        );
        res.status(201).json({
            status: 'success',
            message: `Se han guardado ${result.affectedRows} comprobantes exitosamente.`,
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden crear los comprobantes. | ' + error,
        });
    }
};


export const createTransit = async (req, res) => {
    let { tipo, serie, n_serie, ruc, rs, concept, amount, e_c, c_c, cpe, date_record, id_project, id_location, id_area, id_employee } = req.body;

    try {
        const [row] = await pool.query(
            'INSERT INTO transit ' +
            '(tipo, serie, n_serie, ruc, rs, concept, amount, e_c, c_c, cpe, date_record, id_user, id_project, id_location, id_area, id_employees, state) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [tipo, serie, n_serie, ruc, rs, concept, amount, e_c, c_c, cpe, date_record, 1, id_project, id_location, id_area, id_employee, 1]
        )
        const [newTransit] = await pool.query(
            'SELECT t.id, t.tipo, t.serie, t.n_serie, t.ruc, t.rs, t.concept, t.amount, t.e_c, t.c_c, t.cpe, t.date_record, t.id_project, t.id_location, t.id_employees ' +
            'p.name AS name_project, l.name AS name_location, e.name AS name_employee, e.last_name AS last_name_employee, a.name AS name_area ' +
            'FROM transit t ' + 
            'JOIN project p ON t.id_project = p.id ' +
            'JOIN location l ON t.id_location = l.id ' +
            'JOIN employees e ON t.id_employees = e.id ' +
            'JOIN area a ON t.id_area = e.id ' +
            'WHERE t.state = 1 AND  t.id_user = ? AND t.id_project = ?', 
            [row.insertId, id_project]
        )
        res.status(201).json({
            status: 'success',
            message: `El comprobante "${serie}-${n_serie}" ha sido guardado exitosamente.`,
            data: newTransit[0]
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede crear el comprobante. | ' + error,
        });
    }
}

export const updateTransit = async (req, res) => {
    const { id } = req.params;
    let { tipo, serie, n_serie, ruc, rs, concept, amount, e_c, c_c, cpe, date_record, id_project, id_location, id_employees, id_area } = req.body
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID de comprobante requerido.' 
        });
    }

    try {
        const [result] = await pool.query(
            `UPDATE transit SET 
            tipo = IFNULL(?, tipo), 
            serie = IFNULL(?, serie), 
            n_serie = IFNULL(?, n_serie), 
            ruc = IFNULL(?, ruc), 
            rs = IFNULL(?, rs), 
            concept = IFNULL(?, concept), 
            amount = IFNULL(?, amount), 
            e_c = IFNULL(?, e_c), 
            c_c = IFNULL(?, c_c), 
            cpe = IFNULL(?, cpe), 
            date_record = IFNULL(?, date_record), 
            id_project = IFNULL(?, id_project), 
            id_location = IFNULL(?, id_location), 
            id_employees = IFNULL(?, id_employees) 
            id_area = IFNULL(?, id_area) 
            WHERE state = 1 AND id = ? AND id_user = ?`,
            [tipo, serie, n_serie, ruc, rs, concept, amount, e_c, c_c, cpe, date_record, id_project, id_location, id_employees, id_area, id, 1]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Comprobante no encontrado o no actualizado.'
            });
        }
        const [row] = await pool.query(
            'SELECT id, tipo, serie, n_serie, ruc, rs, concept, amount, e_c, c_c, cpe, date_record, id_project, id_location, id_employees ' +
            'p.name AS name_project, l.name AS name_location, e.name AS name_employee, e.last_name AS last_name_employee, a.name AS name_area ' +
            'FROM transit t ' +
            'JOIN project p ON t.id_project = p.id ' +
            'JOIN location l ON t.id_location = l.id ' +
            'JOIN employees e ON t.id_employees = e.id ' +
            'JOIN area a ON t.id_area = e.id ' +
            'WHERE state = 1 AND id = ? AND id_user = ?',
            [id, 1] // Aquí usas el id del usuario del token
        );
        if (row.length === 0) {
            res.status(200).json({
                status: 'success',
                message: `El comprobante "${serie}-${n_serie}" ha sido actualizado correctamente.`,
                data: row[0]
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede actualizar el comprobante. | ' + error,
        });
    };
};

export const deleteTransit = async (req, res) => {
    const { id } = req.params;
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID del comprobante requerido.' 
        });
    };

    try {
        const [result] = await pool.query(
            `UPDATE transit 
            SET state = 0 WHERE state = 1 AND id = ? AND id_user = ?`, 
            [id, 1]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Comprobante no encontrado.' 
            });
        };
        res.json({ 
            status: 'success', 
            message: 'Comprobante eliminado correctamente.'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'No se puede eliminar el colaborador.' 
        });
    };
};