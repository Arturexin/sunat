import * as XLSX from 'xlsx'
import { formatDate } from '../services/date.js'


function excelDateToJSDate(serial) {
    const excelEpoch = new Date(1899, 11, 30);
    const days = parseInt(serial, 10);
    const msPerDay = 86400000;
    return new Date(excelEpoch.getTime() + days * msPerDay);
}
function processObject(rows, dbStore) {
    const rucSet = new Set()
    const rowSet = new Set()

    for (const row of rows) {
        row['CONDICION DEL CONTRIBUYENTE'] = ""
        row['ESTADO DEL CONTRIBUYENTE'] = ""
        row['OBSERVACION CONSULTA CPE'] = ""
        row['id_project'] = dbStore.id_data.id_project
        row['id_location'] = dbStore.id_data.id_location
        row['id_employee'] = dbStore.id_data.id_employee
        row['id_area'] = dbStore.id_data.id_area

        // Validación de campos
        let fecha = row["FECHA"]
        const tipo = row["TIPO"]
        const serie = row["SERIE"]
        const nroSerie = row["Nº SERIE"]
        const ruc = row["RUC"]
        const importe = row["IMPORTE TOTAL EN SOLES"]
        console.log(fecha);
        // Si es un número, convertirlo a fecha
        if (typeof fecha === "number") {
            const jsDate = excelDateToJSDate(fecha);
            row["FECHA"] = formatDate(jsDate, { format: 'AMD_HMS' })
        } else if (typeof fecha === "string" && fecha.includes("/")) {
            // Asumimos formato dd/mm/yyyy
            const [day, month, year] = fecha.split("/");
            const jsDate = new Date(`${year}-${month}-${day}T00:00:00`);
            row["FECHA"] = formatDate(jsDate, { format: 'AMD_HMS' });
        } else {
            // Si ya es un Date válido
            row["FECHA"] = formatDate(new Date(fecha), { format: 'AMD_HMS' });
        }

        const tipoRegex = /^[A-Za-z]+$/
        const rucRegex = /^\d{11}$/
        const importeValido = !isNaN(parseFloat(importe))

        const camposValidos =
            tipoRegex.test(tipo) &&
            serie &&
            nroSerie &&
            rucRegex.test(ruc) &&
            importeValido

        if (!camposValidos) {
            dbStore.object_transit.descartados.push(row)
            continue
        }

        rucSet.add(ruc)

        const rowSinNumero = { ...row }
        delete rowSinNumero["Nº"]

        const key = JSON.stringify(rowSinNumero)

        if (rowSet.has(key)) {
            dbStore.object_transit.duplicados.push(row)
        } else {
            rowSet.add(key)
            dbStore.object_transit.comprobante.push(row)
        }
    }

    dbStore.object_transit.ruc = Array.from(rucSet)
}
// Leer archivo y convertir a JSON
export function leerArchivo(dbStore, modalMessage) {
    if(dbStore.id_data.id_project === '0' || 
        dbStore.id_data.id_location === '0' || 
        dbStore.id_data.id_employee === '0') {
        modalMessage(true, `Por favor, seleccione un proyecto, locación y colaborador.`, 'error')
        return
    }
    modalMessage(true, `Procesando archivos .xlsx.`, 'info')
    const reader = new FileReader()

    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        const firstSheet = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheet]
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

        processObject(rows, dbStore)

        if(dbStore.object_transit.comprobante.length > 0 || 
            dbStore.object_transit.duplicados.length > 0 || 
            dbStore.object_transit.descartados.length > 0){
            modalMessage(true, `Comprobantes extraidos del archivo .xlsx.`, 'success')
            dbStore.btnDisabled(2, true);
        } else {
            modalMessage(true, `No se encontraron comprobantes en el archivo .xlsx.`, 'error')
        }
    }
    reader.readAsArrayBuffer(dbStore.files.xlsx)
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