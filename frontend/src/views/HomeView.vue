<script setup>
    import { ref, onMounted } from 'vue'
    import * as XLSX from 'xlsx'
    import { sendData } from '../services/crud.js'
    import { useDB } from '../stores/dataBases.js'
    import Message from '../components/modal/Message.vue';
    import { useMessage } from '../composables/useMessage.js';
    import Confirmation from '../components/modal/Confirmation.vue';
    import { useConfirmation } from '../composables/useConfirmation.js';
    import { formatDate } from '../services/date.js';

    const { 
        tit_, 
        modal_message, 
        modalMessage, 
        restablecer 
    } = useMessage('Registrar nueva asistencia');
    
    const {
        showConfirm,
        confirmTitle,
        confirmMessage,
        confirmText,
        cancelText,
        openConfirm,
        handleConfirm,
        closeConfirm
    } = useConfirmation();


    const excelFile = ref(null)
    const jsonData = ref({
        ruc: [],
        comprobante: [],
        duplicados: [],
        descartados: []
    })
    const btn = ref([0,0,0,0])

    const loading = ref(false);
    const employeesCache = ref([]);
    const projectsCache = ref([]);
    const locationsCache = ref([]);
    const areasCache = ref([]);
    const transitsCache = ref([])

    const id_project = ref('0')
    const id_location = ref('0')
    const id_area = ref('0')
    const id_employee = ref('0')

    const dbStore = useDB();
    // Guardar archivo seleccionado

    function btnTurn(position, reset) {
        btn.value.forEach((e, i) => {
            position === i ? btn.value[i] = 1 : btn.value[i] = 0;
        })
        reset === true ? btn.value[3] = 1 : btn.value[3] = 0;
    }

    function handleFile(event) {
        const file = event.target.files[0]
        if (file && file.name.endsWith('.xlsx')) {
            excelFile.value = file
            btnTurn(0, false)
        } else {
            alert('Por favor selecciona un archivo .xlsx válido.')
        }
    }

    function excelDateToJSDate(serial) {
        const excelEpoch = new Date(1899, 11, 30);
        const days = parseInt(serial, 10);
        const msPerDay = 86400000;
        return new Date(excelEpoch.getTime() + days * msPerDay);
    }

    // Leer archivo y convertir a JSON
    function leerArchivo() {
        if(id_project.value === '0' || id_location.value === '0' || id_employee.value === '0') {
            modalMessage(true, `Por favor, seleccione un proyecto, locación y colaborador.`, 'error')
            return
        }
        const reader = new FileReader()

        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })

            const firstSheet = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheet]
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

            const result = {
                ruc: [],
                comprobante: [],
                duplicados: [],
                descartados: []
            }

            const rucSet = new Set()
            const rowSet = new Set()

            for (const row of rows) {
                row['CONDICION DEL CONTRIBUYENTE'] = ""
                row['ESTADO DEL CONTRIBUYENTE'] = ""
                row['OBSERVACION CONSULTA CPE'] = ""
                row['id_project'] = id_project.value
                row['id_location'] = id_location.value
                row['id_employee'] = id_employee.value
                row['id_area'] = id_area.value

                // Validación de campos
                let fecha = row["FECHA"]
                const tipo = row["TIPO"]
                const serie = row["SERIE"]
                const nroSerie = row["Nº SERIE"]
                const ruc = row["RUC"]
                const importe = row["IMPORTE TOTAL EN SOLES"]
                
                // Si es un número, convertirlo a fecha
                if (typeof fecha === "number") {
                    const jsDate = excelDateToJSDate(fecha);
                    console.log("Fecha uno:", jsDate)
                    row["FECHA"] = formatDate(jsDate, { format: 'AMD_HMS' })
                    // row["FECHA"] = formatDateToSQL(jsDate); // <-- Guardar en formato aaaa-mm-dd hh:mm:ss
                }
                    console.log("Fecha dos:", row["FECHA"])

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
                    result.descartados.push(row)
                    continue
                }

                rucSet.add(ruc)

                const rowSinNumero = { ...row }
                delete rowSinNumero["Nº"]

                const key = JSON.stringify(rowSinNumero)

                if (rowSet.has(key)) {
                    result.duplicados.push(row)
                } else {
                    rowSet.add(key)
                    result.comprobante.push(row)
                }
            }

            result.ruc = Array.from(rucSet)
            jsonData.value = result
            console.log(jsonData.value)
        }
        reader.readAsArrayBuffer(excelFile.value)
        modalMessage(true, `Archivo xlsx leido exitosamente`, 'success')
        excelFile.value = null
        btnTurn(1, true)
    }


    const enviarJsonAlBackend = async () => {
        if (!jsonData.value || !jsonData.value.comprobante?.length) {
            modalMessage(true, `No hay datos para enviar.`, 'error')
            return
        }
        loading.value = true;
        try {
            const ruta = "procesar-json"
            const response = await sendData(ruta, jsonData.value)

            if(response.status === "success") {
                
                jsonData.value = response.result.data
                btnTurn(2, true)
                modalMessage(true, `Archivo procesado exitosamente.`, 'success')
            } else {
                throw new Error(`Error en el procesamiento: ${response.message}`)
            }
        } catch (error) {
            console.error("Error al enviar datos al backend:", error)
            modalMessage(true, `Hubo un error al enviar los datos al servidor.`, 'error')
        } finally {
            loading.value = false;
        }
    }
    async function confirmSaveData() {
        openConfirm({
                    title: 'Guardar resultados',
                    message:    `¿Desea guaradar los resultados obtenidos en la base de datos?".`,
                    confirmLabel: 'Sí, guardar',
                    cancelLabel: 'Cancelar',
                    action: saveDataToDB,
                    data: jsonData.value
                });
    }
    async function saveDataToDB(data) {
        console.log(data)
        try {
            const ruta = `transits/bulk`
            const response = await sendData(ruta, data)

            if (response.status === "success") {
                modalMessage(true, `Datos guardados exitosamente`, 'success')
                restablecer()
            } else {
                throw new Error(`Error al guardar datos: ${response.message}`)
            }
        } catch (error) {
            console.error("Error al guardar datos:", error)
            modalMessage(true, `Error al guardar datos: ${error.message}`, 'error')
        }
    }

    async function loadata() {
        if(id_project.value !== '0'){
            await dbStore.createDB('db_transit_all', `transits?`+
            `id_project=${Number(id_project.value)}&`+
            `id_location=${Number(id_location.value)}&`+
            `id_area=${Number(id_area.value)}&`+
            `id_employee=${Number(id_employee.value)}`); 
            jsonData.value.comprobante = dbStore.db_transit_all.data;                        
            console.log("Transits cache:", jsonData.value.comprobante);
            btnTurn(null, true)
            modalMessage(true, `Datos encontrados.`, 'success')
        } else {
            modalMessage(true, `Seleccione un proyecto.`, 'error')
        }
    }


    const limpiarDatos = () => {
        excelFile.value = null
        jsonData.value = {
            ruc: [],
            comprobante: [],
            duplicados: [],
            descartados: []
        }
        document.getElementById('excel_file').value = ''
    }

    async function loadData() {
        if (dbStore.db_employees_all.data.length === 0) {
            await dbStore.createDB('db_employees_all', 'employees');
        }
        employeesCache.value = dbStore.db_employees_all.data;
        console.log("Empleados cache:", employeesCache.value);
        if (dbStore.db_projects_all.data.length === 0) {
            await dbStore.createDB('db_projects_all', 'projects');
        }
        projectsCache.value = dbStore.db_projects_all.data;
        console.log("Proyectos cache:", projectsCache.value);
        if (dbStore.db_locations_all.data.length === 0) {
            await dbStore.createDB('db_locations_all', 'locations');
        }
        locationsCache.value = dbStore.db_locations_all.data;
        console.log("Locaciones cache:", locationsCache.value);
        if (dbStore.db_areas_all.data.length === 0) {
            await dbStore.createDB('db_areas_all', 'areas');
        }
        areasCache.value = dbStore.db_areas_all.data;
        console.log("Areas cache:", areasCache.value);
    };
    onMounted(async () => {
        await loadData()
    });

    function getValue(obj, key1, key2) {
        return obj[key1] ?? obj[key2] ?? '';
    }
    function formatImporte(val) {
        const num = parseFloat(val);
        return isNaN(num) ? '' : num.toFixed(2);
    }
    function getCondicionStyle(val) {
        return val === 'HABIDO' ? 'color: green;' : 'color: red;';
    }
    function getEstadoStyle(val) {
        return val === 'ACTIVO' ? 'color: green;' : 'color: red;';
    }
    function getObservacionStyle(val) {
        if (!val) return 'color: #eee;';
        if (val.includes('es un comprobante de pago válido')) return 'color: green;';
        if (val.includes('fue comunicada de BAJA')) return 'color: orange;';
        if (val.includes('no existe en los registros de SUNAT')) return 'color: red;';
        if (val.includes('ha sido informada a SUNAT')) return 'color: blue;';
        return 'color: #eee;';
    }
</script>

<template>
    <div class="container_home">
        <h2 style="text-align: center;">Buscar lote de comprobantes</h2>
        <div class="select_container">
            <div style="display: grid;align-items: center;gap: 5px;">
                <label for="project_home">Proyecto</label>
                <select name="project_home" id="project_home" class="select" v-model="id_project">
                    <option value="0" selected>--Seleccione un proyecto--</option>
                    <option v-for="e in projectsCache" :value="e.id">{{ e.id}}: {{ e.name }}</option>
                </select>
            </div>
            <div style="display: grid;align-items: center;gap: 5px;">

                <label for="location_home">Locación</label>
                <select name="location_home" id="location_home" class="select" v-model="id_location">
                    <option value="0" selected>--Seleccione una locación--</option>
                    <option v-for="e in locationsCache" :value="e.id">{{ e.id }}: {{ e.name }}</option>
                </select>
            </div>
            <div style="display: grid;align-items: center;gap: 5px;">
                <label for="area_home">Areas</label>
                <select name="area_home" id="area_home" class="select" v-model="id_area">
                    <option value="0" selected>--Seleccione una área--</option>
                    <option v-for="e in areasCache" :value="e.id">{{ e.id}}: {{ e.name }}</option>
                </select>
            </div>
            <div style="display: grid;align-items: center;gap: 5px;">
                <label for="employee_home">Colaboradores</label>
                <select name="employee_home" id="employee_home" class="select" v-model="id_employee">
                    <option value="0" selected>--Seleccione un colaborador--</option>
                    <option v-for="e in employeesCache" :value="e.id">{{ e.id}}: {{ e.name }} {{ e.last_name }}</option>
                </select>
            </div>
        </div>
        <div style="display: flex; align-items: baseline; gap: 10px;justify-content: center;">
            <button class="btn1" @click="loadata()">
                Buscar archivo
            </button>
        </div>
        <br>
        <h2 style="text-align: center;">Subir archivo Excel (.xlsx)</h2>

        <div style="display: flex; align-items: baseline; gap: 10px;justify-content: center;">
            <input type="file" accept=".xlsx" @change="handleFile" id="excel_file"/>
        
            <button class="btn1" :disabled="!btn[0]" @click="leerArchivo">
            Leer archivo
            </button>
        
            <button class="btn2" :disabled="!btn[1]" @click="enviarJsonAlBackend">
            Procesar archivo
            </button>

            <button class="btn4" :disabled="!btn[2]" @click="confirmSaveData">
                Guardar datos
            </button>

            <button class="btn3" :disabled="!btn[3]" @click="limpiarDatos">
                Limpiar datos
            </button>

        </div>
        <p v-if="loading">⏳ Procesando datos...</p>
        <div v-if="jsonData.comprobante.length > 0" class="output">
            <table class="tabla-principal">
                <thead>
                    <tr>
                        <th scope="row" colspan="15" style="text-align: center;">
                            <h2>Comprobantes - total: {{ jsonData.comprobante.length }} filas</h2>
                        </th>
                    </tr>
                    <tr>
                        <!-- <th style="text-align: center;">N°</th> -->
                        <th style="text-align: center;">Fecha</th>
                        <th style="text-align: center;">Tipo</th>
                        <th style="text-align: center;">Serie</th>
                        <th style="text-align: center;">N° serie</th>
                        <th style="text-align: center;">RUC</th>
                        <th style="text-align: center;">Razón social</th>
                        <th style="text-align: center;">Concepto</th>
                        <th style="text-align: center;">Importe</th>
                        <th style="text-align: center;">Condición</th>
                        <th style="text-align: center;">Estado</th>
                        <th style="text-align: center;">Obsercación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="e in jsonData.comprobante">
                        <!-- <td style="width: 30px;text-align: center;">{{ e['Nº'] }}</td> -->
                        <td style="width: 80px;text-align: center;">{{ e['FECHA'] || formatDate(e['date_record'], { format: 'DMA' }) }}</td>
                        <td style="width: 30px;text-align: center;">{{ e['TIPO'] || e['tipo'] }}</td>
                        <td style="width: 50px;">{{ e['SERIE'] || e['serie'] }}</td>
                        <td style="width: 90px;">{{ e['Nº SERIE'] || e['n_serie'] }}</td>
                        <td style="width: 90px;text-align: center;">{{ e['RUC'] || e['ruc'] }}</td>
                        <td style="width: 200px;">{{ e['RAZÓN SOCIAL DE PROVEEDOR'] || e['rs'] }}</td>
                        <td style="width: 200px;">{{ e['CONCEPTO'] || e['concept'] }}</td>
                        <td style="width: 72px; text-align: right;">
                            S/ {{ formatImporte(getValue(e, 'IMPORTE TOTAL EN SOLES', 'amount')) }}
                        </td>
                        <td
                            :style="getCondicionStyle(getValue(e, 'CONDICION DEL CONTRIBUYENTE', 'c_c'))"
                            style="width: 72px; text-align: center;"
                        >
                            {{ getValue(e, 'CONDICION DEL CONTRIBUYENTE', 'c_c') }}
                        </td>
                        <td
                            :style="getEstadoStyle(getValue(e, 'ESTADO DEL CONTRIBUYENTE', 'e_c'))"
                            style="width: 72px; text-align: center;"
                        >
                            {{ getValue(e, 'ESTADO DEL CONTRIBUYENTE', 'e_c') }}
                        </td>
                        <td
                            :style="getObservacionStyle(getValue(e, 'OBSERVACION CONSULTA CPE', 'cpe'))"
                            style="width: 200px; text-align: left;"
                        >
                            {{ getValue(e, 'OBSERVACION CONSULTA CPE', 'cpe') }}
                        </td>
                        <td>
                            <button>Edit</button>
                            <button>Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-if="jsonData.duplicados.length > 0" class="output">
            <table class="tabla-principal">
                <thead>
                    <tr>
                        <th scope="row" colspan="15" style="text-align: center;">
                            <h2>Duplicados - total: {{ jsonData.duplicados.length }} filas</h2>
                        </th>
                    </tr>
                    <tr>
                        <th style="text-align: center;">N°</th>
                        <th style="text-align: center;">Fecha</th>
                        <th style="text-align: center;">Tipo</th>
                        <th style="text-align: center;">Serie</th>
                        <th style="text-align: center;">N° serie</th>
                        <th style="text-align: center;">RUC</th>
                        <th style="text-align: center;">Razón social</th>
                        <th style="text-align: center;">Concepto</th>
                        <th style="text-align: center;">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="e in jsonData.duplicados">
                        <td style="width: 30px;text-align: center;">{{ e['Nº'] }}</td>
                        <td style="width: 80px;text-align: center;">{{ e['FECHA'] }}</td>
                        <td style="width: 30px;text-align: center;">{{ e['TIPO'] }}</td>
                        <td style="width: 50px;">{{ e['SERIE'] }}</td>
                        <td style="width: 90px;">{{ e['Nº SERIE'] }}</td>
                        <td style="width: 90px;text-align: center;">{{ e['RUC'] }}</td>
                        <td style="width: 400px;">{{ e['RAZÓN SOCIAL DE PROVEEDOR'] }}</td>
                        <td style="width: 340px;">{{ e['CONCEPTO'] }}</td>
                        <td style="width: 72px;text-align: right;">S/ {{ e['IMPORTE TOTAL EN SOLES'].toFixed(2) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-if="jsonData.descartados.length > 0" class="output">
            <table class="tabla-principal">
                <thead>
                    <tr>
                        <th scope="row" colspan="15" style="text-align: center;">
                            <h2>Descartados - total: {{ jsonData.descartados.length }} filas</h2>
                        </th>
                    </tr>
                    <tr>
                        <th style="text-align: center;">N°</th>
                        <th style="text-align: center;">Fecha</th>
                        <th style="text-align: center;">Tipo</th>
                        <th style="text-align: center;">Serie</th>
                        <th style="text-align: center;">N° serie</th>
                        <th style="text-align: center;">RUC</th>
                        <th style="text-align: center;">Razón social</th>
                        <th style="text-align: center;">Concepto</th>
                        <th style="text-align: center;">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="e in jsonData.descartados">
                        <td style="width: 30px;text-align: center;">{{ e['Nº'] }}</td>
                        <td style="width: 80px;text-align: center;">{{ e['FECHA'] }}</td>
                        <td style="width: 30px;text-align: center;">{{ e['TIPO'] }}</td>
                        <td style="width: 50px;">{{ e['SERIE'] }}</td>
                        <td style="width: 90px;">{{ e['Nº SERIE'] }}</td>
                        <td style="width: 90px;text-align: center;">{{ e['RUC'] }}</td>
                        <td style="width: 400px;">{{ e['RAZÓN SOCIAL DE PROVEEDOR'] }}</td>
                        <td style="width: 340px;">{{ e['CONCEPTO'] }}</td>
                        <td style="width: 72px;text-align: right;">S/ {{ e['IMPORTE TOTAL EN SOLES'].toFixed(2) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-if="jsonData.comprobante.length > 0">
            <button class="btn3" @click="limpiarDatos">
                Limpiar datos
            </button>
        </div>
        <Message 
            :show="modal_message.showModal" 
            :message="modal_message.msj" 
            :type="modal_message.type" 
            @close="modal_message.showModal = false" 
        />
        <Confirmation
            :show="showConfirm"
            :title="confirmTitle"
            :message="confirmMessage"
            :confirmText="confirmText"
            :cancelText="cancelText"
            @confirm="handleConfirm"
            @cancel="closeConfirm"
        />
    </div>
</template>
<style>
.container {
  width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: sans-serif;
}

h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

input[type="file"] {
  margin-bottom: 1rem;
}

.btn1 {
  background-color: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn2 {
  background-color: #7f49d5;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn3 {
  background-color: #d54949;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn4 {
  background-color: #55d549;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

.output {
  margin-top: 1.5rem;
  text-align: left;
}

pre {
  padding: 1rem;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.select_container{
    display: flex;
    gap: 30px;
    margin-bottom: 1rem;
    justify-content: center;
}
.container_home{
    background: var(--fondo-primario);
    width: 1200px;
    margin: 1rem;
    padding: 1rem; 
    border-radius: 10px;
    font-family: sans-serif;
}
</style>