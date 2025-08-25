<script setup>
    import { defineProps } from 'vue';
    import { formatDate } from '../../services/date.js';

    const props = defineProps({
        array_data: {
            type: Array,
            required: true
        }
    });


    function getValue(obj, key1, key2) {
        return obj[key1] ?? obj[key2] ?? '';
    }
    function formatImporte(val) {
        const num = parseFloat(val);
        return isNaN(num) ? '' : num.toFixed(2);
    }
    function getCondicionStyle(val) {
        return val === 'HABIDO' ? 'color: green;' : 'color: red;';
    }
    function getEstadoStyle(val) {
        return val === 'ACTIVO' ? 'color: green;' : 'color: red;';
    }
    function getObservacionStyle(val) {
        if (!val) return 'color: #eee;';
        if (val.includes('es un comprobante de pago válido')) return 'color: green;';
        if (val.includes('fue comunicada de BAJA')) return 'color: orange;';
        if (val.includes('no existe en los registros de SUNAT')) return 'color: red;';
        if (val.includes('ha sido informada a SUNAT')) return 'color: blue;';
        return 'color: #eee;';
    }
</script>

<template>
    <div>
        <table class="tabla-principal">
            <thead>
                <tr>
                    <th scope="row" colspan="15" style="text-align: center;">
                        <h2>Comprobantes - total: {{ props.array_data.length }} filas</h2>
                    </th>
                </tr>
                <tr>
                    <!-- <th style="text-align: center;">N°</th> -->
                    <th style="text-align: center;">Fecha</th>
                    <th style="text-align: center;">Tipo</th>
                    <th style="text-align: center;">Serie</th>
                    <th style="text-align: center;">N° serie</th>
                    <th style="text-align: center;">RUC</th>
                    <th style="text-align: center;">Razón social</th>
                    <th style="text-align: center;">Concepto</th>
                    <th style="text-align: center;">Importe</th>
                    <th style="text-align: center;">Condición</th>
                    <th style="text-align: center;">Estado</th>
                    <th style="text-align: center;">Obsercación</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="e in props.array_data">
                    <!-- <td style="width: 30px;text-align: center;">{{ e['Nº'] }}</td> -->
                    <td style="width: 80px;text-align: center;">{{ e['FECHA'] || formatDate(e['date_record'], { format: 'DMA' }) }}</td>
                    <td style="width: 30px;text-align: center;">{{ e['TIPO'] || e['tipo'] }}</td>
                    <td style="width: 50px;">{{ e['SERIE'] || e['serie'] }}</td>
                    <td style="width: 90px;">{{ e['Nº SERIE'] || e['n_serie'] }}</td>
                    <td style="width: 90px;text-align: center;">{{ e['RUC'] || e['ruc'] }}</td>
                    <td style="width: 200px;">{{ e['RAZÓN SOCIAL DE PROVEEDOR'] || e['rs'] }}</td>
                    <td style="width: 200px;">{{ e['CONCEPTO'] || e['concept'] }}</td>
                    <td style="width: 72px; text-align: right;">
                        S/ {{ formatImporte(getValue(e, 'IMPORTE TOTAL EN SOLES', 'amount')) }}
                    </td>
                    <td
                        :style="getCondicionStyle(getValue(e, 'CONDICION DEL CONTRIBUYENTE', 'c_c'))"
                        style="width: 72px; text-align: center;"
                    >
                        {{ getValue(e, 'CONDICION DEL CONTRIBUYENTE', 'c_c') }}
                    </td>
                    <td
                        :style="getEstadoStyle(getValue(e, 'ESTADO DEL CONTRIBUYENTE', 'e_c'))"
                        style="width: 72px; text-align: center;"
                    >
                        {{ getValue(e, 'ESTADO DEL CONTRIBUYENTE', 'e_c') }}
                    </td>
                    <td
                        :style="getObservacionStyle(getValue(e, 'OBSERVACION CONSULTA CPE', 'cpe'))"
                        style="width: 200px; text-align: left;"
                    >
                        {{ getValue(e, 'OBSERVACION CONSULTA CPE', 'cpe') }}
                    </td>
                    <td>
                        <button>Edit</button>
                        <button>Delete</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

</template>

<style scoped>

</style>