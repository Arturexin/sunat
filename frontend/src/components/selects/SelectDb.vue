<script setup>
    import { ref, onMounted } from 'vue';
    import { useDB } from '../../stores/dataBases';

    const dbStore = useDB();

    const employeesCache = ref([]);
    const projectsCache = ref([]);
    const locationsCache = ref([]);
    const areasCache = ref([]);

    function changeProject() {
        dbStore.id_data.id_location = '0';
        dbStore.id_data.id_area = '0';
        dbStore.id_data.id_employee = '0';
    }
    function changeLocation() {
        dbStore.id_data.id_area = '0';
        dbStore.id_data.id_employee = '0';
    }
    function changeArea() {
        dbStore.id_data.id_employee = '0';
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
        if (dbStore.db_areas_all.data.length === 0) {
            await dbStore.createDB('db_areas_all', 'areas');
        }
        areasCache.value = dbStore.db_areas_all.data;
        console.log("Areas cache:", areasCache.value);
    };

    onMounted(async () => {
        await loadData()
    });

</script>

<template>
    <div class="select_container">
        <div style="display: grid;align-items: center;gap: 5px;">
            <label for="project_home">Proyecto</label>
            <select name="project_home" id="project_home" class="select" v-model="dbStore.id_data.id_project" @change="changeProject">
                <option value="0" selected>--Seleccione un proyecto--</option>
                <option v-for="e in projectsCache" :value="e.id">{{ e.id}}: {{ e.name }}</option>
            </select>
        </div>
        <div style="display: grid;align-items: center;gap: 5px;">

            <label for="location_home">Locación</label>
            <select name="location_home" id="location_home" class="select" v-model="dbStore.id_data.id_location" @change="changeLocation">
                <option value="0" selected>--Seleccione una locación--</option>
                <option v-for="e in locationsCache.filter(loc => loc.id_project == dbStore.id_data.id_project)" :value="e.id">{{ e.id }}: {{ e.name }}</option>
            </select>
        </div>
        <div style="display: grid;align-items: center;gap: 5px;">
            <label for="area_home">Areas</label>
            <select name="area_home" id="area_home" class="select" v-model="dbStore.id_data.id_area" @change="changeArea">
                <option value="0" selected>--Seleccione una área--</option>
                <option v-for="e in areasCache.filter(ar => ar.id_location === dbStore.id_data.id_location)" :value="e.id">{{ e.id}}: {{ e.name }}</option>
            </select>
        </div>
        <div style="display: grid;align-items: center;gap: 5px;">
            <label for="employee_home">Colaboradores</label>
            <select name="employee_home" id="employee_home" class="select" v-model="dbStore.id_data.id_employee">
                <option value="0" selected>--Seleccione un colaborador--</option>
                <option v-for="e in employeesCache" :value="e.id">{{ e.id}}: {{ e.name }} {{ e.last_name }}</option>
            </select>
        </div>
    </div>
</template>

<style scoped>

</style>