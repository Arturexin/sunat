<script setup>
    // import { defineEmits } from 'vue';


    const props = defineProps({
        show: { type: Boolean, default: false },
        message: { type: String, default: '' },
        type: { type: String, default: 'info' } // info, success, error, warning
    });

    const emit = defineEmits(['close']);

    function closeModal() {
        emit('close');
    }
</script>

<template>
    <div v-if="props.show" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content" :class="props.type">
          <span class="close-btn" @click="closeModal">&times;</span>
          <div class="modal-message">
              <slot>
              {{ props.message }}
              </slot>
          </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: var(--fondo-primario);
  border-radius: 8px;
  min-width: 300px;
  max-width: 90vw;
  padding: 24px 32px 18px 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  position: relative;
  animation: modal-in 0.2s;
}
@keyframes modal-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.close-btn {
  position: absolute;
  top: 10px; right: 16px;
  font-size: 1.5rem;
  color: var(--a-cuatro);
  cursor: pointer;
  text-shadow: 0 0 8px var(--color-primario);
  transition: color 0.2s;
}
.close-btn:hover {
  color: var(--c-cuatro);
}
.modal-message {
  font-size: 1.1rem;
  color: var(--color-primario);
  margin-top: 10px;
  text-align: center;
}
.info { border-top: 4px solid var(--c-tres); }
.success { border-top: 4px solid var(--c-dos); }
.error { border-top: 4px solid var(--c-cuatro); }
.warning { border-top: 4px solid var(--c-cinco); }
.in { border-top: 4px solid var(--c-uno); }
.out { border-top: 4px solid var(--c-seis); }
</style>