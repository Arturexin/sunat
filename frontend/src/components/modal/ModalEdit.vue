<script setup>
import { onMounted, ref, defineProps } from 'vue';
import { useDB } from '../../stores/dataBases';
import { filtro } from '../../services/search_input.js';

const dbStore = useDB();
const props = defineProps({
    modo: {
        type: Boolean,
        default: false
    }
})

const form = ref({
    nro: '',
    fecha: '',
    tipo: '',
    serie: '',
    n_serie: '',
    ruc: '',
    importe: '',
    razon_social: '',
    concepto: '',
    condicion_contribuyente: '',
    estado_contribuyente: '',
    observacion_consulta_cpe: '',
})
const row = ref({ ...dbStore.row_archivo })
function edit () {
    const rowSet = new Set()
    dbStore.modal_archivo = false
    dbStore.row_archivo['FECHA'] = form.value.fecha
    dbStore.row_archivo['TIPO'] = form.value.tipo
    dbStore.row_archivo['Nº SERIE'] = form.value.n_serie
    dbStore.row_archivo['SERIE'] = form.value.serie
    dbStore.row_archivo['RUC'] = form.value.ruc
    dbStore.row_archivo['IMPORTE TOTAL EN SOLES'] = form.value.importe
    filtro(dbStore.row_archivo, rowSet)
    // dbStore.row_archivo['Nº'] = form.value.nro
    console.log('dbStore', dbStore.row_archivo)
}
function cancel () {
    dbStore.modal_archivo = false
}
onMounted(() => {
    form.value = { 
        nro: row.value['NRO'] ?? row.value['nro'] ?? '',
        fecha: row.value['FECHA'] ?? row.value['fecha'] ?? '',
        tipo: row.value['TIPO'] ?? row.value['tipo'] ?? '',
        serie: row.value['SERIE'] ?? row.value['serie'] ?? '',
        n_serie: row.value['Nº SERIE'] ?? row.value['n_serie'] ?? '',
        ruc: row.value['RUC'] ?? row.value['ruc'] ?? '',
        importe: row.value['IMPORTE TOTAL EN SOLES'] ?? row.value['importe'] ?? '',
        razon_social: row.value['RAZÓN SOCIAL DE PROVEEDOR'] ?? row.value['razon_social'] ?? '',
        concepto: row.value['CONCEPTO'] ?? row.value['concepto'] ?? '',
        condicion_contribuyente: row.value['CONDICION DEL CONTRIBUYENTE'] ?? row.value['condicion_contribuyente'] ?? '',
        estado_contribuyente: row.value['ESTADO DEL CONTRIBUYENTE'] ?? row.value['estado_contribuyente'] ?? '',
        observacion_consulta_cpe: row.value['OBSERVACION CONSULTA CPE'] ?? row.value['observacion_consulta_cpe'] ?? '',
        observacion: row.value['Observación'] ?? '',
        id_employee: row.value['ID_EMPLOYEE'] ?? '0',
        id_location: row.value['ID_LOCATION'] ?? '0',
        id_project: row.value['ID_PROJECT'] ?? '0'
    }
})
</script>

<template>
    <div>
        <form action="" class="formulario-principal" v-if="!props.modo">
            <h2>Editar</h2>
            <div class="campo">
                <label for="">Fecha</label>
                <input type="datetime" v-model="form.fecha">
            </div>
            <div class="campo">
                <label for="">Tipo</label>
                <input type="text" v-model="form.tipo">
            </div>
            <div class="campo">
                <label for="">Serie</label>
                <input type="text" v-model="form.serie">
            </div>
            <div class="campo">
                <label for="">N° Serie</label>
                <input type="text" v-model="form.n_serie">
            </div>
            <div class="campo">
                <label for="">RUC</label>
                <input type="text" v-model="form.ruc">
            </div>
            <div class="campo">
                <label for="">Importe</label>
                <input type="text" v-model="form.importe">
            </div>
            <button class="btn-in" @click.prevent="edit">Editar</button>
            <button class="btn-out" @click.prevent="cancel">Salir</button>
        </form>
        <form action="" class="formulario-principal" v-if="props.modo">
            <h2>Detalle</h2>
            <div class="campo">
                <label for="">Fecha</label>
                <span>{{ form.fecha }}</span>
            </div>
            <div class="campo">
                <label for="">Tipo</label>
                <span>{{ form.tipo }}</span>
            </div>
            <div class="campo">
                <label for="">Serie</label>
                <span>{{ form.serie }}</span>
            </div>
            <div class="campo">
                <label for="">N° Serie</label>
                <span>{{ form.n_serie }}</span>
            </div>
            <div class="campo">
                <label for="">RUC</label>
                <span>{{ form.ruc }}</span>
            </div>
            <div class="campo">
                <label for="">Razón social</label>
                <span>{{ form.razon_social }}</span>
            </div>
            <div class="campo">
                <label for="">Concepto</label>
                <span>{{ form.concepto }}</span>
            </div>
            <div class="campo">
                <label for="">Importe</label>
                <span>{{ form.importe }}</span>
            </div>
            <div class="campo">
                <label for="">Condición del contribuyente</label>
                <span>{{ form.condicion_contribuyente }}</span>
            </div>
            <div class="campo">
                <label for="">Estado del contribuyente</label>
                <span>{{ form.estado_contribuyente }}</span>
            </div>
            <div class="campo">
                <label for="">Observación de consulta CPE</label>
                <span>{{ form.observacion_consulta_cpe }}</span>
            </div>
            <div class="campo">
                <label for="">Proyecto</label>
                <span>{{ form.id_project }}</span>
            </div>
            <div class="campo">
                <label for="">Locación</label>
                <span>{{ form.id_location }}</span>
            </div>
            <div class="campo">
                <label for="">Colaborador</label>
                <span>{{ form.id_employee }}</span>
            </div>
            <div class="campo">
                <label for="">Observación</label>
                <span style="color: var(--c-cuatro);">{{ form.observacion }}</span>
            </div>
            <button class="btn-out" @click.prevent="cancel">Salir</button>
        </form>
    </div>
</template>

<style scoped>
.form_ {
    display: grid;

}
.campo {
    display:grid;

}
</style>