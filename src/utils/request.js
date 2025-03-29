import axios from 'axios'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 15000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    
    // 如果有token则添加到请求头
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 如果返回的状态码不是200，说明接口请求有误
    if (res.code !== 200) {
      const messageStore = useMessageStore()
      
      // 根据错误码处理不同的错误情况
      if (res.code === 401) {
        // 未授权，需要重新登录
        const userStore = useUserStore()
        userStore.clearUser()
        
        messageStore.showMessage({
          type: 'error',
          content: res.message || '登录已过期，请重新登录',
          duration: 5000
        })
        
        // 跳转到登录页
        window.location.href = '/login'
      } else if (res.code === 403) {
        // 权限不足
        messageStore.showMessage({
          type: 'error',
          content: res.message || '权限不足，无法执行此操作',
          duration: 5000
        })
      } else if (res.code === 404) {
        // 资源不存在
        messageStore.showMessage({
          type: 'error',
          content: res.message || '请求的资源不存在',
          duration: 5000
        })
      } else {
        // 其他错误
        messageStore.showMessage({
          type: 'error',
          content: res.message || '请求失败',
          duration: 5000
        })
      }
      
      // 返回接口返回的错误信息
      return res
    } else {
      // 正常返回数据
      return res
    }
  },
  error => {
    let message = '连接服务器失败'
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 清除用户状态并跳转到登录页
          const userStore = useUserStore()
          userStore.clearUser()
          window.location.href = '/login'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 408:
          message = '请求超时'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 501:
          message = '服务未实现'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        case 505:
          message = 'HTTP版本不受支持'
          break
        default:
          message = `连接错误${error.response.status}`
      }
    } else if (error.message.includes('timeout')) {
      message = '请求超时'
    }
    
    // 显示错误信息
    const messageStore = useMessageStore()
    messageStore.showMessage({
      type: 'error',
      content: message,
      duration: 5000
    })
    
    console.error('响应错误:', error)
    return Promise.reject(error)
  }
)

export default service