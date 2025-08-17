<script setup>

</script>

<template>
    <div class="navBar-into">
        <nav>
            <ul class="lista_">
                <li style="padding: 8px;"><h3 style="margin: 0;">Karpovick</h3></li>
                <li style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'home'}">Home</RouterLink></li>
                <li style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'project'}">Proyecto</RouterLink></li>
                <li style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'location'}">Localidades</RouterLink></li>
                <li style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'area'}">Area</RouterLink></li>
                <li style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'employees'}">Colaboradores</RouterLink></li>
                <!-- <li v-if="!dbStore.isAuth.state" style="padding: 8px;"><RouterLink class="enlace" to="/">Home</RouterLink></li>
                <li v-if="dbStore.isAuth.state" style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'qr'}">QR</RouterLink></li>
                <li v-if="dbStore.isAuth.state" style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'dashboard'}">Dashboard</RouterLink></li>
                <li v-if="dbStore.isAuth.state" style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'asistencia'}">Asistencias</RouterLink></li>
                <li v-if="dbStore.isAuth.state" style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'colaborador'}">Colaboradores</RouterLink></li>
                <li v-if="dbStore.isAuth.state" style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'sucursal'}">Sucursales</RouterLink></li>
                <li v-if="dbStore.isAuth.state" style="padding: 8px;"><RouterLink class="enlace" :to="{name: 'planilla'}">Planilla</RouterLink></li> -->
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