<script setup>
    import { ref, onMounted } from 'vue';
    import { sendData, updateData } from '../services/crud';
    import { resetForm, validation} from '../services/validate.js';
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
        ID_PROJECT: '',
        NAME: '',
        ID_JURIDIC: '0',
        ID_COIN: '0',
        AMOUNT: '',
        ID_NATURAL: '0',
        DATE_START: '',
        DATE_END: '',
        ID_COIN: '0'
    });
    const responsableCache = ref([])
    const empresaCache = ref([])
    const projectsCache = ref([])
    const listCoinCache = ref([])
    const dbStore = useDB();

    function selectProject (result) {
        campos.value.ID_PROJECT = result.ID_PROJECT;
        campos.value.NAME = result.NAME;
        campos.value.ID_JURIDIC = result.ID_JURIDIC;
        campos.value.ID_COIN = result.ID_COIN;
        campos.value.AMOUNT = result.AMOUNT;
        campos.value.ID_NATURAL = result.ID_NATURAL;
        campos.value.DATE_START = formatDate(result.DATE_START, { format: 'AMD' });
        campos.value.DATE_END = formatDate(result.DATE_END, { format: 'AMD' });
        
        modalMessage(true, `Datos de "${result.NAME}" obtenidos.`, 'info')
    }
    function restartCampos () {
        campos.value.ID_PROJECT = '';
        campos.value.NAME = '';
        campos.value.ID_JURIDIC = '0';
        campos.value.ID_COIN = '0';
        campos.value.AMOUNT = '';
        campos.value.ID_NATURAL = '0';
        campos.value.DATE_START = '';
        campos.value.DATE_END = '';
    }

    function buildRow(dataRef) {
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
        return result
    };

    async function addProject (row){
        const ruta = `project/add`;
        try {
            const response = await sendData(ruta, row)
            if(response.status === 'success'){

                dbStore.addRow(response.data, 'db_projects_all');
                await loadData();
                restartCampos();
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al crear el proyecto", 'error')
        }
    }

    async function updateProject (row) { 
        const ruta = `project/update/${row.ID_PROJECT}`;
        try {
            const response = await updateData(ruta, row);
            if(response.status === 'success'){
                dbStore.updateRow(row.ID_PROJECT, response.data, 'db_projects_all', 'ID_PROJECT');
                await loadData();
                restartCampos();
                modalMessage(true, response.message, 'success')
            }
        } catch (error) {
            modalMessage(true, "Error al actualizar el proyecto", 'error')
        }
    }
    async function procesar(){
        const row = buildRow(campos);
        if (row.status === 'error') {
            return modalMessage(true, `${row.message}`, 'error');
        }

        if(row.ID_PROJECT !== ''){
            openConfirm({
                title: 'Actualizar proyecto',
                message:    `¿Deseas actualizar el proyecto "${row.NAME}"?. 
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, actualizar',
                cancelLabel: 'Cancelar',
                action: updateProject,
                data: row
            });
        }else{
            openConfirm({
                title: 'Crear proyecto',
                message:    `¿Deseas crear el proyecto "${row.NAME}"?.  
                            Esta acción no se puede deshacer.`,
                confirmLabel: 'Sí, crear',
                cancelLabel: 'Cancelar',
                action: addProject,
                data: row
            });
        };
    };

    async function deleteProject (data) {
        let ruta = `project/delete/${data.ID_PROJECT}`;
        try {
            const response = await updateData(ruta);
            if (response.status === 'success') {
                dbStore.deleteRow(data.ID_PROJECT, 'db_projects_all', 'ID_PROJECT');
                console.log(dbStore.db_projects_all)
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
            message:    `¿Deseas eliminar el proyecto "${data.NAME}"?. 
                        Esta acción no se puede deshacer.`,
            confirmLabel: 'Sí, eliminar',
            cancelLabel: 'Cancelar',
            action: deleteProject,
            data: data
        });
    }

    async function loadData() {
        await dbStore.createDB('db_empresa_all', 'empresa');
        empresaCache.value = dbStore.db_empresa_all.data;
        
        await dbStore.createDB('db_employees_select', 'select_employees');
        responsableCache.value = dbStore.db_employees_select.data;

        await dbStore.createDB('db_projects_all', 'projects');
        projectsCache.value = dbStore.db_projects_all.data;
        console.log('Proyectos cargados:', projectsCache.value);

        await dbStore.createDB('db_coin_all', 'coins')
        listCoinCache.value = dbStore.db_coin_all.data;
        console.log("Monedas cache:", listCoinCache.value);
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
            <input id="name" type="text" name="name" v-model="campos.NAME" required title="Sólo se admite letras y espacios.">

            <label for="id_empresas">Empresa</label>
            <select name="id_empresas" id="id_empresas" v-model="campos.ID_JURIDIC">
                <option value="0" selected>--Seleccione una empresa--</option>
                <option v-for="e in empresaCache" :value="e.ID_JURIDIC">{{ e.COMPANY_NAME }}</option>
            </select>

            <label for="amount">Presupuesto</label>
            <input id="amount" type="text" name="amount" v-model="campos.AMOUNT" required title="Sólo se admite números, 9 dígitos.">

            <label for="amount">Moneda</label>
            <select name="moneda" id="moneda" v-model="campos.ID_COIN">
                <option value="0" selected>--Seleccione una moneda--</option>
                <option v-for="e in listCoinCache" :value="e.ID_COIN">{{ e.ISO }}: {{ e.NAME }} {{ e.SIMBOL }}</option>
            </select>

            <label for="id_employees">Responsable</label>
            <select name="id_employees" id="id_employees" v-model="campos.ID_NATURAL">
                <option value="0" selected>--Seleccione un responsable--</option>
                <option v-for="e in responsableCache" :value="e.ID_NATURAL">{{ e.FULL_NAME}}</option>
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
                <tr v-for="e in projectsCache" :key="e.ID_PROJECT">
                    <td style="text-align: left; width: 150px;">{{ e.NAME }}</td>
                    <td style="text-align: center; width: 100px;">{{ e.NUMBER_DOCUMENT }}</td>
                    <td style="text-align: left; width: 200px;">{{ e.COMPANY_NAME }}</td>
                    <td style="text-align: right; width: 80px;">{{ e.SIMBOL }} {{ e.AMOUNT }}</td>
                    <td style="text-align: left; width: 150px;">{{ e.RESPONSABLE }} {{ e.LAST_NAME }}</td>
                    <td style="text-align: center; width: 90px;">{{ formatDate(e.DATE_START, { format: 'DMA' }) }}</td>
                    <td style="text-align: center; width: 90px;">{{ formatDate(e.DATE_END, { format: 'DMA' }) }}</td>
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