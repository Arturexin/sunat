<script setup>
import { ref, onMounted } from 'vue';
import { sendData, updateData } from '../services/crud';
import { resetForm, validation, validateRow } from '../services/validate.js';
import Message from '../components/modal/Message.vue';
import { useMessage } from '../composables/useMessage.js';
import Confirmation from '../components/modal/Confirmation.vue';
import { useConfirmation } from '../composables/useConfirmation.js';
import { useDB } from '../stores/dataBases.js';
import { formatDate } from '../services/date.js';

    const { 
        tit_, 
        modal_message, 
        modalMessage, 
        restablecer } = useMessage('Registrar nueva asistencia');
    
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
    const listProjectsCache= ref([]);
    const campos = ref({
        ID_LOCATION:'',
        PROJECT: '',
        NAME: '',
        ID_ADDRESS: '',
        ADDRESS: '',
        AMOUNT: '',
        DATE_START: '',
        DATE_END: '',
        ID_PROJECT:'0',
        ID_COIN:'0',
    });
    const dbStore = useDB();

    const listCoinCache = ref([])
    const locationsCache = ref([])

    function selectLocation (result) {
        campos.value.ID_LOCATION = result.ID_LOCATION;
        campos.value.NAME = result.NAME;
        campos.value.ID_ADDRESS = result.ID_ADDRESS;
        campos.value.ADDRESS= result.ADDRESS;
        campos.value.AMOUNT = Number(result.AMOUNT);
        campos.value.DATE_START = formatDate(result.DATE_START, { format: 'AMD' });
        campos.value.DATE_END = formatDate(result.DATE_END, { format: 'AMD' });
        campos.value.ID_PROJECT = result.ID_PROJECT;
        campos.value.ID_COIN = result.ID_COIN;

        modalMessage(true, `Datos de "${result.NAME}" obtenidos.`, 'info')
    }

    function restartCampos () {
        campos.value.ID_LOCATION = '';
        campos.value.NAME = '';
        campos.value.ID_ADDRESS = '';
        campos.value.ADDRESS= '';
        campos.value.AMOUNT = '';
        campos.value.DATE_START = '';
        campos.value.DATE_END = '';
        campos.value.ID_PROJECT = '0';
        campos.value.ID_COIN = '0';
    }
    function buildRow(dataRef) {
        console.log('antes', dataRef.value)
        if (!dataRef || !dataRef.value) return null
        const result = {}
        for (let item of Object.keys(dataRef.value)) {
            const val = dataRef.value[item]
            const validator = validation[item]
            result[item] = typeof validator === 'function' ? validator(val) : val
            if (['DATE_START', 'DATE_END'].includes(item) && val !== '') {
                result[item] =  formatDate(result[item], { format: 'AMD_HMS' })
            }
        }
        console.log("Fila construida:", result);
        return result
    }

    async function addLocation (row){
        const ruta = `location/add`;
        try {
            const response = await sendData(ruta, row)
            if(response.status === 'success'){
                // if(dbStore.db_transit_all.data.length < 20){
                //     dbStore.addRow(response.data, 'db_transit_all');
                // }
                dbStore.addRow(response.data, 'db_locations_all');
                await loadData();
                restartCampos();
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al crear la locación", 'error')
        }
    }

    async function updateLocation (row) { 
        const ruta = `location/update/${row.ID_LOCATION}`;
        try {
            const response = await updateData(ruta, row);
            if(response.status === 'success'){
                dbStore.updateRow(row.ID_LOCATION, response.data, 'db_locations_all');
                await loadData();
                restartCampos();
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al actualizar la locación", 'error')
        }
    }
    async function procesar(){
        const row = buildRow(campos);
        if (row.status === 'error') {
            return modalMessage(true, `${row.message}`, 'error');
        }


        if(row.ID_LOCATION !== ''){
            openConfirm({
                title: '¿Actualizar locación?',
                message:    `¿Deseas actualizar la locación "${row.NAME}". 
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, actualizar',
                cancelLabel: 'Cancelar',
                action: updateLocation,
                data: row
            });
        }else{
            openConfirm({
                title: '¿Crear locación?',
                message:    `¿Deseas crear la locación "${row.NAME}".  
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, crear',
                cancelLabel: 'Cancelar',
                action: addLocation,
                data: row
            });
        }
    }

    async function deleteLocation (data) {
        let ruta = `location/delete/${data.ID_LOCATION}`;
        try {
            const response = await updateData(ruta);
            if (response.status === 'success') {
                dbStore.deleteRow(data.ID_LOCATION, 'db_locations_all');
                await loadData();
                modalMessage(true, response.message, 'success')
            }else{
                modalMessage(true, response.message, 'error')
            }
        } catch (error) {
            // Manejo de errores de red o inesperados
            modalMessage(true, `${error}`, 'error')
        }
    }

    function onDeleteClick(data) {
        openConfirm({
            title: '¿Eliminar locación?',
            message:    `¿Deseas eliminar la locación "${data.NAME}"? 
                        Esta acción no se puede deshacer.`,
            confirmLabel: 'Sí, eliminar',
            cancelLabel: 'Cancelar',
            action: deleteLocation,
            data: data
        });
    }

    async function loadData() {
        // if (dbStore.db_employees_all.data.length === 0) {
        //     await dbStore.createDB('db_employees_all', 'employees');
        // }
        // employeesCache.value = dbStore.db_employees_all.data;
        // console.log("Empleados cache:", employeesCache.value);
        // if (dbStore.db_projects_all.data.length === 0) {
        //     await dbStore.createDB('db_projects_all', 'projects');
        // }
        // projectsCache.value = dbStore.db_projects_all.data;
        // console.log("Proyectos cache:", projectsCache.value);
        // if (dbStore.db_locations_all.data.length === 0) {
            // }
        await dbStore.createDB('db_locations_all', 'locations');
        locationsCache.value = dbStore.db_locations_all.data.length > 0 
            ? dbStore.db_locations_all.data : [];
        console.log("Locaciones cache:", locationsCache.value);

        await dbStore.createDB('db_locations_select', 'select_projects')
        listProjectsCache.value = dbStore.db_locations_select.data.length > 0 
            ? dbStore.db_locations_select.data : [];

        await dbStore.createDB('db_coin_all', 'coins')
        listCoinCache.value = dbStore.db_coin_all.data.length > 0 
            ? dbStore.db_coin_all.data : [];
        console.log("Monedas cache:", listCoinCache.value);
    };
    onMounted(async () => {
        await loadData();
    });

</script>

<template>
    <div class="container_into">
        <form class="formulario-principal">
            <h2>Locación</h2>

            <label for="proyecto">Proyecto</label>
            <select name="proyecto" id="proyecto" v-model="campos.ID_PROJECT">
                <option value="0" selected>--Seleccione un proyecto--</option>
                <option v-for="e in listProjectsCache" :value="e.ID_PROJECT">{{ e.ID_PROJECT }}: {{ e.NAME }}</option>
            </select>

            <label for="name">Locación</label>
            <input id="name" type="text"  name="name" v-model="campos.NAME" title="Sólo se admite letras y espacios.">

            <label for="direccion">Direccion</label>
            <input id="direccion" type="text"  name="direccion" v-model="campos.ADDRESS" title="Sólo se admite letras y espacios.">

            <label for="amount">Presupuesto</label>
            <input id="amount" type="text"  name="amount" v-model="campos.AMOUNT" title="Sólo se admite números, 8 dígitos.">
            
            <label for="amount">Moneda</label>
            <select name="moneda" id="moneda" v-model="campos.ID_COIN">
                <option value="0" selected>--Seleccione una moneda--</option>
                <option v-for="e in listCoinCache" :value="e.ID_COIN">{{ e.ISO }}: {{ e.NAME }} {{ e.SIMBOL }}</option>
            </select>

            <div style="display: flex; gap: 10px;justify-content: center;">
                <div style="display: grid;">
                    <label for="entrada">Fecha de inicio</label>
                    <input type="date" id="entrada" name="entrada" v-model="campos.DATE_START">
                </div>
                <div style="display: grid;">
                    <label for="salida">Fecha de cierre</label>
                    <input type="date" id="salida" name="salida" v-model="campos.DATE_END">
                </div>
            </div>

            <button type="submit" class="btn-in" @click.prevent="procesar()">Procesar</button>
            <button type="submit" class="btn-out" @click.prevent="restartCampos()">Restablecer</button>
        </form>
            <table class="tabla-principal">
                <thead>
                <tr>
                    <th  scope="row" colspan="15" style="color: var(--color-secundario);">
                        <h2>Lista de locaciones</h2>
                    </th>
                </tr>
                <tr>
                    <th>Proyecto</th>
                    <th>Locación</th>
                    <th>Dirección</th>
                    <th>Presupuesto</th>
                    <th>Inicio</th>
                    <th>Cierre</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="e in locationsCache" :key="e.ID_LOCATION">
                    <td>{{ e.PROJECT }}</td>
                    <td>{{ e.NAME }}</td>
                    <td>{{ e.ADDRESS }}</td>
                    <td>{{ e.SIMBOL }} {{ e.AMOUNT }}</td>
                    <td>{{ formatDate(e.DATE_START, { format: 'DMA' }) }}</td>
                    <td>{{ formatDate(e.DATE_END, { format: 'DMA' }) }}</td>
                    <td style="text-align: center; width: 100px;">
                        <div>
                            <button class="btn-tab-edit" @click="selectLocation(e)">Editar</button>
                            <button class="btn-tab-delete" @click="onDeleteClick(e)">Borrar</button>
                        </div>
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                </tr>
            </tfoot>
        </table>
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

<style scoped>

</style>