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
        name: '',
        address: '',
        amount: '',
        date_start: '',
        date_end: '',
        id_project:'0',
    });
    const dbStore = useDB();

    const employeesCache = ref([])
    const projectsCache = ref([])
    const locationsCache = ref([])

    function selectLocation (result) {
        campos.value.id = result.id;
        campos.value.name = result.name;
        campos.value.address= result.address;
        campos.value.amount = result.amount;
        campos.value.id_project = result.id_project;
        campos.value.date_start = formatDate(result.date_start, { format: 'AMD' });
        campos.value.date_end = formatDate(result.date_end, { format: 'AMD' });

        modalMessage(true, `Datos de "${result.name}" obtenidos.`, 'info')
    }

    function buildRow() {
        const data = {
            id: validation.id(campos.value.id),
            id_project: validation.id(campos.value.id_project),
            name: validation.name(campos.value.name),
            address: validation.address(campos.value.address),
            amount: validation.salary(campos.value.amount),
            date_start: formatDate(campos.value.date_start, { format: 'AMD_HMS' }),
            date_end: formatDate(campos.value.date_end, { format: 'AMD_HMS' }),
            date_record: formatDate(null, { format: 'AMD_HMS' }),
        }
        return data;
    };

    async function addLocation (row){
        const ruta = `location/add`;
        try {
            const response = await sendData(ruta, row)
            if(response.status === 'success'){
                // if(dbStore.db_transit_all.data.length < 20){
                //     dbStore.addRow(response.data, 'db_transit_all');
                // }
                dbStore.addRow(response.data, 'db_locations_all');
                restablecer(campos.value, resetForm);
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al crear la locación", 'error')
        }
    }

    async function updateLocation (row) { 
        const ruta = `location/update/${row.id}`;
        try {
            const response = await updateData(ruta, row);
            if(response.status === 'success'){
                dbStore.updateRow(row.id, response.data, 'db_locations_all');
                restablecer(campos.value, resetForm);
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al actualizar la locación", 'error')
        }
    }
    async function procesar(){
        const row = buildRow();
        if (row.status === 'error') {
            return modalMessage(true, `${row.message}`, 'error');
        }

        if(row.id !== ''){
            openConfirm({
                title: '¿Actualizar locación?',
                message:    `¿Deseas actualizar la locación "${row.name}". 
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, actualizar',
                cancelLabel: 'Cancelar',
                action: updateLocation,
                data: row
            });
        }else{
            openConfirm({
                title: '¿Crear locación?',
                message:    `¿Deseas crear la locación "${row.name}".  
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, crear',
                cancelLabel: 'Cancelar',
                action: addLocation,
                data: row
            });
        }
    }

    async function deleteLocation (data) {
        let ruta = `location/delete/${data.id}`;
        try {
            const response = await updateData(ruta);
            if (response.status === 'success') {
                dbStore.deleteRow(data.id, 'db_locations_all');
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
            message:    `¿Deseas eliminar la locación "${data.name}"? 
                        Esta acción no se puede deshacer.`,
            confirmLabel: 'Sí, eliminar',
            cancelLabel: 'Cancelar',
            action: deleteLocation,
            data: data
        });
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
            <select name="proyecto" id="proyecto" v-model="campos.id_project" required>
                <option value="0" selected>--Seleccione un proyecto--</option>
                <option v-for="e in projectsCache" :value="e.id">{{ e.id }}: {{ e.name }}</option>
            </select>

            <label for="name">Locación</label>
            <input id="name" type="text"  name="name" v-model="campos.name" required title="Sólo se admite letras y espacios.">

            <label for="direccion">Direccion</label>
            <input id="direccion" type="text"  name="direccion" v-model="campos.address" required title="Sólo se admite letras y espacios.">

            <label for="amount">Presupuesto</label>
            <input id="amount" type="text"  name="amount" v-model="campos.amount" required title="Sólo se admite números, 8 dígitos.">

            <div style="display: flex; gap: 10px;justify-content: center;">
                <div style="display: grid;">
                    <label for="entrada">Fecha de inicio</label>
                    <input type="date" id="entrada" name="entrada" v-model="campos.date_start" required>
                </div>
                <div style="display: grid;">
                    <label for="salida">Fecha de cierre</label>
                    <input type="date" id="salida" name="salida" v-model="campos.date_end" required>
                </div>
            </div>

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
                    <th>Proyecto</th>
                    <th>Locación</th>
                    <th>Dirección</th>
                    <th>Presuspuesto</th>
                    <th>Inicio</th>
                    <th>Cierre</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="e in locationsCache" :key="e.id">
                    <td>{{ e.name_project }}</td>
                    <td>{{ e.name }}</td>
                    <td>{{ e.address }}</td>
                    <td>{{ e.amount }}</td>
                    <td>{{ formatDate(e.date_start, { format: 'DMA' }) }}</td>
                    <td>{{ formatDate(e.date_end, { format: 'DMA' }) }}</td>
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