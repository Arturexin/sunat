<script setup>
    import { ref } from 'vue';
    import { useRouter } from 'vue-router'
    import { sendData } from '../services/crud.js';
    import { validation, validateRow, resetForm } from '../services/validate.js';
    import { useDB } from '../stores/dataBases.js';

    const dbStore = useDB();
    const router = useRouter();
    const title = ref('Iniciar sesión.')
    const key = ref(true);
    const intro = ref({
        USER: '',
        PASSWORD: ''
    });
    const register = ref({
        NAME: '',
        LAST_NAME: '',
        EMAIL: '',
        USER: '',
        GENERO: '',
        DATE_BIRTH: '',
        PASSWORD: '',
    });
    const password_ = ref('')
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
    async function initLogin () {
        let row = buildRow(intro);
        
        if (!validateRow(row)) return;
        let ruta = 'login'
        try {
            const response = await sendData(ruta, row);
            if (response.status === 'success') {

                dbStore.isAuthLogin(response.payload);
                console.log('dbStore.isAuth', dbStore.isAuth);
                resetForm();

                // loading.value = true;
                router.push({ name: 'home' });
            // } else if(response.status === 'error'){
            //     modalMessage(true, `${response.message}`, 'error')
            }
        } catch (error) {
            // modalMessage(true, `No se puede iniciar sesión`, 'error');
            console.log(error);
        }
    }
    async function registerOn () {
        key.value = false
    }
    async function loginOn () {
        key.value = true
    }
    async function initRegister () {
        let row = buildRow(register);
        console.log('row', row);
        const ruta = 'createNatural'
        try {
            const response = await sendData(ruta, row);
            console.log('respuesta',response);
            if (response.status === 'success') {
                key.value = true
            }
        } catch (error) {
            console.log(error);
        }
    }
</script>

<template>
    <div class="container_home">
        <div style="display: grid;justify-items: center;">
            <h2 v-if="key" style="text-align: center;">Iniciar sesión</h2>
            <h2 v-if="!key"style="text-align: center;">Registrar cuenta</h2>

            <form action="" class="formulario-principal">
                <div v-if="key" style="display: grid">
                    <label for="username">Usiario</label>
                    <input type="text" name="username" v-model="intro.USER">
                    <label for="password">Contraseña</label>
                    <input type="text" name="password" v-model="intro.PASSWORD">
                </div>
                <div v-if="!key" style="display: grid">
                    <label for="name">Nombres</label>
                    <input type="text" name="name" v-model="register.NAME">
                    <label for="last_name">Apellidos</label>
                    <input type="text" name="last_name" v-model="register.LAST_NAME">
                    <label for="email">Email</label>
                    <input type="text" name="email" v-model="register.EMAIL">
                    <label for="username">Usuario</label>
                    <input type="text" name="username" v-model="register.USER">
                    <label for="genero">Género</label>
                    <select v-model="register.GENERO">
                        <option value="" disabled>Seleccione género</option>
                        <option value="0">Femenino</option>
                        <option value="1">Masculino</option>
                    </select>
                    <label for="nacimiento">Fecha de nacimiento</label>
                    <input type="date" name="nacimiento" v-model="register.DATE_BIRTH">
                    <label for="password1">Contraseña</label>
                    <input type="text" name="password" v-model="register.PASSWORD">
                    <label for="password_">Repita la contraseña</label>
                    <input type="text" name="password_" v-model="password_">
                </div>
                
                <div style="display: flex;justify-content: space-between;" v-if="key">
                    <button class="btn-in" style="width: 130px;" @click.prevent="initLogin">Ingresar</button>
                    <button class="btn-out" style="width: 130px;" @click.prevent="registerOn">Registrar cuenta</button>
                </div>
                <div style="display: flex;justify-content: space-between;" v-if="!key">
                    <button class="btn-edit" style="width: 130px;" @click.prevent="initRegister">Registrar</button>
                    <button class="btn-out" style="width: 130px;" @click.prevent="loginOn">Iniciar sesión</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>

</style>