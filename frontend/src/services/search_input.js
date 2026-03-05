import * as XLSX from 'xlsx'
import { formatDate } from '../services/date.js'


function excelDateToJSDate(serial) {
    const excelEpoch = new Date(1899, 11, 30);
    const days = parseInt(serial, 10);
    const msPerDay = 86400000;
    return new Date(excelEpoch.getTime() + days * msPerDay);
}
export function filtro (row, rowSet) {
    
    row['CONDICION DEL CONTRIBUYENTE'] = ""
    row['ESTADO DEL CONTRIBUYENTE'] = ""
    row['OBSERVACION CONSULTA CPE'] = ""
    row['Observación'] = row['Observación'] || ""
    row['check'] = false
    row['flat'] = 'T'
    row['ID_PROJECT'] = row['ID_PROJECT'] || '0'
    row['ID_LOCATION'] = row['ID_LOCATION'] || '0'
    row['ID_EMPLOYEE'] = row['ID_EMPLOYEE'] || '0'

    let fecha = row["FECHA"]
    const tipo = row["TIPO"]
    const serie = row["SERIE"]
    const nroSerie = row["Nº SERIE"]
    const ruc = String(row["RUC"] || "").trim()
    const importeNum = parseFloat(row["IMPORTE TOTAL EN SOLES"])

    if (typeof fecha === "number") {
        row["FECHA"] = formatDate(excelDateToJSDate(fecha), { format: 'AMD_HMS' })
    } else if (typeof fecha === "string" && fecha.includes("/")) {
        const [day, month, year] = fecha.split("/")
        row["FECHA"] = formatDate(new Date(`${year}-${month}-${day}T00:00:00`), { format: 'AMD_HMS' })
    } else {
        row["FECHA"] = formatDate(new Date(fecha), { format: 'AMD_HMS' })
    }

    const tipoRegex = /^[A-Za-z]+$/
    const rucRegex = /^\d{11}$/
    const serieStr = String(serie || '').trim()
    const serieValid = serieStr.length >= 3 && serieStr.length <= 4 && /\d$/.test(serieStr)

    if (!tipoRegex.test(tipo)) row['flat'] = 'E', row['Observación'] += 'Tipo inválido. '
    if (!serieValid) row['flat'] = 'E', row['Observación'] += 'Serie inválida. '
    if (Number(nroSerie) <= 0) row['flat'] = 'E', row['Observación'] += 'Número de serie inválido. '
    if (!rucRegex.test(ruc)) row['flat'] = 'E', row['Observación'] += 'RUC inválido. '
    if (isNaN(importeNum) || importeNum <= 0) row['flat'] = 'E', row['Observación'] += 'Importe inválido. '

    if (row['flat'] !== 'E') {
        const rowSinNumero = { ...row }
        delete rowSinNumero["Nº"]
        const key = JSON.stringify(rowSinNumero)

        if (rowSet.has(key)) row['flat'] = 'R'
        else rowSet.add(key), row['flat'] = 'T'
    }
    return row
}
// Leer archivo y convertir a JSON
export function leerArchivo(dbStore, modalMessage) {
    dbStore.array_comprobantes = []

    modalMessage(true, `Procesando archivos .xlsx.`, 'info')
    // Validación: asegurar que el archivo sea un Blob/File válido
    let xlsxFile = dbStore.files.xlsx;
    if (Array.isArray(xlsxFile)) {
        // Si por error llegó como array, tomar el primero
        xlsxFile = xlsxFile[0];
    }
    if (!xlsxFile || !(xlsxFile instanceof Blob)) {
        modalMessage(true, `Seleccione un archivo .xlsx válido antes de procesar.`, 'error')
        return;
    }
    const reader = new FileReader()

    reader.onerror = (e) => {
        console.error('FileReader error:', e)
        modalMessage(true, `No se pudo leer el archivo .xlsx. Verifique el archivo.`, 'error')
    }
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        const firstSheet = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheet]
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        const rowSet = new Set()

        const parsedRows = rows.map(row => filtro(row, rowSet))
        dbStore.array_comprobantes = parsedRows

        if(dbStore.array_comprobantes.length > 0){
            modalMessage(true, `Comprobantes extraidos del archivo .xlsx.`, 'success')
            dbStore.btnDisabled(2, true);
        } else {
            modalMessage(true, `No se encontraron comprobantes en el archivo .xlsx.`, 'error')
        }
    }
    try {
        reader.readAsArrayBuffer(xlsxFile)
    } catch (err) {
        console.error('readAsArrayBuffer failed:', err)
        modalMessage(true, `Error al iniciar la lectura del archivo .xlsx.`, 'error')
        return
    }
    dbStore.files.xlsx = null
}

export async function uploadFiles(dbStore, modalMessage) {
    if(dbStore.id_data.id_project === '0' || dbStore.id_data.id_location === '0' || dbStore.id_data.id_employee === '0') {
        modalMessage(true, `Por favor, seleccione un proyecto, locación y colaborador.`, 'error')
        return
    }
    modalMessage(true, `Procesando archivos .pdf.`, 'info')
    const formData = new FormData();

    // Si files es un solo archivo, conviértelo en array
    if (!Array.isArray(dbStore.files.pdf)) {
        dbStore.files.pdf = [dbStore.files.pdf];
    }

    for (let i = 0; i < dbStore.files.pdf.length; i++) {
        formData.append("pdfs", dbStore.files.pdf[i]);
    }
    const res = await fetch("http://localhost:5000/upload-pdfs", {
        method: "POST",
        body: formData,
    });
    const result = await res.json();
    if(result.status === 'success'){
        processObject(result.data, dbStore)
        modalMessage(true, `Comprobantes extraidos del archivo .pdf.`, 'success')
        dbStore.btnDisabled(2, true);
    }else{
        modalMessage(true, `Error al procesar el archivo .pdf.`, 'error')
    }
    dbStore.files.pdf = null
}