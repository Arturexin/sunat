import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'

import './styles/style.css'
import './styles/form.css'
import './styles/index.css'
import './styles/buttons.css'
import './styles/tables.css'
import App from './App.vue'

const pinia = createPinia();

createApp(App).use(pinia).use(router).mount('#app')
