import { ref } from 'vue';

export function useConfirmation() {
    const showConfirm = ref(false);
    const confirmTitle = ref('');
    const confirmMessage = ref('');
    const confirmText = ref('Confirmar');
    const cancelText = ref('Cancelar');
    let actionFn = null;
    let payload = null;

    function openConfirm({ title, message, confirmLabel, cancelLabel, action, data }) {
        confirmTitle.value = title || '¿Estás seguro?';
        confirmMessage.value = message || '¿Deseas continuar?';
        confirmText.value = confirmLabel || 'Confirmar';
        cancelText.value = cancelLabel || 'Cancelar';
        actionFn = action;
        payload = data;
        showConfirm.value = true;
    }

    async function handleConfirm() {
        if (typeof actionFn === 'function') {
            await actionFn(payload);
        }
        closeConfirm();
    }

    function closeConfirm() {
        showConfirm.value = false;
        actionFn = null;
        payload = null;
    }

    return {
        showConfirm,
        confirmTitle,
        confirmMessage,
        confirmText,
        cancelText,
        openConfirm,
        handleConfirm,
        closeConfirm
    };
}