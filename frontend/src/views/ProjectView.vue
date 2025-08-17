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
        ruc: '',
        rs: '',
        amount: '',
        id_employees: '0',
        date_start: '',
        date_end: ''
    });

    const employeesCache = ref([])
    const projectsCache = ref([])

    const dbStore = useDB();

    function selectProject (result) {
        campos.value.id = result.id;
        campos.value.name = result.name;
        campos.value.ruc= result.ruc;
        campos.value.rs = result.rs;
        campos.value.amount = result.amount;
        campos.value.id_employees = result.id_employees;
        campos.value.date_start = formatDate(result.date_start, { format: 'AMD' });
        campos.value.date_end = formatDate(result.date_end, { format: 'AMD' });
        modalMessage(true, `Datos de "${result.name}" obtenidos.`, 'info')
    }

    function buildRow() {
        const data = {
            id: validation.id(campos.value.id),
            name: validation.name(campos.value.name),
            ruc: validation.ruc(campos.value.ruc),
            rs: validation.rs(campos.value.rs),
            amount: validation.salary(campos.value.amount),
            id_employees: validation.id(campos.value.id_employees),
            date_start: formatDate(campos.value.date_start, { format: 'AMD_HMS' }),
            date_end: formatDate(campos.value.date_end, { format: 'AMD_HMS' }),
            date_record: formatDate(null, { format: 'AMD_HMS' }),
        }
        return data;
    };

    async function addProject (row){
        const ruta = `project/add`;
        try {
            const response = await sendData(ruta, row)
            if(response.status === 'success'){

                dbStore.addRow(response.data, 'db_projects_all');
                await loadData();
                restablecer(campos.value, resetForm);
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al crear el proyecto", 'error')
        }
    }

    async function updateProject (row) { 
        const ruta = `project/update/${row.id}`;
        try {
            const response = await updateData(ruta, row);
            if(response.status === 'success'){
                dbStore.updateRow(row.id, response.data, 'db_projects_all');
                await loadData();
                restablecer(campos.value, resetForm);
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al actualizar el proyecto", 'error')
        }
    }
    async function procesar(){
        const row = buildRow();
        if (row.status === 'error') {
            return modalMessage(true, `${row.message}`, 'error');
        }

        if(row.id !== ''){
            openConfirm({
                title: 'Actualizar proyecto',
                message:    `¿Deseas actualizar el proyecto "${row.name}"?. 
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, actualizar',
                cancelLabel: 'Cancelar',
                action: updateProject,
                data: row
            });
        }else{
            openConfirm({
                title: 'Crear proyecto',
                message:    `¿Deseas crear el proyecto "${row.name}"?.  
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, crear',
                cancelLabel: 'Cancelar',
                action: addProject,
                data: row
            });
        };
    };

    async function deleteProject (data) {
        let ruta = `project/delete/${data.id}`;
        try {
            const response = await updateData(ruta);
            if (response.status === 'success') {
                dbStore.deleteRow(data.id, 'db_projects_all');
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
            title: 'Eliminar proyecto',
            message:    `¿Deseas eliminar el proyecto "${data.name}"?. 
                        Esta acción no se puede deshacer.`,
            confirmLabel: 'Sí, eliminar',
            cancelLabel: 'Cancelar',
            action: deleteProject,
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
            <h2>Proyecto</h2>

            <label for="name">Nombre</label>
            <input id="name" type="text" name="name" v-model="campos.name" required title="Sólo se admite letras y espacios.">

            <label for="ruc">RUC</label>
            <input id="ruc" type="text" name="ruc" v-model="campos.ruc" required title="Sólo se admite letras y espacios.">

            <label for="rs">Razón social</label>
            <input id="rs" type="text" name="rs" v-model="campos.rs" required title="Sólo se admite números, 8 dígitos.">

            <label for="amount">Presupuesto</label>
            <input id="amount" type="text" name="amount" v-model="campos.amount" required title="Sólo se admite números, 9 dígitos.">

            <label for="id_employees">Responsable</label>
            <select name="id_employees" id="id_employees" v-model="campos.id_employees">
                <option value="0" selected>--Seleccione un responsable--</option>
                <option v-for="e in employeesCache" :value="e.id">{{ e.id }}: {{ e.name }} {{ e.last_name }}</option>
            </select>
    
            <div style="display: flex; gap: 10px;justify-content: center;">
                <div style="display: grid;">
                    <label for="entrada">Fecha de inicio</label>
                    <input type="date" id="entrada" name="entrada" v-model="campos.date_start">
                </div>
                <div style="display: grid;">
                    <label for="salida">Fecha de cierre</label>
                    <input type="date" id="salida" name="salida" v-model="campos.date_end">
                </div>
            </div>

            <button type="submit" class="btn-in" @click.prevent="procesar()">Procesar</button>
            <button type="submit" class="btn-out" @click.prevent="restablecer(campos, resetForm)">Restablecer</button>
        </form>
        <table class="tabla-principal">
            <thead>
                <tr>
                    <th  scope="row" colspan="15" style="color: var(--color-secundario);">
                        <h2>Lista de Proyectos</h2>
                    </th>
                </tr>
                <tr>
                    <th>Proyecto</th>
                    <th>RUC</th>
                    <th>Razón social</th>
                    <th>Presupuesto</th>
                    <th>Encargado</th>
                    <th>Inicio</th>
                    <th>Cierre</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="e in projectsCache" :key="e.id">
                    <td style="text-align: left; width: 150px;">{{ e.name }}</td>
                    <td style="text-align: center; width: 100px;">{{ e.ruc }}</td>
                    <td style="text-align: left; width: 200px;">{{ e.rs }}</td>
                    <td style="text-align: right; width: 80px;">S/ {{ e.amount.toFixed(2) }}</td>
                    <td style="text-align: left; width: 150px;">{{ e.name_employee }} {{ e.last_name }}</td>
                    <td style="text-align: center; width: 90px;">{{ formatDate(e.date_start, { format: 'DMA' }) }}</td>
                    <td style="text-align: center; width: 90px;">{{ formatDate(e.date_end, { format: 'DMA' }) }}</td>
                    <td style="text-align: center; width: 100px;">
                        <div>
                            <button class="btn-tab-edit" @click="selectProject(e)">Editar</button>
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