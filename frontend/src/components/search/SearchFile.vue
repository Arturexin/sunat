<script setup>
    import { ref } from 'vue';
    import { useDB } from '../../stores/dataBases';


    const dbStore = useDB();


    const input_radio = ref(0);

    function xlsxHandleFile(event) {
        const file = event.target.files[0]
        if (file && file.name.endsWith('.xlsx')) {
            dbStore.files.xlsx = file
            dbStore.btnDisabled(0, false)
            document.querySelector("#excel_file").value = ''
        } else {
            alert('Por favor selecciona un archivo .xlsx válido.')
        }
    }
    function pdfHandleFile(event) {
        const files = event.target.files;
        // Filtra solo archivos PDF válidos
        const pdfFiles = Array.from(files);
        if (pdfFiles.length > 0) {
            dbStore.files.pdf = pdfFiles; // Guarda todos los archivos PDF
            dbStore.btnDisabled(1, false);
            document.querySelector("#pdf_file").value = ''
        } else {
            alert('Por favor selecciona uno o más archivos .pdf válidos.');
        }
    }

</script>

<template>
    <div style="display: flex;align-items: center;gap: 20px; padding: 10px;margin: 10px; width: 600px;justify-items: center;">
        <div style="display: flex; gap: 20px;">
            <div style="display: flex; gap: 5px; background: var(--d-dos); padding: 5px; border-radius: 5px;width: 80px">
                <input type="radio" name="radio_archivo" id="radio_archivo_xlsx" v-model="input_radio" :value="0" selected>
                <label for="radio_archivo_xlsx">.XLSX</label>  
            </div>
            <div style="display: flex; gap: 5px; background: var(--d-dos); padding: 5px; border-radius: 5px;width: 80px">
                <input type="radio" name="radio_archivo" id="radio_archivo_pdf" v-model="input_radio" :value="1">
                <label for="radio_archivo_pdf">.PDF</label>
            </div>
        </div>
            <input 
                v-if="input_radio === 0" 
                class="file" 
                type="file" 
                accept=".xlsx" 
                @change="xlsxHandleFile" 
                id="excel_file"
            />

            <input 
                v-if="input_radio === 1" 
                class="file" 
                type="file" 
                multiple 
                accept="application/pdf" 
                @change="pdfHandleFile" 
                id="pdf_file" 
            />
        
    </div>
</template>

<style scoped>

</style>