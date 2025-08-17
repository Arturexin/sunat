import { pool } from '../mysql_db.js';
import { validation } from '../util/validate.js';
import redisClient from "../redis_db.js";
import { KEY_REDIS_EXPIRY } from '../config.js';

export const getEmployees = async (req, res) =>{
    const cacheKey = `employees:${1}`;
    try {
        // 1. Buscar en caché
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                status: 'success',
                message: 'Colaboradores obtenidos desde cache.',
                data: JSON.parse(cachedData)
            });
        }
        // 2. Si no hay cache, consulta base de datos
        const [rows] = await pool.query(
            'SELECT id, name, last_name, doc, phone, position, date_record ' +
            'FROM employees ' +
            'WHERE state = 1 AND id_user = ? ' +
            'ORDER BY id ASC',
            [1] // Aquí usas el id del usuario del token
        );
        // 3. Guardar en Redis por 100 minutos
        await redisClient.set(cacheKey, JSON.stringify(rows), {
            EX: KEY_REDIS_EXPIRY // 60 * 60 * 12 horas
        });
        res.status(200).json({
            status: 'success',
            message: 'Colaboradores obtenidos correctamente.',
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener los colaboradores. | ' + error,
        });
    };
}
function validateEmployeeFields(fields) {
    return (
        validation.name(fields.name) ||
        validation.last_name(fields.last_name) ||
        validation.dni(fields.doc) ||
        validation.phone(fields.phone) ||
        validation.rol(fields.position) ||
        validation.dateHour(fields.date_record)
    );
}
export const createEmployee = async (req, res) => {
    let { name, last_name, doc, phone, position, date_record } = req.body
    // Sanitización manual (elimina espacios y caracteres peligrosos básicos)
    // Validación manual
    const err = validateEmployeeFields({ name, last_name, doc, phone, position, date_record });
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }

    // Verificar si el doc ya existe
    // const docCheck = await docExists(pool, doc, req.user.id);
    // if (docCheck.validation) { 
    //     return res.status(409).json({
    //         status: 'error',
    //         message: `El documento de identidad ${docCheck.data[0].doc} ya está registrado.`
    //     });
    // }

    try {
        const [row] = await pool.query(
            'INSERT INTO employees ' + 
            '(`name`, `last_name`, `doc`, `phone`, `position`, `date_record`, `id_user`, `state`) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            [name, last_name, doc, phone, position, date_record, 1, 1] // Aquí usas el id del usuario del token
        )

        const [newEmployee] = await pool.query(
            'SELECT id, name, last_name, doc, phone, position, date_record ' +
            'FROM employees ' +
            'WHERE state = 1 AND id = ? AND id_user = ?',
            [row.insertId, 1] // Aquí usas el id del usuario del token
        );

        // 🔄 Actualizar el caché en Redis
        const cacheKey = `employees:${1}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            const employeeList = JSON.parse(cachedData);
            employeeList.push(newEmployee[0]); // agrega nuevo empleado
            await redisClient.set(cacheKey, JSON.stringify(employeeList), { EX: KEY_REDIS_EXPIRY }); // actualiza cache
        }
        res.status(201).json({
            status: 'success',
            message: `El colaborador ${name} ${last_name} ha sido creado exitosamente.`,
            data: newEmployee[0]
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede crear el colaborador. | ' + error,
        });
    };
};

export const updateEmployee = async (req, res) => {
    const {id} = req.params;
    let {name, last_name, doc, phone, position} = req.body
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID de colaborador requerido.' 
        });
    }
    // Sanitización manual (elimina espacios y caracteres peligrosos básicos)
    // Validación manual
    const err =
        validation.name(fields.name) ||
        validation.last_name(fields.last_name) ||
        validation.dni(fields.doc) ||
        validation.phone(fields.phone) ||
        validation.rol(fields.position);
    
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }

    try {
        const [result] = await pool.query(
            `UPDATE employees SET 
            name = IFNULL(?, name), 
            last_name = IFNULL(?, last_name), 
            doc = IFNULL(?, doc), 
            phone = IFNULL(?, phone), 
            position = IFNULL(?, position) 
            WHERE state = 1 AND id = ? AND id_user = ?`,
            [name, last_name, doc, phone, position, id, 1]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Colaborador no encontrado o no actualizado.'
            });
        }
        const [row] = await pool.query(
            `SELECT id, name, last_name, doc, phone, position 
            FROM employees 
            WHERE state = 1 AND id = ? AND id_user = ?`,
            [id, 1] // Aquí usas el id del usuario del token
        );
        // 🔄 Actualizar Redis
        const cacheKey = `employees:${1}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let employeeList = JSON.parse(cachedData);
            const index = employeeList.findIndex(e => e.id === parseInt(id));
            if (index !== -1) {
                // Actualiza los campos
                employeeList[index] = {
                    ...employeeList[index],
                    name, last_name, doc, phone, position
                };
                await redisClient.set(cacheKey, JSON.stringify(employeeList), { EX: KEY_REDIS_EXPIRY });
            }
        }
        res.status(200).json({
            status: 'success',
            message: `Colaborador "${row[0].name} ${row[0].last_name}" actualizado correctamente.`,
            data: row[0]
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede actualizar el colaborador. | ' + error,
        });
    };
};

export const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID del colaborador requerido.' 
        });
    };

    try {
        const [result] = await pool.query(
            `UPDATE employees   
            SET state = 0 WHERE state = 1 AND id = ? AND id_user = ?`, 
            [id, 1]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Colaborador no encontrado.' 
            });
        };
        // 🔄 Eliminar del caché Redis
        const cacheKey = `employees:${1}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let employeeList = JSON.parse(cachedData);
            employeeList = employeeList.filter(e => e.id !== parseInt(id));
            await redisClient.set(cacheKey, JSON.stringify(employeeList), { EX: KEY_REDIS_EXPIRY });
        }
        res.json({ 
            status: 'success', 
            message: 'Colaborador eliminado correctamente.'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'No se puede eliminar el colaborador.' 
        });
    };
};