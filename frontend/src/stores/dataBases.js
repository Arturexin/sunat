import { defineStore } from 'pinia'
import { searchData } from '../services/crud.js';

export const useDB = defineStore('db', {
    state: () => ({
        db_users: { data: [] },
        db_employees: { data: [] },
        db_transit: { data: [] },
        db_location: { data: [] },
        db_employees_all: { data: [] },
        db_projects_all: { data: [] },
        db_locations_all: { data: [] },
        db_areas_all: { data: [] },
        db_transit_all: { data: [] },
        db_location_all: { data: [] },
        isAuth: {
            state : false,
            user:{
                id: "",
                username: "",
                role: ""
            }
        }
    }),
    actions: {
        async createDB(db, ruta) {
            const result = await searchData(ruta);
            // Asegura que siempre haya una propiedad data (array)
            this[db] = { data: Array.isArray(result.data) ? result.data : [], 
                        total: result.total ? result.total : 0 };
        },
        isAuthLogin(data){
            this.isAuth = {
                state : true,
                user: data
            };
        },
        clearDB() {
            this.db_users = { data: [] };
            this.db_asistencia = { data: [] };
            this.db_asistencia_all = { data: [] };
            this.db_employees = { data: [] };
            this.isAuth = {
                state: false,
                user: {
                    id: "",
                    username: "",
                    role: ""
                }
            };
        },
        addRow(data, db){
            const dbStore = this[db];
            dbStore.data.push(data);
        },
        updateRow(id, data, db) {
            const dbStore = this[db];
            const item = dbStore.data.find(e => e.id === Number(id));
            if (item) {
                Object.assign(item, data);
            }
        },
        deleteRow(id, db) {
            const dbStore = this[db];
            const index = dbStore.data.findIndex(e => e.id === Number(id));
            if (index !== -1) {
                dbStore.data.splice(index, 1);
            }
        },

        addRowDbCache(dbCache_name, objet_row){
            let DB_LS = JSON.parse(localStorage.getItem(dbCache_name) || '[]');
            DB_LS.push(objet_row);
            localStorage.setItem(dbCache_name, JSON.stringify(DB_LS));
        },
        updateRowDbCache(id, dbCache_name, objet_row){
            let DB_LS = JSON.parse(localStorage.getItem(dbCache_name) || '[]');
            const idx = DB_LS.findIndex(e => e.id === id);
            if (idx !== -1) { 
                DB_LS[idx] = { ...DB_LS[idx], ...objet_row };
                localStorage.setItem(dbCache_name, JSON.stringify(DB_LS));
            }
        },
        deleteRowDbCache(id, dbCache_name){
            let DB_LS = JSON.parse(localStorage.getItem(dbCache_name) || '[]');
            DB_LS = DB_LS.filter(e => e.id !== id);
            localStorage.setItem(dbCache_name, JSON.stringify(DB_LS));
        }
    },
    getters: {
        // Obtener todos los empleados
        employees: (state) => state.db_employees.data || [],
        // Obtener todas las asistencias
        transit: (state) => state.db_transit.data || [],
        // Obtener todas las asistencias (histórico)
        location: (state) => state.db_location.data || [],
        // Obtener todas las epmpleados (histórico)
        employeesAll: (state) => state.db_employees_all.data || [],
        // Obtener todas las asistencias (histórico)
        transitAll: (state) => state.db_transit_all.data || [],
        // Obtener todas las sucursales (histórico)
        locationAll: (state) => state.db_location_all.data || [],
    }
});