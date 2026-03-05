import { pool } from '../mysql_db.js';
import redisClient from '../redis_db.js';
import { KEY_REDIS_EXPIRY, ACTIVO } from '../config.js';
import { validation } from '../util/validate.js';

export const getSelectLocations= async (req, res) => {
    const id_user = req.user.ID_USER;
    try {
        const [select] = await pool.query(
            'CALL sp_select_locations(?)',
            [id_user]
        )
        res.status(200).json({
            status: 'success',
            message: 'Data obtenida correctamente.',
            data: select?.[0] || []
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener la data. | ' + error,
        })
    }
}

export const getLocations = async (req, res) => {
    const id_user = req.user.ID_USER;
    const cacheKey = `locations:${id_user}`;
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
        const [locations] = await pool.query(
            `CALL sp_list_locations(?, ?)`,
            [id_user, ACTIVO]
        )

        // 3. Guardar en Redis por 100 minutos
        await redisClient.set(cacheKey, JSON.stringify(locations[0]), {
            EX: KEY_REDIS_EXPIRY
        });
        res.status(200).json({
            status: 'success',
            message: 'Locaciones obtenidas correctamente.',
            data: locations?.[0] ?? []
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener las locaciones. | ' + error,
        });
    };
};

export const createLocation = async (req, res) => {
    const id_user = req.user.ID_USER;
    let { NAME, ADDRESS, AMOUNT, DATE_START, DATE_END, ID_PROJECT, ID_COIN } = req.body;
    //validación básica
    const err = 
        validation.location(NAME) ||
        validation.address(ADDRESS) ||
        validation.price(AMOUNT) ||
        validation.dateHour(DATE_START) ||
        validation.dateHour(DATE_END) ||
        validation.id(ID_PROJECT) ||
        validation.id(ID_COIN); 
    
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    };
    const mysql = await pool.getConnection();
    try {
        const spSQL = 'CALL sp_create_location(?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const spArgs = [
            id_user,
            ID_PROJECT,
            NAME,
            ADDRESS,
            AMOUNT,
            DATE_START,
            DATE_END,
            ID_COIN,
            ACTIVO
        ]
        const [row] = await mysql.query(spSQL, spArgs);
        const resultRow = Array.isArray(row) ? row[0] : row;
        const created = resultRow && resultRow[0] ? resultRow[0] : null;

        if (!created) {
            return res.status(500).json({
                status: 'error',
                message: 'No se pudo crear la locación.'
            })
        }

        // 🔄 Actualizar el caché en Redis
        const cacheKey = `locations:${id_user}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            const locationList = JSON.parse(cachedData);
            locationList.push(created); // agrega nuevo empleado
            await redisClient.set(cacheKey, JSON.stringify(locationList), { EX: KEY_REDIS_EXPIRY }); // actualiza cache
        }
        res.status(201).json({
            status: 'success',
            message: `Locación "${NAME}" creada exitosamente.`,
            data: created
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede crear la locación. | ' + error,
        });
    };
};

export const updateLocation = async (req, res) => {
    const id_user = req.user.ID_USER;
    const {id} = req.params;
    let {ID_LOCATION, NAME, ID_ADDRESS, ADDRESS, AMOUNT, DATE_START, DATE_END, ID_PROJECT, ID_COIN} = req.body
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
        validation.location(NAME) ||
        validation.address(ADDRESS) ||
        validation.price(AMOUNT) ||
        validation.dateHour(DATE_START) ||
        validation.dateHour(DATE_END) ||
        validation.id(ID_PROJECT) ||
        validation.id(ID_COIN); 
    
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    };
    const mysql = await pool.getConnection();
    try {
        const spSql = 'CALL sp_update_location(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const spArgs = [
            id_user,
            id,
            ID_PROJECT, 
            NAME, 
            ID_ADDRESS, 
            ADDRESS, 
            AMOUNT, 
            DATE_START, 
            DATE_END, 
            ID_COIN
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
        const cacheKey = `locations:${id_user}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let locationList = JSON.parse(cachedData);
            const index = locationList.findIndex(e => e.ID_LOCATION === parseInt(id));
            if (index !== -1) {
                // Actualiza los campos
                locationList[index] = {
                    ...locationList[index],
                    ...created
                };
                await redisClient.set(cacheKey, JSON.stringify(locationList), { EX: KEY_REDIS_EXPIRY });
            }
        }
        res.status(200).json({
            status: 'success',
            message: `Locación "${created.NAME}" actualizada correctamente.`,
            data: created
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede actualizar la locación. | ' + error,
        });
    };
};

export const deleteLocation = async (req, res) => {
    const id_user = req.user.ID_USER;
    const { id } = req.params;
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID de locación requerido.' 
        });
    };
    const mysql = await pool.getConnection();
    try {
        const spSql = 'CALL sp_delete_location(?, ?)';
        const spArgs = [
            id_user,
            id,
        ]
        const [result] = await mysql.query(spSql, spArgs);
        console.log(result)
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Locación no encontrada.' 
            });
        };
        await mysql.release();  
        // 🔄 Eliminar del caché Redis
        const cacheKey = `locations:${id_user}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let locationList = JSON.parse(cachedData);
            locationList = locationList.filter(e => e.ID_LOCATION !== parseInt(id));
            await redisClient.set(cacheKey, JSON.stringify(locationList), { EX: KEY_REDIS_EXPIRY });
        }
        res.json({ 
            status: 'success', 
            message: 'Locación eliminada correctamente.'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'No se puede eliminar la locación. | ' + error
        });
    };
};
