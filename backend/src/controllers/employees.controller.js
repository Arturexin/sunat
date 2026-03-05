import { pool } from '../mysql_db.js';
import { validation } from '../util/validate.js';
import { docExists } from '../util/val_user.js';
import redisClient from "../redis_db.js";
import { KEY_REDIS_EXPIRY, ACTIVO } from '../config.js';


export const getSelectEmployees = async (req, res) => {
    const id_user = req.user.ID_USER;
    try {
        const [row] = await pool.query(
            'CALL sp_list_responsable(?)',
            [id_user]
        )

        res.status(200).json({
            status: 'success',
            message: 'Responsables obtenidos correctamente.',
            data: row?.[0] ?? []
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener los responsables. | ' + error
        })
    }
}

export const getRoles = async (req, res) => {
    try {
        const [row] =await pool.query(
            'SELECT * FROM v_roles_select'
        )
        res.status(200).json({
            status:'success',
            message: 'Roles obtenidos correctamente.',
            data: row
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener los roles. | ' + error,
        });
    }
}
export const getEmployees = async (req, res) =>{
    const cacheKey = `employees:${req.user.ID_USER}`;
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
        const [employees] = await pool.query(
            `CALL sp_list_employees(?, ?)`,
            [req.user.ID_USER, ACTIVO]
        )
        // 3. Guardar en Redis por 100 minutos
        await redisClient.set(cacheKey, JSON.stringify(employees[0]), {
            EX: KEY_REDIS_EXPIRY // 60 * 60 * 12 horas
        });
        res.status(200).json({
            status: 'success',
            message: 'Colaboradores obtenidos correctamente.',
            data: employees[0]?.[0] ?? []
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener los colaboradores. | ' + error,
        });
    };
}

export const createEmployee = async (req, res) => {
    let { NAME, LAST_NAME, NUMBER_DOCUMENT, NUMBER_MOVIL, ID_ROLE } = req.body
    const cacheKey = `employees:${req.user.ID_USER}`;

    const err = validation.name(NAME) ||
                validation.last_name(LAST_NAME) ||
                validation.dni(NUMBER_DOCUMENT) ||
                validation.phone(NUMBER_MOVIL) ||
                validation.role(ID_ROLE)
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }
    // Verificar si el doc ya existe
    const docCheck = await docExists(pool, NUMBER_DOCUMENT, req.user.ID_USER);
    if (docCheck) { 
        return res.status(409).json({
            status: 'error',
            message: `El documento de identidad ${NUMBER_DOCUMENT} ya está registrado.`
        });
    }

    const mysql = await pool.getConnection();
    try {
        // Llamar al SP con los 8 parámetros definidos en init.sql
        const spSql = 'CALL sp_create_employee(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const spArgs = [
            NAME, 
            LAST_NAME, 
            NUMBER_DOCUMENT, 
            null, // número de teléfono fijo
            NUMBER_MOVIL, 
            ID_ROLE, 
            1, // tipo de documento
            '01', // código de área
            req.user.ID_USER, 
            null, // dirección
            null, // género
            ACTIVO
        ];

        const [rows] = await mysql.query(spSql, spArgs);
        const resultRows = Array.isArray(rows) ? rows[0] : rows;
        const created = resultRows && resultRows[0] ? resultRows[0] : null;

        if (!created) {
            return res.status(500).json({
                status: 'error',
                message: 'No se recibió respuesta del SP al crear el colaborador.'
            });
        }

        // Actualizar/invalidar caché
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            const list = JSON.parse(cached);
            list.unshift(created); // agrega al inicio
            await redisClient.set(cacheKey, JSON.stringify(list), { EX: KEY_REDIS_EXPIRY });
        } else {
            await redisClient.set(cacheKey, JSON.stringify([created]), { EX: KEY_REDIS_EXPIRY });
        }

        return res.status(201).json({
            status: 'success',
            message: `El colaborador ${NAME} ${LAST_NAME} ha sido creado exitosamente.`,
            data: created
        });

    } catch (error) {
        // No hay transacción local; el SP maneja su propia transacción interna
        return res.status(500).json({
            status: 'error',
            message: 'No se puede crear el colaborador. | ' + error,
        });
    } finally {
        mysql.release();
    }
};

export const updateEmployee = async (req, res) => {
    const {id} = req.params;
    let { ID_NATURAL, NAME, LAST_NAME, NUMBER_DOCUMENT, NUMBER_MOVIL, ID_ROLE } = req.body
    // let {name, last_name, doc, phone, position} = req.body
    // Validación básica
    const err = validation.name(NAME) ||
                validation.last_name(LAST_NAME) ||
                validation.dni(NUMBER_DOCUMENT) ||
                validation.phone(NUMBER_MOVIL) ||
                validation.role(ID_ROLE)
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }
    const mysql = await pool.getConnection();

    try {
        const spSql = 'CALL sp_update_employee(?, ?, ?, ?, ?, ?, ?)';
        const spArgs = [
            id,
            req.user.ID_USER, 
            NAME, 
            LAST_NAME, 
            NUMBER_DOCUMENT, 
            NUMBER_MOVIL, 
            ID_ROLE
        ]
        const [rows] = await mysql.query(spSql, spArgs);
        const resultRows = Array.isArray(rows) ? rows[0] : rows;
        const created = resultRows && resultRows[0] ? resultRows[0] : null;

        if (!created) {
            return res.status(500).json({
                status: 'error',
                message: 'No se recibió respuesta del SP al crear el colaborador.'
            });
        }
        // 🔄 Actualizar Redis
        const cacheKey = `employees:${req.user.ID_USER}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let employeeList = JSON.parse(cachedData);
            const index = employeeList.findIndex(e => e.ID_NATURAL === parseInt(id));
            if (index !== -1) {
                // Actualiza los campos
                employeeList[index] = {
                    ...employeeList[index],
                    ID_NATURAL, NAME, LAST_NAME, NUMBER_DOCUMENT, NUMBER_MOVIL, ID_ROLE
                };
                await redisClient.set(cacheKey, JSON.stringify(employeeList), { EX: KEY_REDIS_EXPIRY });
            }
        }
        res.status(200).json({
            status: 'success',
            message: `Colaborador "${created.NAME} ${created.LAST_NAME}" actualizado correctamente.`,
            data: created
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
    const mysql = await pool.getConnection();

    try {
        const spSql = 'CALL sp_delete_employee(?, ?)';
        const spArgs = [
            id,
            req.user.ID_USER
        ]
        const [result] = await mysql.query(spSql, spArgs);
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Colaborador no encontrado.' 
            });
        };
        await mysql.release();  
        // 🔄 Eliminar del caché Redis
        const cacheKey = `employees:${req.user.ID_USER}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let employeeList = JSON.parse(cachedData);
            employeeList = employeeList.filter(e => e.ID_NATURAL !== parseInt(id));
            await redisClient.set(cacheKey, JSON.stringify(employeeList), { EX: KEY_REDIS_EXPIRY });
        }
        res.json({ 
            status: 'success', 
            message: 'Colaborador eliminado correctamente.'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'No se puede eliminar el colaborador. | ' + error,
        });
    };
};