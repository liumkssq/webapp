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
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    
    // 打印请求信息
    const method = config.method.toUpperCase()
    console.log(`[请求] ${method} ${config.url}`, 
                method === 'GET' ? config.params : config.data)
    
    // 处理重复请求
    config = addPendingRequest(config)
    
    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('[请求错误]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    const res = response.data
    console.log(`[响应] ${response.config.url}`, res)
    
    // 检查自定义错误码
    if (res.code && res.code !== 200 && res.code !== 0) {
      // 处理各种错误码
      if (res.code === 401) {
        // 登录超时，需要重新登录
        console.warn('登录已过期，请重新登录', res)
        
        // 清除token
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        
        // 跳转到登录页面
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search)
        }
      } else if (res.code === 403) {
        // 权限不足
        console.warn('权限不足，无法访问', res)
        // 可以跳转到错误页面或提示用户
      } else if (res.code === 404) {
        // 资源不存在
        console.warn('请求的资源不存在', res)
      } else if (res.code === 500) {
        // 服务器内部错误
        console.error('服务器内部错误', res)
      } else {
        // 其他错误
        console.warn('请求返回错误', res)
      }
      
      // 直接返回响应数据，让业务代码处理
      return res
    }
    
    // 返回正常响应数据
    return res
  },
  error => {
    // 对响应错误做点什么
    console.error('[响应错误]', error)
    
    if (error.response) {
      console.log('[响应状态码]', error.response.status)
      console.log('[响应数据]', error.response.data)
      
      // 服务器返回了错误状态码
      if (error.response.status === 401) {
        // 登录超时，需要重新登录
        console.warn('登录已过期，请重新登录')
        
        // 清除token
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        
        // 跳转到登录页面
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search)
        }
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('未收到响应：', error.request)
    } else {
      // 发送请求时出现错误
      console.error('请求设置错误：', error.message)
    }
    
    // 返回统一的错误格式
    return {
      code: error.response?.status || 500,
      message: error.message || '请求失败',
      error: true
    }
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