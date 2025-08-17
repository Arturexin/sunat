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
    const campos = ref({
        id:'',
        id_location:'0',
        name: '',
        amount: '',
    });
    const dbStore = useDB();

    const locationsCache = ref([])
    const areaCache = ref([])

    function selectArea (result) {
        campos.value.id = result.id;
        campos.value.name = result.name;
        campos.value.amount = result.amount;
        campos.value.id_location = result.id_location;

        modalMessage(true, `Datos de "${result.name}" obtenidos.`, 'info')
    }

    function buildRow() {
        const data = {
            id: validation.id(campos.value.id),
            id_location: validation.id(campos.value.id_location),
            name: validation.name(campos.value.name),
            amount: validation.salary(campos.value.amount),
            date_record: formatDate(null, { format: 'AMD_HMS' }),
        }
        return data;
    };

    async function addArea (row){
        const ruta = `area/add`;
        try {
            const response = await sendData(ruta, row)
            if(response.status === 'success'){
                // if(dbStore.db_transit_all.data.length < 20){
                //     dbStore.addRow(response.data, 'db_transit_all');
                // }
                dbStore.addRow(response.data, 'db_areas_all');
                await loadData();
                restablecer(campos.value, resetForm);
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al crear al área", 'error')
        }
    }

    async function updateArea (row) { 
        const ruta = `area/update/${row.id}`;
        try {
            const response = await updateData(ruta, row);
            if(response.status === 'success'){
                dbStore.updateRow(row.id, response.data, 'db_areas_all');
                
                restablecer(campos.value, resetForm);
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al actualizar al área", 'error')
        }
    }
    async function procesar() {
        const row = buildRow();
        if (row.status === 'error') {
            return modalMessage(true, `${row.message}`, 'error');
        }

        if(row.id !== ''){
            openConfirm({
                title: '¿Actualizar área?',
                message:    `¿Deseas actualizar al área "${row.name}". 
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, actualizar',
                cancelLabel: 'Cancelar',
                action: updateArea,
                data: row
            });
        }else{
            openConfirm({
                title: '¿Crear área?',
                message:    `¿Deseas crear al área "${row.name}".  
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, crear',
                cancelLabel: 'Cancelar',
                action: addArea,
                data: row
            });
        };
    };

    async function deleteArea (data) {
        let ruta = `area/delete/${data.id}`;
        try {
            const response = await updateData(ruta);
            if (response.status === 'success') {
                dbStore.deleteRow(data.id, 'db_areas_all');
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
            title: '¿Eliminar área?',
            message:    `¿Deseas eliminar el área "${data.name}"? 
                        Esta acción no se puede deshacer.`,
            confirmLabel: 'Sí, eliminar',
            cancelLabel: 'Cancelar',
            action: deleteArea,
            data: data
        });
    }

    async function loadData() {
        if (dbStore.db_areas_all.data.length === 0) {
            await dbStore.createDB('db_areas_all', 'areas');
        }
        areaCache.value = dbStore.db_areas_all.data;
        console.log("Areas cache:", areaCache.value);
        if (dbStore.db_locations_all.data.length === 0) {
            await dbStore.createDB('db_locations_all', 'locations');
        }
        locationsCache.value = dbStore.db_locations_all.data;
        console.log("Locaciones cache:", locationsCache.value);
    };
    onMounted(async () => {
        await loadData();
    });

</script>

<template>
    <div class="container_into">
        <form class="formulario-principal">
            <h2>Area</h2>

            <label for="locacion">Locación</label>
            <select name="locacion" id="locacion" v-model="campos.id_location" required>
                <option value="0" selected>--Seleccione un Locación--</option>
                <option v-for="e in locationsCache" :value="e.id">{{ e.id }}: {{ e.name }}</option>
            </select>

            <label for="name">Area</label>
            <input id="name" type="text"  name="name" v-model="campos.name" required title="Sólo se admite letras y espacios.">

            <label for="amount">Presupuesto</label>
            <input id="amount" type="text"  name="amount" v-model="campos.amount" required title="Sólo se admite números, 8 dígitos.">

            <button type="submit" class="btn-in" @click.prevent="procesar()">Procesar</button>
            <button type="submit" class="btn-out" @click.prevent="restablecer(campos, resetForm)">Restablecer</button>
        </form>
            <table class="tabla-principal">
                <thead>
                <tr>
                    <th  scope="row" colspan="15" style="color: var(--color-secundario);">
                        <h2>Lista de colaboradores</h2>
                    </th>
                </tr>
                <tr>
                    <th>Locación</th>
                    <th>Area</th>
                    <th>Presuspuesto</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="e in areaCache" :key="e.id">
                    <td>{{ e.name_location }}</td>
                    <td>{{ e.name }}</td>
                    <td>{{ e.amount }}</td>
                    <td>{{ formatDate(e.date_record, { format: 'DMA' }) }}</td>
                    <td style="text-align: center; width: 100px;">
                        <div>
                            <button class="btn-tab-edit" @click="selectArea(e)">Editar</button>
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