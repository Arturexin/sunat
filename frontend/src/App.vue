<script setup>
import NavBar from './components/NavBar.vue';


</script>

<template>
  <div class="cuerpo">
    <div class="content">
        <nav-bar />
    </div>
    <div class="content" style="min-height: 83vh;">
          <RouterView />
    </div>
  </div>
</template>

<style scoped>

</style>
