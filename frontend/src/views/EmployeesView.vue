<script setup>
import { ref, onMounted } from 'vue';
import { sendData, updateData } from '../services/crud';
import { resetForm, validation, validateRow } from '../services/validate.js';
import { formatDate } from '../services/date.js';
import Message from '../components/modal/Message.vue';
import { useMessage } from '../composables/useMessage.js';
import Confirmation from '../components/modal/Confirmation.vue';
import { useConfirmation } from '../composables/useConfirmation.js';
import { useDB } from '../stores/dataBases.js';

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
        last_name: '',
        doc: '',
        phone: '',
        position: '',
    });
    const dbStore = useDB();
    const employeesCache = ref([])
    const projectsCache = ref([])

    function selectEmployee (result) {
        campos.value.id = result.id;
        campos.value.name = result.name;
        campos.value.last_name = result.last_name;
        campos.value.doc = result.doc;
        campos.value.phone = result.phone;
        campos.value.position = result.position;

        modalMessage(true, `Datos de "${result.name} ${result.last_name}" obtenidos.`, 'info')
    }

    function buildRow() {
        const data = {
            id: validation.id(campos.value.id),
            name: validation.name(campos.value.name),
            last_name: validation.last_name(campos.value.last_name),
            doc: validation.dni(campos.value.doc),
            phone: validation.phone(campos.value.phone),
            position: validation.rol(campos.value.position),
            date_record: formatDate(null, { format: 'AMD_HMS' }),
        }
        return data;
    };
    async function addEmployee (row){
        const ruta = `employee/add`;
        try {
            const response = await sendData(ruta, row)
            console.log(response);
            if(response.status === 'success'){
                // if(dbStore.db_transit_all.data.length < 20){
                //     dbStore.addRow(response.data, 'db_transit_all');
                // }
                dbStore.addRow(response.data, 'db_employees_all');
                await loadData()
                restablecer(campos.value, resetForm);
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al crear al colaborador", 'error')
        }
    }

    async function updateEmployee (row) { 
        const ruta = `employee/update/${row.id}`;
        try {
            const response = await updateData(ruta, row);
            if(response.status === 'success'){
                dbStore.updateRow(row.id, response.data, 'db_employees_all');
                await loadData()
                restablecer(campos.value, resetForm);
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al actualizar al colaborador", 'error')
        }
    }
    async function procesar(){
        const row = buildRow();
        if (row.status === 'error') {
            return modalMessage(true, `${row.message}`, 'error');
        }

        if(row.id !== ''){
            openConfirm({
                title: '¿Actualizar colaborador?',
                message:    `¿Deseas actualizar al colaborador "${row.name} ${row.last_name}". 
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, actualizar',
                cancelLabel: 'Cancelar',
                action: updateEmployee,
                data: row
            });
        }else{
            openConfirm({
                title: '¿Crear colaborador?',
                message:    `¿Deseas crear al colaborador "${row.name} ${row.last_name}".  
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, crear',
                cancelLabel: 'Cancelar',
                action: addEmployee,
                data: row
            });
        }
    }

    async function deleteEmployee (data) {
        let ruta = `employee/delete/${data.id}`;
        try {
            const response = await updateData(ruta);
            if (response.status === 'success') {
                dbStore.deleteRow(data.id, 'db_employees_all');
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
            title: '¿Eliminar colaborador?',
            message:    `¿Deseas eliminar el colaborador "${data.name} ${data.last_name}"? 
                        Esta acción no se puede deshacer.`,
            confirmLabel: 'Sí, eliminar',
            cancelLabel: 'Cancelar',
            action: deleteEmployee,
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
    };
    onMounted(async () => {
        await loadData();
    });
</script>

<template>
    <div class="container_into">
        <form class="formulario-principal">
            <h2>Colaboradores</h2>

            <label for="name">Nombres</label>
            <input id="name" type="text" name="name" v-model="campos.name" required title="Sólo se admite letras y espacios.">

            <label for="last_name">Apellidos</label>
            <input id="last_name" type="text" name="last_name" v-model="campos.last_name" required title="Sólo se admite letras y espacios.">

            <label for="doc">DNI</label>
            <input id="doc" type="text" name="doc" v-model="campos.doc" required title="Sólo se admite números, 8 dígitos.">

            <label for="phone">Teléfono / celular</label>
            <input id="phone" type="text" name="phone" v-model="campos.phone" required title="Sólo se admite números, 9 dígitos.">

            <label for="position">Puesto de trabajo</label>
            <input id="position" type="text" name="position" v-model="campos.position" required title="Sólo se admite letras y espacios.">

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
                    <th>Colaborador</th>
                    <th>Documento</th>
                    <th>Puesto</th>
                    <th>Teléfono</th>
                    <th>Fecha de ingreso</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="e in employeesCache" :key="e.id">
                    <td>{{ e.name }} {{ e.last_name }}</td>
                    <td>{{ e.doc }}</td>
                    <td>{{ e.position }}</td>
                    <td>{{ e.phone }}</td>
                    <td>{{ formatDate(e.date_record, { format: 'DMA' }) }}</td>
                    <td style="text-align: center; width: 100px;">
                        <div>
                            <button class="btn-tab-edit" @click="selectEmployee(e)">Editar</button>
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