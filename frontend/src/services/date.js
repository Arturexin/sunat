export function formatDate(date = null, options = {}) {
    const {
        format = 'AMD_HMS', // 'DMA', 'AMD', 'DMA_HMS', 'HMS', 'HM'
        useUTC = true,
        addDays = 0
    } = options;

    const fecha = new Date(date || new Date());

    if (addDays) fecha.setUTCDate(fecha.getUTCDate() + addDays);

    const get = (fn, utcFn) => useUTC ? utcFn.call(fecha) : fn.call(fecha);

    const anio = get(Date.prototype.getFullYear, Date.prototype.getUTCFullYear);
    const mes = String(get(Date.prototype.getMonth, Date.prototype.getUTCMonth) + 1).padStart(2, '0');
    const dia = String(get(Date.prototype.getDate, Date.prototype.getUTCDate)).padStart(2, '0');
    const hora = String(get(Date.prototype.getHours, Date.prototype.getUTCHours)).padStart(2, '0');
    const minuto = String(get(Date.prototype.getMinutes, Date.prototype.getUTCMinutes)).padStart(2, '0');
    const segundo = String(get(Date.prototype.getSeconds, Date.prototype.getUTCSeconds)).padStart(2, '0');

    const formats = {
        AMD_HMS: `${anio}-${mes}-${dia} ${hora}:${minuto}:${segundo}`,
        DMA_HMS: `${dia}-${mes}-${anio} ${hora}:${minuto}:${segundo}`,
        AMD:     `${anio}-${mes}-${dia}`,
        DMA:     `${dia}-${mes}-${anio}`,
        HMS:     `${hora}:${minuto}:${segundo}`,
        HM:      `${hora}:${minuto}`
    };

    return formats[format];
}
/* // extractAMD_HMS()
formatDate(date, { format: 'AMD_HMS' })

// extractDMA_HMS()
formatDate(date, { format: 'DMA_HMS' })

// extractAMD() con +1 día
formatDate(date, { format: 'AMD', addDays: 1 })

// extractDMA()
formatDate(date, { format: 'DMA' })

// extractHMS()
formatDate(date, { format: 'HMS' })

// extractHM()
formatDate(date, { format: 'HM' }) */


export function calculateHours(h_in, h_out = null) {
    if (!h_in) return '';
    const start = new Date(h_in);
    const end = h_out ? new Date(h_out) : new Date();
    const diffMs = end - start;
    return (diffMs / (1000 * 60 * 60)).toFixed(2); // horas con 2 decimales
}

export function nf(fecha) {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const fechaObj = new Date(fecha);
    const diaSemana = diasSemana[fechaObj.getDay()];
    const dia = String(fechaObj.getUTCDate()).padStart(2, '0');
    const mes = meses[fechaObj.getUTCMonth()];
    const anio = fechaObj.getUTCFullYear();

    return `${diaSemana} ${dia}-${mes}-${anio}`;
}
