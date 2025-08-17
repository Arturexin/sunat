<script setup>
import { defineEmits } from 'vue';

const props = defineProps({
  show: Boolean,
  title: String,
  message: String,
  confirmText: String,
  cancelText: String
});
const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <div v-if="props.show" class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-content">
      <button class="close-btn" @click="emit('cancel')" aria-label="Cerrar">&times;</button>
      <h2 class="modal-title">{{ props.title }}</h2>
      <div class="modal-message">{{ props.message }}</div>
      <div class="modal-actions">
        <button class="btn-cancel" @click="emit('cancel')">{{ props.cancelText }}</button>
        <button class="btn-confirm" @click="emit('confirm')">{{ props.confirmText }}</button>
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
  min-width: 320px;
  max-width: 90vw;
  padding: 28px 36px 22px 36px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  position: relative;
  animation: modal-in 0.2s;
  text-align: center;
  width: 400px;
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
.modal-title {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: var(--color-secundario);
}
.modal-message {
  font-size: 15px;
  color: var(--color-primario);
  margin-bottom: 18px;
}
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.btn-cancel {
  background: var(--a-cuatro);
  color: var(--color-primario);
  border: none;
  padding: 8px 18px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.btn-cancel:hover {
  background: var(--c-cuatro);
}
.btn-confirm {
  background: var(--a-dos);
  color: var(--color-primario);
  border: none;
  padding: 8px 18px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.btn-confirm:hover {
  background: var(--c-dos);
}

</style>