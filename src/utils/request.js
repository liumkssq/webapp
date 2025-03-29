import axios from 'axios'
import { showToast } from 'vant'
import router from '../router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求标记存储，用于取消请求
const pendingRequests = new Map()

// 生成请求标记
const generateRequestKey = (config) => {
  const { url, method, params, data } = config
  return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&')
}

// 添加请求标记
const addPendingRequest = (config) => {
  const requestKey = generateRequestKey(config)
  
  if (pendingRequests.has(requestKey)) {
    // 取消前一个相同请求
    const controller = pendingRequests.get(requestKey)
    controller.abort()
  }
  
  // 创建新的 AbortController
  const controller = new AbortController()
  config.signal = controller.signal
  pendingRequests.set(requestKey, controller)
  
  return config
}

// 移除请求标记
const removePendingRequest = (config) => {
  const requestKey = generateRequestKey(config)
  pendingRequests.delete(requestKey)
}

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    
    // 如果有token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 处理重复请求
    config = addPendingRequest(config)
    
    return config
  },
  error => {
    console.error('请求错误', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 移除请求标记
    removePendingRequest(response.config)
    
    const res = response.data
    
    // 如果接口返回的状态码不是200，认为请求出错
    if (res.code !== 200) {
      // 显示错误信息
      showToast(res.message || '请求失败')
      
      // 处理特定错误码
      if (res.code === 401) {
        // 清除token并跳转到登录页
        localStorage.removeItem('token')
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
    // 请求被取消，直接返回
    if (axios.isCancel(error)) {
      console.log('请求被取消:', error.message)
      return Promise.reject(new Error('请求已取消'))
    }
    
    // 移除请求标记
    if (error.config) {
      removePendingRequest(error.config)
    }
    
    console.error('响应错误', error)
    
    let message = '网络错误'
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '未授权，请登录'
          // 清除token并跳转到登录页
          localStorage.removeItem('token')
          router.push({
            path: '/login',
            query: { redirect: router.currentRoute.value.fullPath }
          })
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器错误'
          break
        default:
          message = `请求失败 (${error.response.status})`
      }
    } else if (error.request) {
      message = '服务器无响应'
    } else {
      message = error.message
    }
    
    // 显示错误信息
    showToast(message)
    
    return Promise.reject(error)
  }
)

// 封装GET请求
service.get = (url, params, config = {}) => {
  return service({
    url,
    method: 'get',
    params,
    ...config
  })
}

// 封装POST请求
service.post = (url, data, config = {}) => {
  return service({
    url,
    method: 'post',
    data,
    ...config
  })
}

// 封装PUT请求
service.put = (url, data, config = {}) => {
  return service({
    url,
    method: 'put',
    data,
    ...config
  })
}

// 封装DELETE请求
service.delete = (url, params, config = {}) => {
  return service({
    url,
    method: 'delete',
    params,
    ...config
  })
}

export default service