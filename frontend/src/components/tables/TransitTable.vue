<script setup>
    import { defineProps, computed, ref, watch, onBeforeUnmount } from 'vue';
    import { formatDate } from '../../services/date.js';
    import { useDB } from '../../stores/dataBases';

    const dbStore = useDB();

    const props = defineProps({
        array_data: {
            type: Array,
            required: true
        },
        concept: {
            type: String,
            required: true
        }
    });
    const filtro = ref({
        fecha: '',
        tipo: '',
        serie: '',
        nro: '',
        ruc: '',
        rs: '',
        concepto: '',
        importe: '',
        estado: ''
    })
        const rows = computed(() => props.array_data);

        // debounced copy of filtros to avoid recomputing on every keystroke
        const debouncedFiltro = ref({ ...filtro.value });
        let filtroTimer = null;
        watch(filtro, (newVal) => {
            if (filtroTimer) clearTimeout(filtroTimer);
            filtroTimer = setTimeout(() => {
                debouncedFiltro.value = { ...newVal };
            }, 500);
        }, { deep: true });
        onBeforeUnmount(() => { if (filtroTimer) clearTimeout(filtroTimer); });

        const filteredRows = computed(() => {
            const f = debouncedFiltro.value;
            const fechaF = (f.fecha || '').toString().toLowerCase();
            const tipoF = (f.tipo || '').toString().toLowerCase();
            const serieF = (f.serie || '').toString().toLowerCase();
            const nroF  = (f.nro  || '').toString().toLowerCase();
            const rucF  = (f.ruc  || '').toString().toLowerCase();
            const rsF   = (f.rs   || '').toString().toLowerCase();
            const conceptoF = (f.concepto || '').toString().toLowerCase();
            const importeF = (f.importe || '').toString().toLowerCase();

            return rows.value.filter(e => {
                const flat = (e['flat'] || e.flat || '').toString();
                if (flat !== props.concept) return false;

                const fecha = (formatDate(e['FECHA'], { format: 'DMA'}) || formatDate(e['date_record'], { format: 'DMA' }) || '').toString().toLowerCase();
                if (fechaF && !fecha.includes(fechaF)) return false;

                const tipo = (e['TIPO'] || e.tipo || '').toString().toLowerCase();
                if (tipoF && !tipo.includes(tipoF)) return false;

                const serie = (e['SERIE'] || e.serie || '').toString().toLowerCase();
                if (serieF && !serie.includes(serieF)) return false;

                const n_serie = (e['Nº SERIE'] || e.n_serie || '').toString().toLowerCase();
                if (nroF && !n_serie.includes(nroF)) return false;

                const ruc = (e['RUC'] || e.ruc || '').toString().toLowerCase();
                if (rucF && !ruc.includes(rucF)) return false;

                const rs = (e['RAZÓN SOCIAL DE PROVEEDOR'] || e.rs || '').toString().toLowerCase();
                if (rsF && !rs.includes(rsF)) return false;

                const concepto = (e['CONCEPTO'] || e.concept || '').toString().toLowerCase();
                if (conceptoF && !concepto.includes(conceptoF)) return false;

                const importe = (e['IMPORTE TOTAL EN SOLES'] || e.amount || '').toString().toLowerCase();
                if (importeF && !importe.includes(importeF)) return false;

                return true;
            });
        });

    function getValue(obj, key1, key2) {
        return obj[key1] ?? obj[key2] ?? '';
    }
    const totalAmount = computed(() => {
        return filteredRows.value.reduce((sum, e) => {
            const raw = e['IMPORTE TOTAL EN SOLES'] && e['flat'] === props.concept ? e['IMPORTE TOTAL EN SOLES'] : e['amount'] ?? e['AMOUNT'];
            const num = parseFloat(raw);
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
    });

    function formatImporte(val) {
        const num = parseFloat(val);
        return isNaN(num) ? '' : num.toFixed(2);
    }
    function getCondicionStyle(val) {
        return val === 'HABIDO' ? 'background: var(--c-dos);' : 'background: var(--c-cinco);';
    }
    function getEstadoStyle(val) {
        return val === 'ACTIVO' ? 'background: var(--c-dos);' : 'background: var(--c-cinco);';
    }
    function getObservacionStyle(val) {
        if (!val) return 'background: var(--c-cinco);';
        if (val.includes('es un comprobante de pago válido')) return 'background: var(--c-dos);';
        if (val.includes('fue comunicada de BAJA')) return 'background: var(--c-seis);';
        if (val.includes('no existe en los registros de SUNAT')) return 'background: var(--c-cuatro);';
        if (val.includes('ha sido informada a SUNAT')) return 'background: var(--c-tres);';
        return 'background: var(--c-cinco);';
    }
    function checkRow (row) {
        row.check = !row.check
    }
    function checkAllRows (event) {
        const checked = event.target.checked
        filteredRows.value.forEach(row => row.check = checked)
    }
    function editRow (row) {
        checkAllRows({ target: { checked: false } })
        dbStore.row_archivo = row
        dbStore.modal_archivo = true
        dbStore.modo_modal = false
    }
    function detailRow (row) {
        checkAllRows({ target: { checked: false } })
        dbStore.row_archivo = row
        dbStore.modal_archivo = true
        dbStore.modo_modal = true
    }

</script>

<template>
    
    <div class="table-scroll">
        <table class="tabla-principal">
            <thead>
                <tr>
                    <th style="text-align: center;">P/L/C</th>
                    <th style="text-align: center;"><input type="checkbox" @input="checkAllRows"></th>
                    <th style="text-align: center;">Fecha <input style="width: 70px;font-size: 12px;" type="text" v-model="filtro.fecha"></th>
                    <th style="text-align: center;">Tipo <input style="width: 25px;font-size: 12px;" type="text" v-model="filtro.tipo"></th>
                    <th style="text-align: center;">Serie <input style="width: 30px;font-size: 12px;" type="text" v-model="filtro.serie"></th>
                    <th style="text-align: center;">N° serie <input style="width: 65px;font-size: 12px;" type="text" v-model="filtro.nro"></th>
                    <th style="text-align: center;">RUC <input style="width: 80px;font-size: 12px;" type="text" v-model="filtro.ruc"></th>
                    <th style="text-align: center;">Razón social <input style="width: 190px;font-size: 12px;" type="text" v-model="filtro.rs"></th>
                    <th style="text-align: center;">Concepto <input style="width: 190px;font-size: 12px;" type="text" v-model="filtro.concepto"></th>
                    <th style="text-align: center;">Importe <input style="width: 60px;font-size: 12px;" type="text" v-model="filtro.importe"></th>
                    <th style="text-align: center;">Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="e in filteredRows" :key="e['Nº']"
                    @click="checkRow(e)"
                    :style="e.check ? 'background-color: #123f5169;' : ''"
                >
                    <td class="ids-cell">
                        <div class="ids">
                            <div class="options" :style="e.ID_PROJECT !== '0' ? 'background: var(--b-tres);' : 'background: var(--c-cinco);'">{{ e.ID_PROJECT }}</div>
                            <div class="options" :style="e.ID_LOCATION !== '0' ? 'background: var(--b-dos);' : 'background: var(--c-cinco);'">{{ e.ID_LOCATION }}</div>
                            <div class="options" :style="e.ID_EMPLOYEE !== '0' ? 'background: var(--b-seis);' : 'background: var(--c-cinco);'">{{ e.ID_EMPLOYEE }}</div>
                        </div>
                    </td>
                    <td style="width: 30px;text-align: center;"><input type="checkbox" :checked="e.check"></td>
                    <td style="width: 80px;text-align: center;">
                        {{ formatDate(e['FECHA'], { format: 'DMA'}) || formatDate(e['date_record'], { format: 'DMA' }) }}
                    </td>
                    <td style="width: 30px;text-align: center;">{{ e['TIPO'] || e['tipo'] }}</td>
                    <td style="width: 40px;">{{ e['SERIE'] || e['serie'] }}</td>
                    <td style="width: 70px;text-align: right;">{{ e['Nº SERIE'] || e['n_serie'] }}</td>
                    <td style="width: 90px;text-align: center;">{{ e['RUC'] || e['ruc'] }}</td>
                    <td style="width: 200px;">{{ e['RAZÓN SOCIAL DE PROVEEDOR'] || e['rs'] }}</td>
                    <td style="width: 200px;">{{ e['CONCEPTO'] || e['concept'] }}</td>
                    <td style="width: 72px; text-align: right;">
                        S/ {{ formatImporte(getValue(e, 'IMPORTE TOTAL EN SOLES', 'amount')) }}
                    </td>
                    <td class="ids-cell">
                        <div class="ids">

                            <div class="result"
                                :style="getCondicionStyle(getValue(e, 'CONDICION DEL CONTRIBUYENTE', 'c_c'))"
                            >H</div>
                            <div class="result"
                                :style="getEstadoStyle(getValue(e, 'ESTADO DEL CONTRIBUYENTE', 'e_c'))"
                            >A</div>
                            <div class="result"
                                :style="getObservacionStyle(getValue(e, 'OBSERVACION CONSULTA CPE', 'cpe'))"
                            >CPE</div>
                        </div>
                    </td>
                    <td>
                        <button class="btn-tab-edit" @click.prevent="editRow(e)">E</button>
                        <button class="btn-tab-delete" @click.prevent="detailRow(e)">D</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <span>Total: {{ filteredRows.length }} filas - total importe: S/ {{ totalAmount.toFixed(2) }}</span>

</template>

<style scoped>
    .table-scroll {
        max-height: 55vh; /* ajusta la altura deseada */
        overflow-y: auto;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
    }

    .tabla-principal thead {
        position: sticky;
        top: 0; 
        z-index: 2;
    }
    .ids {
        display:flex;
        justify-content: center;
        align-items: center;
    }
    .ids-cell {
        text-align: center;
        vertical-align: middle;
    }
    .options {
        width: 32px;
        height: 20px;
        text-align: center;
    }
    .result {
        width: 32px;
        height: 20px;
        text-align: center;
        background: var(--c-cinco);
    }
</style>