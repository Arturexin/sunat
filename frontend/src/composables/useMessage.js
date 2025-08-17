import { ref } from 'vue';

export function useMessage(defaultTitle = 'Registrar nuevo colaborador') {
    const tit_ = ref(defaultTitle);
    const modal_message = ref({
        showModal: false,
        msj: '',
        type: ''
    });

    function modalMessage(showModal, msj, type) {
        modal_message.value.showModal = showModal;
        modal_message.value.msj = msj;
        modal_message.value.type = type;
    }

    function restablecer(campos, resetFormFn) {
        if (typeof resetFormFn === 'function') {
            resetFormFn(campos);
        }
        tit_.value = defaultTitle;
    }

    return {
        tit_,
        modal_message,
        modalMessage,
        restablecer
    };
}