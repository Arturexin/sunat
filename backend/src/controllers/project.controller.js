import  { pool } from '../mysql_db.js';
import redisClient from '../redis_db.js';
import { KEY_REDIS_EXPIRY, ACTIVO } from '../config.js';
import { validation } from '../util/validate.js';

export const getSelectProjects = async (req, res) => {
    const id_user = req.user.ID_USER;
    try {
        const [rows] = await pool.query(
            'CALL sp_select_projects(?)',
            [id_user]
        );
        res.status(200).json({
            status: 'success',
            message: 'Proyectos obtenidos correctamente.',
            data: rows?.[0] ?? []
        })
    } catch (error) {   
        return res.status(500).json({
            status: 'error',
            message: 'No se puede obtener los proyectos. | ' + error
        })
    }
}

export const getEmpresa = async (req, res) => {
    const id_user = req.user.ID_USER;
    try {
        const [row] = await pool.query(
            'CALL sp_list_empresa(?)',
            [id_user]
        )
        res.status(200).json({
            status: 'success',
            message: 'Empresas obtenidas correctamente.',
            data: row?.[0] ?? []
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener las empresas. | ' + error
        })
    }
}
export const getProjects = async (req, res) => {
    const id_user = req.user.ID_USER;
    
    const cacheKey = `projects:${id_user}`;
    try {
        // 1. Buscar en caché
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                status: 'success',
                message: 'Proyectos obtenidos desde cache.',
                data: JSON.parse(cachedData)
            });
        }
        // 2. Si no hay cache, consulta base de datos

        const [projects] = await pool.query(
            `CALL sp_list_projects(?, ?)`,
            [id_user, ACTIVO]
        )
        // 3. Guardar en Redis por 100 minutos
        await redisClient.set(cacheKey, JSON.stringify(projects[0]), {
            EX: KEY_REDIS_EXPIRY // 60 * 60 * 12 horas
        });
        res.status(200).json({
            status: 'success',
            message: 'Proyectos obtenidos correctamente.',
            data: projects?.[0] ?? []
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener los proyectos. | ' + error,
        })
    };
}
export const createProject = async (req, res) => {
    const { NAME, ID_JURIDIC, AMOUNT, ID_NATURAL, DATE_START, DATE_END } = req.body;
    const id_user = req.user.ID_USER;
    // validación básica
    const err =
            validation.name(NAME) ||
            validation.id(ID_JURIDIC) ||
            validation.price(AMOUNT) ||
            validation.id(ID_NATURAL) ||
            validation.dateHour(DATE_START) ||
            validation.dateHour(DATE_END);
        
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }
    const mysql = await pool.getConnection();
    try {
        const spSQL = 'CALL sp_create_project(?, ?, ?, ?, ?, ?, ?, ?)';
        const spArgs = [
            id_user,
            NAME,
            ID_JURIDIC,
            AMOUNT,
            ID_NATURAL,
            DATE_START,
            DATE_END,
            ACTIVO
        ]
        const [row] = await mysql.query(spSQL, spArgs);
        const resultRow = Array.isArray(row) ? row[0] : row;
        const created = resultRow && resultRow[0] ? resultRow[0] : null;

        if (!created) {
            return res.status(500).json({
                status: 'error',
                message: 'No se pudo crear el proyecto.'
            })
        }
        // Actualizar el caché en Redis
        const cacheKey = `projects:${id_user}`;
        const cachedData = await redisClient.get(cacheKey);
        
        if (cachedData) {
            const projectsList = JSON.parse(cachedData);
            projectsList.push(created); // agrega nuevo projecto a la lista
            await redisClient.set(cacheKey, JSON.stringify(projectsList), { EX: KEY_REDIS_EXPIRY }); // actualiza cache
        }
        res.status(201).json({
            status: 'success',
            message: `El proyecto "${NAME}" ha sido creado exitosamente.`,
            data: created
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede crear el proyecto. | ' + error,
        });
    };
}

export const updateProject = async (req, res) => {
    const {id} = req.params;
    const id_user = req.user.ID_USER;
    let {ID_PROJECT, NAME, ID_JURIDIC, AMOUNT, ID_NATURAL, DATE_START, DATE_END} = req.body
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID del proyecto requerido.' 
        });
    }

    // Sanitización manual (elimina espacios y caracteres peligrosos básicos)
    // Validación manual
   const err =
            validation.id(ID_PROJECT) ||
            validation.name(NAME) ||
            validation.id(ID_JURIDIC) ||
            validation.price(AMOUNT) ||
            validation.id(ID_NATURAL) ||
            validation.dateHour(DATE_START) ||
            validation.dateHour(DATE_END);
        
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }
    const mysql = await pool.getConnection();

    try {
        const spSql = 'CALL sp_update_project(?, ?, ?, ?, ?, ?, ?, ?)';
        const spArgs = [
            id_user,
            id,
            NAME,
            ID_JURIDIC,
            AMOUNT,
            ID_NATURAL,
            DATE_START,
            DATE_END
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
        const cacheKey = `projects:${id_user}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let proyectList = JSON.parse(cachedData);
            const index = proyectList.findIndex(e => e.ID_PROJECT === parseInt(id));
            if (index !== -1) {
                // Actualiza los campos
                proyectList[index] = {
                    ...proyectList[index],
                    ...created
                };
                console.log('proyectList[index]', proyectList[index])
                await redisClient.set(cacheKey, JSON.stringify(proyectList), { EX: KEY_REDIS_EXPIRY });
            }
        }
        res.status(200).json({
            status: 'success',
            message: `Proyecto "${created.NAME}" actualizado correctamente.`,
            data: created
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede actualizar el proyecto. | ' + error,
        });
    };
};

export const deleteProject = async (req, res) => {
    const { id } = req.params;
    // Validación básica
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'ID de proyecto requerido.' 
        });
    };
    const mysql = await pool.getConnection();
    try {
        const spSql = 'CALL sp_delete_project(?, ?)';
        const spArgs = [
            req.user.ID_USER,
            id,
        ]
        const [result] = await mysql.query(spSql, spArgs);
        console.log(result)
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Proyecto no encontrado.' 
            });
        };
        await mysql.release();  
        // 🔄 Eliminar del caché Redis
        const cacheKey = `projects:${req.user.ID_USER}`;
        const cachedData = await redisClient.get(cacheKey);
        
        if (cachedData) {
            let projectList = JSON.parse(cachedData);
            projectList = projectList.filter(e => e.id !== parseInt(id));
            await redisClient.set(cacheKey, JSON.stringify(projectList), { EX: KEY_REDIS_EXPIRY });
        }
        res.json({ 
            status: 'success', 
            message: 'Proyecto eliminado correctamente.'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'No se puede eliminar el proyecto.' 
        });
    };
};