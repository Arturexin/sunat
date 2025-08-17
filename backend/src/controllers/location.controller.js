import { pool } from '../mysql_db.js';
import redisClient from '../redis_db.js';
import { KEY_REDIS_EXPIRY } from '../config.js';
import { validation } from '../util/validate.js';

export const getLocations = async (req, res) => {
    const cacheKey = `locations:${1}`;
    try {
        // 1. Buscar en caché
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                status: 'success',
                message: 'Locaciones obtenidas desde cache.',
                data: JSON.parse(cachedData)
            });
        }
        // 2. Si no hay cache, consulta base de datos
        const [rows] = await pool.query(
            'SELECT l.id, l.name, l.address, l.amount, l.date_start, l.date_end, l.date_record, l.id_project, p.name AS name_project ' +
            'FROM location l ' +
            'JOIN project p ON l.id_project = p.id ' +
            'WHERE l.id_user = ? AND l.state = 1 ' +
            'ORDER BY l.id ASC',
            [1]
        );
        // 3. Guardar en Redis por 100 minutos
        await redisClient.set(cacheKey, JSON.stringify(rows), {
            EX: KEY_REDIS_EXPIRY
        });
        res.status(200).json({
            status: 'success',
            message: 'Locaciones obtenidas correctamente.',
            data: rows
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener las locaciones. | ' + error,
        });
    };
};

export const createLocation = async (req, res) => {
    let { name, address, amount, date_start, date_end, date_record, id_project } = req.body;
    //validación básica
    const err = 
        validation.location(name) ||
        validation.address(address) ||
        validation.price(amount) ||
        validation.dateHour(date_start) ||
        validation.dateHour(date_end) ||
        validation.dateHour(date_record) ||
        validation.id(id_project); 
    
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    };

    try {
        const [row] = await pool.query(
            'INSERT INTO location ' +
            '(name, address, amount, date_start, date_end, date_record, id_project, id_user, state) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [ name, address, amount, date_start, date_end, date_record, id_project, 1, 1 ]
        )
        const [newLocation] = await pool.query(
            'SELECT l.id, l.name, l.address, l.amount, l.date_start, l.date_end, l.date_record, l.id_project, p.name AS name_project ' +
            'FROM location l ' +
            'JOIN project p ON l.id_project = p.id ' +
            'WHERE l.state = 1 AND l.id = ? AND l.id_user = ?',
            [row.insertId, 1] // Aquí usas el id del usuario del token
        );

        // 🔄 Actualizar el caché en Redis
        const cacheKey = `locations:${1}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            const locationList = JSON.parse(cachedData);
            locationList.push(newLocation[0]); // agrega nuevo empleado
            await redisClient.set(cacheKey, JSON.stringify(locationList), { EX: KEY_REDIS_EXPIRY }); // actualiza cache
        }
        res.status(201).json({
            status: 'success',
            message: `Locación "${name}" creada exitosamente.`,
            data: newLocation[0]
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede crear la locación. | ' + error,
        });
    };
};

export const updateLocation = async (req, res) => {
    const {id} = req.params;
    let {name, address, amount, date_start, date_end, id_project} = req.body
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID de la locación requerido.' 
        });
    }

    // Sanitización manual (elimina espacios y caracteres peligrosos básicos)
    // Validación manual
    const err =
        validation.location(name) ||
        validation.address(address) ||
        validation.price(amount) ||
        validation.dateHour(date_start) ||
        validation.dateHour(date_end) ||
        validation.id(id_project); 
    
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }

    try {
        const [result] = await pool.query(
            `UPDATE location SET  
            name = IFNULL(?, name),  
            address = IFNULL(?, address),  
            amount = IFNULL(?, amount),  
            date_start = IFNULL(?, date_start), 
            date_end = IFNULL(?, date_end), 
            id_project = IFNULL(?, id_project) 
            WHERE state = 1 AND id = ? AND id_user = ?`,
            [name, address, amount, date_start, date_end, id_project, id, 1]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Locación no encontrada o no actualizada.'
            })
        }
        const [row] = await pool.query(
            'SELECT l.id, l.name, l.address, l.amount, l.date_start, l.date_end, l.date_record, l.id_project, p.name AS name_project ' +
            'FROM location l ' +
            'JOIN project p ON l.id_project = p.id ' +
            'WHERE l.state = 1 AND l.id = ? AND l.id_user = ?',
            [id, 1] // Aquí usas el id del usuario del token
        );
        // 🔄 Actualizar Redis
        const cacheKey = `locations:${1}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let locationList = JSON.parse(cachedData);
            const index = locationList.findIndex(e => e.id === parseInt(id));
            if (index !== -1) {
                // Actualiza los campos
                locationList[index] = {
                    ...locationList[index],
                    name, address, amount, date_start, date_end, id_project
                };
                await redisClient.set(cacheKey, JSON.stringify(locationList), { EX: KEY_REDIS_EXPIRY });
            }
        }
        res.status(200).json({
            status: 'success',
            message: `Locación "${row[0].name}" actualizada correctamente.`,
            data: row[0]
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede actualizar la locación. | ' + error,
        });
    };
};

export const deleteLocation = async (req, res) => {
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
            `UPDATE location   
            SET state = 0 WHERE state = 1 AND id = ? AND id_user = ?`, 
            [id, 1]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Locación no encontrado.' 
            });
        };
        // 🔄 Eliminar del caché Redis
        const cacheKey = `locations:${1}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let locationList = JSON.parse(cachedData);
            locationList = locationList.filter(e => e.id !== parseInt(id));
            await redisClient.set(cacheKey, JSON.stringify(locationList), { EX: KEY_REDIS_EXPIRY });
        }
        res.json({ 
            status: 'success', 
            message: 'Locación eliminada correctamente.'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'No se puede eliminar la locación.' 
        });
    };
};
