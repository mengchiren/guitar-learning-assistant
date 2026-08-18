import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { persistPlugin } from './plugins/persist.js'
import './style.css'

createApp(App).use(createPinia().use(persistPlugin)).use(router).mount('#app')
