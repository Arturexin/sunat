<script setup>
    import { ref, watch, onMounted } from 'vue'
    import { sendData } from '../services/crud.js'
    import { useDB } from '../stores/dataBases.js'
    import Message from '../components/modal/Message.vue';
    import { useMessage } from '../composables/useMessage.js';
    import Confirmation from '../components/modal/Confirmation.vue';
    import { useConfirmation } from '../composables/useConfirmation.js';
    import SearchFile from '../components/search/SearchFile.vue';
    import SelectDb from '../components/selects/SelectDb.vue';
    import TransitTable from '../components/tables/TransitTable.vue';
    import ModalEdit from '../components/modal/ModalEdit.vue';
    import { leerArchivo, uploadFiles } from '../services/search_input.js';


    const { 
        
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

    const dbStore = useDB();

    const tablas = ref([
        { clave: 'comprobante', title: 'Comprobantes en tránsito' },
        { clave: 'descartados', title: 'Comprobantes descartados' },
        { clave: 'duplicados', title: 'Comprobantes duplicados' },
        { clave: 'ruc', title: 'RUC' }
    ])
    const passed = ref({ruc: [], comprobante: [],})
    const numTablas = ref(0)

    const loading = ref(false);

    const rows = ref([])
    const groups = ref(['T', 'E', 'R'])
    
        
    const enviarJsonAlBackend = async () => {
        
        const setRuc = new Set()
        rows.value.forEach(o => {
            if (o.check) {
                if (o['flat'] === 'T') {
                    passed.value.comprobante.push(o)
                    setRuc.add(o['RUC'])
                }
            }
        })
        passed.value.ruc = Array.from(setRuc)

        if (!passed.value || !passed.value.comprobante.length) {
            modalMessage(true, `No seleccionó ningún comprobante para enviar.`, 'error')
            return
        }

        loading.value = true;
        try {
            const ruta = "procesar-json"
            const response = await sendData(ruta, passed.value)

            if(response.status === "success") {
                response.result.data.comprobante.forEach(e => {
                    const match = rows.value.find(r => r['Nº'] === e['Nº'])
                    if (match) {
                        match['CONDICION DEL CONTRIBUYENTE'] = e['CONDICION DEL CONTRIBUYENTE']
                        match['ESTADO DEL CONTRIBUYENTE'] = e['ESTADO DEL CONTRIBUYENTE']
                        match['OBSERVACION CONSULTA CPE'] = e['OBSERVACION CONSULTA CPE']
                    }
                })
                // object.value = response.result.data
                passed.value = {ruc: [], comprobante: [],}
                dbStore.btnDisabled(2, true);
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
                    message:    `¿Desea guardar los resultados obtenidos en la base de datos?`,
                    confirmLabel: 'Sí, guardar',
                    cancelLabel: 'Cancelar',
                    action: saveDataToDB,
                    data: passed.value
                });
    }
    async function saveDataToDB(data) {
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

    const limpiarDatos = () => {
        // Reset de archivos seleccionados
        dbStore.files.xlsx = null
        dbStore.files.pdf = null

        // Sincronizar la vista con el store vacío
        rows.value = [...dbStore.array_comprobantes]

        // Reset de estado de UI
        numTablas.value = 0
        loading.value = false

        // Volver a habilitar el flujo inicial (Generar .xlsx)
        dbStore.btnDisabled(0, true)
    }

    function assignData () {
        if (Number(dbStore.id_data.id_employee) === 0 
        && Number(dbStore.id_data.id_location) === 0 
        && Number(dbStore.id_data.id_project) === 0 ) {
            return modalMessage(true, `Seleccione una opción válida`, 'error')
        }
        for (let row of dbStore.array_comprobantes) {
            if (row.check) {
                row.ID_EMPLOYEE = dbStore.id_data.id_employee
                row.ID_LOCATION = dbStore.id_data.id_location
                row.ID_PROJECT = dbStore.id_data.id_project
            }
        }
    }

    function filtro () {
        if (Number(dbStore.id_data.id_employee) === 0 
        && Number(dbStore.id_data.id_location) === 0 
        && Number(dbStore.id_data.id_project) === 0 ) {
            return modalMessage(true, `Seleccione una opción válida`, 'error')
        }
        rows.value = dbStore.array_comprobantes.filter(row => 
            row.ID_EMPLOYEE === dbStore.id_data.id_employee &&
            row.ID_LOCATION === dbStore.id_data.id_location &&
            row.ID_PROJECT === dbStore.id_data.id_project
        );
    }
    function resetFilter () {
        rows.value = [...dbStore.array_comprobantes]
    }
    function deleteRows () {
        const filtered = rows.value.filter(row => !row.check)
        rows.value = [...filtered]
        dbStore.array_comprobantes = [...filtered]
    }
    function previous () {
        if (numTablas.value > 0){
            numTablas.value -= 1
        }
    }
    function next () {
        if (numTablas.value < 2){
            numTablas.value += 1
        }
    }
    onMounted(() => {
        rows.value = [...dbStore.array_comprobantes]
    })
     // Mantener sincronizada la vista con el store cuando cambian los datos de tránsito
    watch(() => dbStore.array_comprobantes, (nuevo) => {
            rows.value = [...nuevo];
        }
    );


</script>

<template>
    <div class="container_home">
        <!-- <search-button 
            :message_success="() => modalMessage(true, `Datos encontrados.`, 'success')" 
            :message_error="() => modalMessage(true, `Seleccione un proyecto.`, 'error')"
        /> -->
        <div style="display: flex;justify-content: center;align-items: center;gap: 20px;margin-top: 20px; border: 1px solid var(--color-primario); border-radius: 5px;">
            <search-file />
            <div style="display: flex; align-items: baseline; gap: 10px;justify-content: center;">
                
                <button class="button_action" style="background: var(--c-uno);" v-if="dbStore.btn_disabled[0]" @click="leerArchivo(dbStore, modalMessage)">
                    Generar .xlsx
                </button>
                <button class="button_action" style="background: var(--c-uno);" v-if="dbStore.btn_disabled[1]" @click="uploadFiles(dbStore, modalMessage)">
                    Generar .pdf
                </button>
            
                <button class="button_action" style="background: var(--c-uno);" v-if="dbStore.btn_disabled[2]" @click="enviarJsonAlBackend">
                    Procesar
                </button>
                
                <button class="button_action" style="background: var(--c-uno);" v-if="dbStore.btn_disabled[3]" @click="confirmSaveData">
                    Guardar
                </button>
                
                <button class="button_action" style="background: var(--c-cuatro);" v-if="dbStore.btn_disabled[4]" @click="limpiarDatos">
                    Limpiar
                </button>
                <button class="button_action" style="background: var(--c-cuatro);" @click="deleteRows()">
                    Eliminar
                </button>
                
            </div>
        </div>

        <div style="display: flex;justify-content: center;align-items: center;gap: 20px;margin-top: 20px; border: 1px solid var(--color-primario); border-radius: 5px;">
            <select-db />
            <div style="display: flex; align-items: baseline; gap: 10px;justify-content: center;">
                <button class="button_action" style="background: var(--c-uno);" @click="assignData">Asignar</button>
                <button class="button_action" style="background: var(--c-uno);" @click="filtro()">Filtrar</button>
                <button class="button_action" style="background: var(--c-cuatro);" @click="resetFilter()">Restablecer</button>
            </div>
            
        </div>
        
        <p v-if="loading">⏳ Procesando datos...</p>
        <div class="output">
            <div style="display:flex; justify-content: center; align-items: center; gap: 10px;">
                <button @click="previous"><</button>
                <h2 style="text-align: center;">{{ tablas[numTablas].title }}</h2>
                <button @click="next">></button>
            </div>
            <transit-table 
                v-if="rows.length > 0"
                :array_data="rows"
                :concept="groups[numTablas]"
            />
        </div>
        <div class="modal-overlay" v-if="dbStore.modal_archivo">
            <div class="modal-container">
                <modal-edit 
                :modo="dbStore.modo_modal"/>
            </div>
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
.button_action {
    width: 100px;
    color: var(--color-primario);
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
.container {
  width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px solid var(--color-primario);
  border-radius: 8px;
  font-family: sans-serif;
}

h2 {
  font-size: 1.25rem;
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
    gap: 10px;
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

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-container {
    background: var(--fondo-primario);
    border: 1px solid var(--color-primario);
    border-radius: 10px;
    padding: 1rem;
    width: 300px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}
</style>