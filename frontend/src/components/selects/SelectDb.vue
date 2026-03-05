<script setup>
    import { ref, onMounted } from 'vue';
    import { useDB } from '../../stores/dataBases';

    const dbStore = useDB();

    const employeesCache = ref([]);
    const locationsCache = ref([]);
    const projectsCache = ref([]);

    async function loadData() {

        await dbStore.createDB('db_employees_select', 'select_employees');
        employeesCache.value = dbStore.db_employees_select.data.length > 0 
            ? dbStore.db_employees_select.data : [];
        
        await dbStore.createDB('db_locations_select', 'select_locations');
        locationsCache.value = dbStore.db_locations_select.data.length > 0 
            ? dbStore.db_locations_select.data : [];

        await dbStore.createDB('db_projects_select', 'select_projects')
        projectsCache.value = dbStore.db_projects_select.data.length > 0 
            ? dbStore.db_projects_select.data : [];

    };

    onMounted(async () => {
        await loadData()
    });

</script>

<template>
    <div class="select_container">
        <div style="display: grid;align-items: center;gap: 3px;">
            <label style="font-size: 12px" for="project_home">Proyecto</label>
            <select style="background: var(--b-tres);" name="project_home" id="project_home" class="select" v-model="dbStore.id_data.id_project">
                <option value="0" selected>--Seleccione un proyecto--</option>
                <option v-for="e in projectsCache" :value="e.ID_PROJECT">{{ e.ID_PROJECT}}: {{ e.NAME }}</option>
            </select>
        </div>
        <div style="display: grid;align-items: center;gap: 3px;">
            <label style="font-size: 12px" for="location_home">Locación</label>
            <select style="background: var(--b-dos);" name="location_home" id="location_home" class="select" v-model="dbStore.id_data.id_location">
                <option value="0" selected>--Seleccione una locación--</option>
                <option v-for="e in locationsCache" :value="e.ID_LOCATION">{{ e.ID_LOCATION }}: {{ e.NAME }}</option>
            </select>
        </div>
        <div style="display: grid;align-items: center;gap: 3px;">
            <label style="font-size: 12px" for="employee_home">Colaboradores</label>
            <select style="background: var(--b-seis);" name="employee_home" id="employee_home" class="select" v-model="dbStore.id_data.id_employee">
                <option value="0" selected>--Seleccione un colaborador--</option>
                <option v-for="e in employeesCache" :value="e.ID_NATURAL">{{ e.ID_NATURAL}}: {{ e.FULL_NAME }}</option>
            </select>
        </div>
    </div>
</template>

<style scoped>

</style>