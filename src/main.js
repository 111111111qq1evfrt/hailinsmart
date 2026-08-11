import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
import './styles/element-plus.scss'
import './styles/utils.css'
import './styles/components.css'
import './styles/responsive.css'

const app = createApp(App)
app.use(router)

app.mount('#app')