import  { pool } from '../mysql_db.js';
import redisClient from '../redis_db.js';
import { KEY_REDIS_EXPIRY } from '../config.js';
import { validation } from '../util/validate.js';

export const getProjects = async (req, res) => {
    const cacheKey = `projects:${1}`;
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
        const [rows] = await pool.query(
            'SELECT p.id, p.name, p.ruc, p.rs, p.amount, p.id_employees, p.date_start, p.date_end, e.name AS name_employee, e.last_name ' +
            'FROM project p ' +
            'JOIN employees e ON p.id_employees = e.id ' +
            'WHERE p.id_user = ? AND p.state = 1 ' +
            'ORDER BY p.id ASC',
            [1]
        );
        // 3. Guardar en Redis por 100 minutos
        await redisClient.set(cacheKey, JSON.stringify(rows), {
            EX: KEY_REDIS_EXPIRY // 60 * 60 * 12 horas
        });
        res.status(200).json({
            status: 'success',
            message: 'Proyectos obtenidos correctamente.',
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener los proyectos. | ' + error,
        })
    };
}
export const createProject = async (req, res) => {
    const { name, ruc, rs, amount, id_employees, date_start, date_end, date_record } = req.body;

    //validación básica
    const err =
            validation.name(name) ||
            validation.ruc(ruc) ||
            validation.rs(rs) ||
            validation.price(amount) ||
            validation.id(id_employees) ||
            validation.dateHour(date_start) ||
            validation.dateHour(date_end) ||
            validation.dateHour(date_record);
        
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }

    try {
        const [row] = await pool.query(
            'INSERT INTO project ' + 
            '(name, ruc, rs, amount, id_employees, date_start, date_end, date_record, id_user, state) ' + 
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, ruc, rs, amount, id_employees, date_start, date_end, date_record, 1, 1]
        )
        const [newProject] = await pool.query(
            'SELECT p.id, p.name, p.ruc, p.rs, p.amount, p.id_employees, p.date_start, p.date_end, e.name AS name_employee, e.last_name ' +
            'FROM project p ' +
            'JOIN employees e ON p.id_employees = e.id ' +
            'WHERE p.state = 1 AND p.id = ? AND p.id_user = ?',
            [row.insertId, 1] // Aquí usas el id del usuario del token
        );

        // Actualizar el caché en Redis
        const cacheKey = `projects:${1}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            const projectsList = JSON.parse(cachedData);
            projectsList.push(newProject[0]); // agrega nuevo projecto a la lista
            await redisClient.set(cacheKey, JSON.stringify(projectsList), { EX: KEY_REDIS_EXPIRY }); // actualiza cache
        }
        res.status(201).json({
            status: 'success',
            message: `El proyecto "${name}" ha sido creado exitosamente.`,
            data: newProject[0]
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
    let {name, ruc, rs, amount, id_employees, date_start, date_end} = req.body
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
        validation.name(name) ||
        validation.ruc(ruc) ||
        validation.rs(rs) ||
        validation.price(amount) ||
        validation.id(id_employees) ||
        validation.dateHour(date_start) ||
        validation.dateHour(date_end);
    
    if (err) {
        return res.status(400).json({ status: 'error', message: err });
    }

    try {
        const [result] = await pool.query(
            `UPDATE project SET  
            name = IFNULL(?, name),  
            ruc = IFNULL(?, ruc),  
            rs = IFNULL(?, rs),  
            amount = IFNULL(?, amount),  
            id_employees = IFNULL(?, id_employees), 
            date_start = IFNULL(?, date_start), 
            date_end = IFNULL(?, date_end) 
            WHERE state = 1 AND id = ? AND id_user = ?`,
            [name, ruc, rs, amount, id_employees, date_start, date_end, id, 1]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Proyecto no encontrado o no actualizado.'
            })
        }
        const [row] = await pool.query(
            'SELECT p.id, p.name, p.ruc, p.rs, p.amount, p.id_employees, p.date_start, p.date_end, e.name AS name_employee, e.last_name ' +
            'FROM project p ' +
            'JOIN employees e ON p.id_employees = e.id ' +
            'WHERE p.state = 1 AND p.id = ? AND p.id_user = ?',
            [id, 1] // Aquí usas el id del usuario del token
        );
        // 🔄 Actualizar Redis
        const cacheKey = `projects:${1}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            let proyectList = JSON.parse(cachedData);
            const index = proyectList.findIndex(e => e.id === parseInt(id));
            if (index !== -1) {
                // Actualiza los campos
                proyectList[index] = {
                    ...proyectList[index],
                    name, ruc, rs, amount, id_employees, date_start, date_end
                };
                await redisClient.set(cacheKey, JSON.stringify(proyectList), { EX: KEY_REDIS_EXPIRY });
            }
        }
        res.status(200).json({
            status: 'success',
            message: `Proyecto "${row[0].name}" actualizado correctamente.`,
            data: row[0]
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
    try {
        const [result] = await pool.query(
            `UPDATE project   
            SET state = 0 WHERE state = 1 AND id = ? AND id_user = ?`, 
            [id, 1]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Proyecto no encontrado.' 
            });
        };
        // 🔄 Eliminar del caché Redis
        const cacheKey = `projects:${1}`;
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