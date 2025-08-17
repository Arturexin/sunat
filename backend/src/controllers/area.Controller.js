import { pool } from '../mysql_db.js';
import { validation } from '../util/validate.js';
import redisClient from "../redis_db.js";
import { KEY_REDIS_EXPIRY } from '../config.js';

export const getAreas = async (req, res) =>{
    const cacheKey = `areas:${1}`;
    try {
        // 1. Buscar en caché
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                status: 'success',
                message: 'Areas obtenidas desde cache.',
                data: JSON.parse(cachedData)
            });
        }
        // 2. Si no hay cache, consulta base de datos
        const [rows] = await pool.query(
            'SELECT a.id, a.name, a.amount, a.id_location, a.date_record, l.name AS name_location ' +
            'FROM area a ' +
            'JOIN location l ON a.id_location = l.id ' +
            'WHERE a.state = 1 AND a.id_user = ? ' +
            'ORDER BY a.id ASC',
            [1] // Aquí usas el id del usuario del token
        );
        // 3. Guardar en Redis por 100 minutos
        await redisClient.set(cacheKey, JSON.stringify(rows), {
            EX: KEY_REDIS_EXPIRY // 60 * 60 * 12 horas
        });
        res.status(200).json({
            status: 'success',
            message: 'Areas obtenidas correctamente.',
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener las áreas. | ' + error,
        });
    };
}
function validateAreaFields(fields) {
    return (
        validation.name(fields.name) ||
        validation.price(fields.amount) ||
        validation.id(fields.id_location) ||
        validation.dateHour(fields.date_record)
    );
}
export const createArea = async (req, res) => {
    let { name, amount, id_location, date_record } = req.body
    // Sanitización manual (elimina espacios y caracteres peligrosos básicos)
    // Validación manual
    const err = validateAreaFields({ name, amount, id_location, date_record });
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
            'INSERT INTO area ' + 
            '(`name`, `amount`, `date_record`, `id_location`, `id_user`, `state`) ' +
            'VALUES (?, ?, ?, ?, ?, ?)', 
            [name, amount, date_record, id_location, 1, 1] // Aquí usas el id del usuario del token
        )

        const [newArea] = await pool.query(
            'SELECT a.id, a.name, a.amount, a.id_location, a.date_record, l.name AS name_location ' +
            'FROM area a ' +
            'JOIN location l ON a.id_location = l.id ' +
            'WHERE a.state = 1 AND a.id = ? AND a.id_user = ?',
            [row.insertId, 1] // Aquí usas el id del usuario del token
        );

        // 🔄 Actualizar el caché en Redis
        const cacheKey = `areas:${1}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            const areaList = JSON.parse(cachedData);
            areaList.push(newArea[0]); // agrega nueva área
            await redisClient.set(cacheKey, JSON.stringify(areaList), { EX: KEY_REDIS_EXPIRY }); // actualiza cache
        }
        res.status(201).json({
            status: 'success',
            message: `El área "${name}" ha sido creada exitosamente.`,
            data: newArea[0]
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede crear el área. | ' + error,
        });
    };
};

export const updateArea = async (req, res) => {
    const {id} = req.params;
    let {name, amount, id_location} = req.body
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID del área requerido.' 
        });
    }

    // Sanitización manual (elimina espacios y caracteres peligrosos básicos)
    // Validación manual
    const err =
        validation.name(name) ||
        validation.price(amount) ||
        validation.id(id_location);
    
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }

    try {
        const [result] = await pool.query(
            `UPDATE area SET 
            name = IFNULL(?, name), 
            amount = IFNULL(?, amount), 
            id_location = IFNULL(?, id_location) 
            WHERE state = 1 AND id = ? AND id_user = ?`,
            [name, amount, id_location, id, 1]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Area no encontrada o no actualizada.'
            })
        }
        const [row] = await pool.query(
            'SELECT a.id, a.name, a.amount, a.id_location, a.date_record, l.name AS name_location ' +
            'FROM area a ' +
            'JOIN location l ON a.id_location = l.id ' +
            'WHERE a.state = 1 AND a.id = ? AND a.id_user = ?',
            [id, 1] // Aquí usas el id del usuario del token
        );
        // 🔄 Actualizar Redis
        const cacheKey = `areas:${1}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let areaList = JSON.parse(cachedData);
            const index = areaList.findIndex(e => e.id === parseInt(id));
            if (index !== -1) {
                // Actualiza los campos
                areaList[index] = {
                    ...areaList[index],
                    name, amount, id_location
                };
                await redisClient.set(cacheKey, JSON.stringify(areaList), { EX: KEY_REDIS_EXPIRY });
            }
        }
        res.status(200).json({
            status: 'success',
            message: `Area "${row[0].name}" actualizada correctamente.`,
            data: row[0]
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede actualizar el área. | ' + error,
        });
    };
};

export const deleteArea = async (req, res) => {
    const { id } = req.params;
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID de proyecto requerido.' 
        });
    };
    try {
        const [result] = await pool.query(
            `UPDATE area   
            SET state = 0 WHERE state = 1 AND id = ? AND id_user = ?`, 
            [id, 1]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Area no encontrada.' 
            });
        };
        // 🔄 Eliminar del caché Redis
        const cacheKey = `areas:${1}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let areaList = JSON.parse(cachedData);
            areaList = areaList.filter(e => e.id !== parseInt(id));
            await redisClient.set(cacheKey, JSON.stringify(areaList), { EX: KEY_REDIS_EXPIRY });
        }
        res.json({ 
            status: 'success', 
            message: 'Area eliminada correctamente.'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'No se puede eliminar el área.' 
        });
    };
};