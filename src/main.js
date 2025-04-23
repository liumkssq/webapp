import { createPinia } from 'pinia'
import { showDialog, showNotify, showToast } from 'vant'
import 'vant/lib/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/main.css'
import router from './router'
import './styles/ios-gestures.css'
import './styles/transitions.css'
import './styles/vant-override.css'
import './utils/dayjs'
import { FALLBACK_IMAGES } from './utils/defaultImages'
import { setupVantConfig } from './utils/vant-config'
import { wsClient } from './utils/websocket'; // 导入WebSocket客户端

// 导入Vant UI
import Vant from 'vant'
import 'vant/lib/index.css'

// 导入全局组件
import AppLoading from '@/components/AppLoading.vue'
import SvgIcon from '@/components/SvgIcon.vue'

// 引入消息存储
import { useMessageStore } from './store/message'

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

// 挂载WebSocket客户端到全局
app.config.globalProperties.$ws = wsClient

// 全局错误处理器
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue全局错误:', err)
  console.error('错误信息:', info)
  
  // 检查是否为网络请求错误
  if (err.name === 'AxiosError') {
    console.warn('检测到网络请求错误')
    
    // 检查是否为token相关错误
    if (err.response?.status === 401) {
      console.warn('API认证失败，可能需要重新登录')
    }
  }
  
  // 向用户显示友好的错误提示
  const messageStore = useMessageStore()
  messageStore.showError('操作失败，请稍后重试')
}

// 挂载应用
app.mount('#app')