import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

// 导入全局组件
import SvgIcon from '@/components/SvgIcon.vue'
import AppLoading from '@/components/AppLoading.vue'

// 导入 Mock 服务（仅在开发环境中使用）
import mockService from './mock'

// 创建应用实例
const app = createApp(App)

// 使用 Pinia 状态管理
app.use(createPinia())

// 使用路由
app.use(router)

// 注册全局组件
app.component('SvgIcon', SvgIcon)
app.component('AppLoading', AppLoading)

// 开发环境下启动 Mock 服务
if (import.meta.env.DEV) {
  mockService.start()
}

// 挂载应用
app.mount('#app')