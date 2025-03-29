import axios from 'axios'
import { useUserStore } from '../store/user'
import { useAppStore } from '../store/app'
import router from '../router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    const appStore = useAppStore()
    
    // 开始请求时显示加载状态
    appStore.setLoading(true)
    
    // 如果有token，添加到请求头
    const token = userStore.token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    const appStore = useAppStore()
    appStore.setLoading(false)
    appStore.setError('请求发送失败')
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const appStore = useAppStore()
    appStore.setLoading(false)
    
    // 处理响应数据
    const res = response.data
    
    // 如果返回码不是200，则视为错误
    if (res.code !== 200) {
      appStore.setError(res.message || '请求失败')
      
      // 处理特定错误码
      if (res.code === 401) {
        // 未授权，清除用户信息并跳转到登录页
        const userStore = useUserStore()
        userStore.clearUser()
        router.push({
          path: '/login',
          query: { redirect: router.currentRoute.value.fullPath }
        })
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res
  },
  error => {
    const appStore = useAppStore()
    appStore.setLoading(false)
    
    // 根据错误情况设置错误信息
    if (error.response) {
      // 有响应但状态码不正确
      const status = error.response.status
      
      if (status === 401) {
        // 未授权，清除用户信息并跳转到登录页
        const userStore = useUserStore()
        userStore.clearUser()
        router.push({
          path: '/login',
          query: { redirect: router.currentRoute.value.fullPath }
        })
        appStore.setError('登录已过期，请重新登录')
      } else if (status === 403) {
        appStore.setError('没有权限执行此操作')
      } else if (status === 404) {
        appStore.setError('请求的资源不存在')
      } else if (status === 500) {
        appStore.setError('服务器内部错误')
      } else {
        appStore.setError(`请求失败(${status})`)
      }
    } else if (error.request) {
      // 发送了请求但没有收到响应
      appStore.setError('服务器无响应，请检查网络连接')
    } else {
      // 请求配置有误
      appStore.setError('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 请求方法封装
const request = {
  get(url, params, config = {}) {
    return service.get(url, { params, ...config })
  },
  
  post(url, data, config = {}) {
    return service.post(url, data, config)
  },
  
  put(url, data, config = {}) {
    return service.put(url, data, config)
  },
  
  delete(url, params, config = {}) {
    return service.delete(url, { params, ...config })
  },
  
  // 上传文件
  upload(url, file, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)
    
    return service.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
        ? e => {
            const progress = Math.round((e.loaded * 100) / e.total)
            onProgress(progress)
          }
        : null
    })
  }
}

export default request