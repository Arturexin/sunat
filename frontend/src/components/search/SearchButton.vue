<script setup>
    import { ref, defineProps } from 'vue';
    import { useDB } from '../../stores/dataBases';

    const dbStore = useDB();
    const props = defineProps({
        message_success: {
            type: Function,
            required: true
        },
        message_error: {
            type: Function,
            required: true
        },
    })


    async function loadata() {
        if(dbStore.id_data.id_project !== '0'){
            await dbStore.createDB('db_transit_all', `transits?`+
            `id_project=${Number(dbStore.id_data.id_project)}&`+
            `id_location=${Number(dbStore.id_data.id_location)}&`+
            `id_area=${Number(dbStore.id_data.id_area)}&`+
            `id_employee=${Number(dbStore.id_data.id_employee)}`); 

            dbStore.object_transit.comprobante = dbStore.db_transit_all.data;                    
            console.log("Transits cache:", dbStore.object_transit.comprobante );
            props.message_success
        } else {
            props.message_error
            
        }
    }
</script>

<template>
    <div style="display: flex; align-items: baseline; gap: 10px;justify-content: center;">
        <button class="btn1" @click="loadata()">
            Buscar archivo
        </button>
    </div>
</template>

<style scoped>

</style>