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
        ID_NATURAL:'',
        NAME: '',
        LAST_NAME: '',
        NUMBER_DOCUMENT: '',
        NUMBER_MOVIL: '',
        ID_ROLE: '0',
    });
    const dbStore = useDB();
    const roleCache = ref([]);
    const employeesCache = ref([])
    const projectsCache = ref([])

    function selectEmployee (result) {
        campos.value.ID_NATURAL = result.ID_NATURAL;
        campos.value.NAME = result.NAME;
        campos.value.LAST_NAME = result.LAST_NAME;
        campos.value.NUMBER_DOCUMENT = result.NUMBER_DOCUMENT;
        campos.value.NUMBER_MOVIL = result.NUMBER_MOVIL;
        campos.value.ID_ROLE = result.ID_ROLE;

        modalMessage(true, `Datos de "${result.NAME} ${result.LAST_NAME}" obtenidos.`, 'info')
    }
    function restartCampos () {
        campos.value.ID_NATURAL = '';
        campos.value.NAME = '';
        campos.value.LAST_NAME = '';
        campos.value.NUMBER_DOCUMENT = '';
        campos.value.NUMBER_MOVIL = '';
        campos.value.ID_ROLE = '0';
    }

    function buildRow(dataRef) {
        if (!dataRef || !dataRef.value) return null
        const result = {}
        for (let item of Object.keys(dataRef.value)) {
            const val = dataRef.value[item]
            const validator = validation[item]
            result[item] = typeof validator === 'function' ? validator(val) : val
        }
        return result
    }
    async function addEmployee (row){
        const ruta = `employee/add`;
        try {
            const response = await sendData(ruta, row)
            if(response.status === 'success'){
                // if(dbStore.db_transit_all.data.length < 20){
                //     dbStore.addRow(response.data, 'db_transit_all');
                // }
                dbStore.addRow(response.data, 'db_employees_all');
                await loadData()
                restartCampos();
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al crear al colaborador", 'error')
        }
    }

    async function updateEmployee (row) { 
        const ruta = `employee/update/${row.ID_NATURAL}`;
        try {
            const response = await updateData(ruta, row);
            if(response.status === 'success'){
                dbStore.updateRow(row.ID_NATURAL, response.data, 'db_employees_all');
                await loadData()
                restartCampos();
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al actualizar al colaborador", 'error')
        }
    }
    async function procesar(){
        const row = buildRow(campos);
        if (row.status === 'error') {
            return modalMessage(true, `${row.message}`, 'error');
        }

        if(row.ID_NATURAL !== ''){
            openConfirm({
                title: '¿Actualizar colaborador?',
                message:    `¿Deseas actualizar al colaborador "${row.NAME} ${row.LAST_NAME}". 
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, actualizar',
                cancelLabel: 'Cancelar',
                action: updateEmployee,
                data: row
            });
        }else{
            openConfirm({
                title: '¿Crear colaborador?',
                message:    `¿Deseas crear al colaborador "${row.NAME} ${row.LAST_NAME}".  
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, crear',
                cancelLabel: 'Cancelar',
                action: addEmployee,
                data: row
            });
        }
    }

    async function deleteEmployee (data) {
        let ruta = `employee/delete/${data.ID_NATURAL}`;
        try {
            const response = await updateData(ruta);
            if (response.status === 'success') {
                dbStore.deleteRow(data.ID_NATURAL, 'db_employees_all', 'ID_NATURAL');
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
            message:    `¿Deseas eliminar el colaborador "${data.NAME} ${data.LAST_NAME}"? 
                        Esta acción no se puede deshacer.`,
            confirmLabel: 'Sí, eliminar',
            cancelLabel: 'Cancelar',
            action: deleteEmployee,
            data: data
        });
    }
    async function loadData() {
        await dbStore.createDB('db_roles_all', 'roles');
        roleCache.value = dbStore.db_roles_all.data;

        await dbStore.createDB('db_employees_all', 'employees');
        employeesCache.value = dbStore.db_employees_all.data; 
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
            <input id="name" type="text" name="name" v-model="campos.NAME" required title="Sólo se admite letras y espacios.">

            <label for="last_name">Apellidos</label>
            <input id="last_name" type="text" name="last_name" v-model="campos.LAST_NAME" required title="Sólo se admite letras y espacios.">

            <label for="doc">DNI</label>
            <input id="doc" type="text" name="doc" v-model="campos.NUMBER_DOCUMENT" required title="Sólo se admite números, 8 dígitos.">

            <label for="phone">Teléfono / celular</label>
            <input id="phone" type="text" name="phone" v-model="campos.NUMBER_MOVIL" required title="Sólo se admite números, 9 dígitos.">

            <label for="position">Puesto de trabajo</label>
            <select id="position" name="position" v-model="campos.ID_ROLE" required>
                <option value="0" disabled>Seleccione un puesto</option>
                <option v-for="r in roleCache" :value="r.ID_ROLE">{{ r.NAME }}</option>
            </select>
            <button type="submit" class="btn-in" @click.prevent="procesar()">Procesar</button>
            <button type="submit" class="btn-out" @click.prevent="restartCampos()">Restablecer</button>
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
                    <td>{{ e.NAME }} {{ e.LAST_NAME }}</td>
                    <td>{{ e.NUMBER_DOCUMENT }}</td>
                    <td>{{ e.ROLE }}</td>
                    <td>{{ e.NUMBER_MOVIL }}</td>
                    <td>{{ formatDate(e.DATE_RECORD, { format: 'DMA' }) }}</td>
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