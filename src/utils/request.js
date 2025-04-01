import axios from 'axios'
import { getToken, removeToken } from './auth'
import { showToast } from 'vant'
import { formatRedirectPath } from '@/utils/redirect'

// 创建axios实例
const service = axios.create({
  baseURL: '', // 不使用全局baseURL，由各API函数控制完整路径
  timeout: 10000, // 请求超时时间
  withCredentials: true, // 跨域请求时发送cookie
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
    // 设置token
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // URL处理策略：
    // 1. 如果URL是完整的http/https URL，不使用baseURL
    // 2. 如果URL不是以'/'开头，添加'/'
    if (config.url.startsWith('http://') || config.url.startsWith('https://')) {
      config.baseURL = ''
    } else if (!config.url.startsWith('/')) {
      config.url = '/' + config.url
    }
    
    // 调试信息
    const fullUrl = config.baseURL 
      ? (config.baseURL + (config.url.startsWith('/') ? config.url : '/' + config.url))
      : config.url
    
    console.log(`发起${config.method.toUpperCase()}请求: ${fullUrl}`, 
      config.params || config.data || {})
    
    // 处理重复请求
    config = addPendingRequest(config)
    
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
    // 移除请求标记
    removePendingRequest(response.config)
    
    const res = response.data
    
    // 处理不同格式的成功响应
    // 1. 如果响应是数组，包装为标准格式
    if (Array.isArray(res)) {
      return {
        code: 200,
        message: '操作成功',
        data: res
      }
    }
    
    // 2. 如果响应是对象但没有标准code/status字段
    if (typeof res === 'object' && res !== null && res.code === undefined && res.status === undefined) {
      return {
        code: 200,
        message: '操作成功',
        data: res
      }
    }
    
    // 3. 标准响应处理
    if (res.code === 200 || res.status === 200 || res.success === true) {
      return res
    }

    // 处理错误响应
    let errorMessage = res.message || '请求失败'
    showToast({
      message: errorMessage,
      type: 'fail',
      duration: 3000
    })

    // 特殊处理401未授权
    if (res.code === 401 || res.status === 401) {
      console.warn('检测到401未授权状态，清除token')
      removeToken()
      
      // 避免在登录页面触发重定向
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        setTimeout(() => {
          console.log('重定向到登录页面')
          // 使用工具函数处理重定向参数，避免双问号问题
          const redirectParam = formatRedirectPath(currentPath);
          console.log('重定向参数:', redirectParam);
          window.location.href = `/login?redirect=${redirectParam}`;
        }, 1500)
      }
    }
    
    return Promise.reject(new Error(errorMessage))
  },
  error => {
    // 移除请求标记
    if (error.config) {
      removePendingRequest(error.config)
    }
    
    console.error('响应错误:', error)
    
    // 处理网络错误或服务器错误
    let message = '请求失败'
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          removeToken()
          // 避免在登录页面触发重定向
          if (!window.location.pathname.includes('/login')) {
            setTimeout(() => {
              window.location.href = '/login'
            }, 1500)
          }
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败(${error.response.status})`
      }
      
      // 如果响应中包含详细错误信息
      if (error.response.data && error.response.data.message) {
        message = error.response.data.message
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message = '服务器无响应'
    } else {
      // 请求设置有问题
      message = '请求配置错误'
    }
    
    showToast({
      message,
      type: 'fail',
      duration: 3000
    })
    
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