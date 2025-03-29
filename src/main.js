import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/index.css'

// 导入mock数据，开发环境下使用
import './mock'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')