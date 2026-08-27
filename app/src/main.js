import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { persistPlugin } from './plugins/persist.js'
import { initErrorCapture } from './utils/errorLog.js'
import './style.css'

const app = createApp(App).use(createPinia().use(persistPlugin)).use(router)
initErrorCapture(app)
app.mount('#app')
