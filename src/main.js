import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { showToast, showDialog, showNotify } from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

// 导入Vant UI
import Vant from 'vant'
import 'vant/lib/index.css'

// 导入全局组件
import SvgIcon from '@/components/SvgIcon.vue'
import AppLoading from '@/components/AppLoading.vue'

// 导入 Mock 服务（始终导入以确保开发时可用）
console.log('导入 Mock 服务')
import './mock'
import Toast from "@/components/common/Toast.vue";
import ToggleSwitch from "./components/common/ToggleSwitch.vue";
console.log('Mock 服务导入完成')

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 使用 Pinia 状态管理
app.use(pinia)

// 使用路由
app.use(router)

// 使用Vant UI
app.use(Vant)
app.use(Toast)
app.use(ToggleSwitch)

// 注册全局组件
app.component('SvgIcon', SvgIcon)
app.component('AppLoading', AppLoading)

// 全局挂载Vant组件
app.config.globalProperties.$toast = showToast
app.config.globalProperties.$dialog = showDialog
app.config.globalProperties.$notify = showNotify

// 挂载应用
app.mount('#app')