<script setup>
    import { ref } from 'vue'
    import { sendData } from '../services/crud.js'
    import { useDB } from '../stores/dataBases.js'
    import Message from '../components/modal/Message.vue';
    import { useMessage } from '../composables/useMessage.js';
    import Confirmation from '../components/modal/Confirmation.vue';
    import { useConfirmation } from '../composables/useConfirmation.js';
    import SearchFile from '../components/search/SearchFile.vue';
    import SelectDb from '../components/selects/SelectDb.vue';
    import TransitTable from '../components/tables/TransitTable.vue';
    import SearchButton from '../components/search/SearchButton.vue';
    import { leerArchivo, uploadFiles } from '../services/search_input.js';


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

    const dbStore = useDB();

    const btn = ref([0, 0, 0, 0, 0])

    const loading = ref(false);

    // Guardar archivo seleccionado

    function btnTurn(position, reset) {
        btn.value.forEach((e, i) => {
            position === i ? btn.value[i] = 1 : btn.value[i] = 0;
        })
        reset === true ? btn.value[4] = 1 : btn.value[4] = 0;
    }

    const enviarJsonAlBackend = async () => {
        if (!dbStore.object_transit || !dbStore.object_transit.comprobante?.length) {
            modalMessage(true, `No hay datos para enviar.`, 'error')
            return
        }
        loading.value = true;
        try {
            const ruta = "procesar-json"
            const response = await sendData(ruta, dbStore.object_transit)

            if(response.status === "success") {
                
                dbStore.object_transit = response.result.data
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
                    data: dbStore.object_transit
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

    const limpiarDatos = () => {
        dbStore.files.xlsx = null
        dbStore.files.pdf = null
        dbStore.object_transit = {
            ruc: [],
            comprobante: [],
            duplicados: [],
            descartados: []
        }
    }

</script>

<template>
    <div class="container_home">
        <h2 style="text-align: center;">Buscar lote de comprobantes</h2>

        <search-file />

        <select-db />

        <search-button 
            :message_success="() => modalMessage(true, `Datos encontrados.`, 'success')" 
            :message_error="() => modalMessage(true, `Seleccione un proyecto.`, 'error')"
        />
        <br>
        <h2 style="text-align: center;">Subir archivo Excel (.xlsx)</h2>

        <div style="display: flex; align-items: baseline; gap: 10px;justify-content: center;">
        
            <button class="btn1" :disabled="!dbStore.btn_disabled[0]" @click="leerArchivo(dbStore, modalMessage)">
                Generar data .xlsx
            </button>
            <button class="btn1" :disabled="!dbStore.btn_disabled[1]" @click="uploadFiles(dbStore, modalMessage)">
                Generar data .pdf
            </button>
        
            <button class="btn2" :disabled="!dbStore.btn_disabled[2]" @click="enviarJsonAlBackend">
                Procesar data
            </button>

            <button class="btn4" :disabled="!dbStore.btn_disabled[3]" @click="confirmSaveData">
                Guardar datos
            </button>

            <button class="btn3" :disabled="!dbStore.btn_disabled[4]" @click="limpiarDatos">
                Limpiar datos
            </button>

        </div>
        <p v-if="loading">⏳ Procesando datos...</p>
        <div v-if="dbStore.object_transit.comprobante.length > 0" class="output">
            <transit-table 
                :array_data="dbStore.object_transit.comprobante" 
            />
        </div>
        <div v-if="dbStore.object_transit.duplicados.length > 0" class="output">
            <transit-table 
                :array_data="dbStore.object_transit.duplicados" 
            />
        </div>
        <div v-if="dbStore.object_transit.descartados.length > 0" class="output">
            <transit-table 
                :array_data="dbStore.object_transit.descartados" 
            />
        </div>
        <div v-if="dbStore.object_transit.comprobante.length > 0">
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