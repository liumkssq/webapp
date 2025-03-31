import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { showToast, showDialog, showNotify } from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import './styles/transitions.css'
import './styles/vant-override.css'
import './styles/ios-gestures.css'
import { setupVantConfig } from './utils/vant-config'
import './utils/dayjs'
import { FALLBACK_IMAGES } from './utils/defaultImages'

// 导入Vant UI
import Vant from 'vant'
import 'vant/lib/index.css'

// 导入全局组件
import SvgIcon from '@/components/SvgIcon.vue'
import AppLoading from '@/components/AppLoading.vue'

// 检查并输出默认图片状态
console.log('使用备用网络图片确保UI显示:');
console.log('- 默认头像: ', FALLBACK_IMAGES.avatar);
console.log('- 默认背景: ', FALLBACK_IMAGES.background);
console.log('- 默认商品图: ', FALLBACK_IMAGES.product);
console.log('- 默认文章图: ', FALLBACK_IMAGES.article);

// 导入 Mock 服务（始终导入以确保开发时可用）
// console.log('导入 Mock 服务')
// import './mock'
// console.log('Mock 服务导入完成')

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 使用 Pinia 状态管理
app.use(pinia)

// 使用路由
app.use(router)

// 使用Vant UI
app.use(Vant)

// 配置Vant全局选项
setupVantConfig(app)

// 注册全局组件
app.component('SvgIcon', SvgIcon)
app.component('AppLoading', AppLoading)

// 全局挂载Vant组件
app.config.globalProperties.$toast = showToast
app.config.globalProperties.$dialog = showDialog
app.config.globalProperties.$notify = showNotify

// 挂载应用
app.mount('#app')