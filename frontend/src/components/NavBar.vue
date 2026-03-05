<script setup>
    import { computed } from 'vue';
    import { useRouter } from 'vue-router';
    import { sendData } from '../../src/services/crud.js';
    import { useDB } from '../../src/stores/dataBases.js';

    const dbStore = useDB();
    const router = useRouter();

    const isLogged = computed(() => dbStore.isAuth?.state === true)
    async function logout(){
        try {
            const response = await sendData('logout');
            if (response.status === 'success') {
                console.log(response.message);
                // Limpia cualquier estado local si lo usas
                dbStore.clearDB();
                console.log('dbStore.isAuth después de logout', dbStore.isAuth);
                // localStorage.setItem('employees', JSON.stringify([]));
                // localStorage.setItem('location', JSON.stringify([]));
                // Redirige a login
                router.replace({ name: 'login' });
            } else {
                // Si el backend responde con error
                console.error(response.message || 'Error al cerrar sesión.');
                // Aquí podrías mostrar un mensaje al usuario si lo deseas
            }
        } catch (error) {
            // Error de red o inesperado
            console.error("Error durante el logout:", error.message || error);
            // Aquí podrías mostrar un mensaje al usuario si lo deseas
        }
    }
</script>

<template>
    <div class="navBar-into">
        <nav>
            <ul class="lista_">
                <li style="padding: 8px;"><h3 style="margin: 0;">Karpovick</h3></li>
                <template v-if="isLogged">

                    <li style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'home'}">Home</RouterLink></li>
                    <li style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'project'}">Proyecto</RouterLink></li>
                    <li style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'location'}">Localidades</RouterLink></li>
                    <li style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'employees'}">Colaboradores</RouterLink></li>
                    <li style="padding: 8px;"> 
                        <button @click="logout">Salir</button>
                    </li>
                </template>
            </ul>
        </nav>
        <!-- <nav>
            <ul class="lista_">
                <li v-if="!dbStore.isAuth.state" style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'login'}">Iniciar sesión</RouterLink></li>
                <li v-if="!dbStore.isAuth.state" style="padding: 8px;" class="plus"><RouterLink class="enlace" :to="{name: 'register'}">Registrar</RouterLink></li>
                <li v-if="dbStore.isAuth.state" style="padding: 8px; font-weight:bold ;">{{ dbStore.isAuth.user.name }}</li>
                <li v-if="dbStore.isAuth.state" style="padding: 8px;"><button class="cerrar_sesion" @click="logout()">Cerrar sesión</button></li>
            </ul>
        </nav> -->
    </div>
</template>

<style scoped>


.lista_{
    display: flex; 
    align-items: center; 
    list-style: none; 
    margin: 5px;
}
.enlace{
    text-decoration: none;
    color: var(--color-primario);
    transition: color 0.3s ease-in-out, transform 0.3s ease-in-out;
}
.enlace:hover{
    color: var(--fondo-cuaternario);
    transform: translateY(2px);
}
.enlace:active {
	position:relative;
	top:1px;
}
/* .plus {
    border: 2px solid #61aeff;
} */
.navBar-into{
    display: flex;
    justify-content: space-between;
    background: var(--fondo-primario);
}
.cerrar_sesion {
    padding: 5px 10px;
    background: none;
    color: #eee;
    border: none;
    cursor: pointer;
    text-shadow: 0 0 8px var(--c-cuatro);
    transition: background 0.3s ease-in-out, transform 0.3s ease-in-out;
}
.cerrar_sesion:hover{
    background: var(--c-cuatro);
    /* color: var(--fondo-cuaternario); */
}
.cerrar_sesion:active {
	position:relative;
	top:1px;
}


.enlace.router-link-exact-active {
    border-bottom: 2px solid var(--fondo-cuaternario);
    text-shadow: 0px 0px 8px var(--fondo-cuaternario);
    padding: 4px;
}

/* li:active, li:focus-within {
    border: 2px solid #61aeff;
    border-radius: 4px;
} */
</style>