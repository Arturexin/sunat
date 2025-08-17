import redisClient from "../redis_db.js";


export const postData = async (req, res) => {
    const datos = req.body;

    if (!datos || Object.keys(datos).length === 0) {
        return res.status(400).json({ 
            status: 'success',
            message: 'JSON vacío o inválido' 
        });
    }
    try {
        // Guardar el objeto completo con una clave específica
        await redisClient.set('datos:webscraping', JSON.stringify(datos));
        console.log('✅ JSON guardado en Redis');

        // Usar fetch para llamar al servicio de scraping
        const response = await fetch('http://scraper-service:8000/run-scraper', {
            method: 'POST'
        });


        const result = await response.json();
        // response.data.comprobante.forEach(item => {
        //     console.log(item['RAZÓN SOCIAL DE PROVEEDOR'], item['IMPORTE TOTAL EN SOLES']);
        // });
        res.status(200).json({
            status: 'success',
            message: 'Datos procesados correctamente',
            result
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se pueden obtener los datos. | ' + error,
        })
    };
};
