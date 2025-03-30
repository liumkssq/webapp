import Mock from 'mockjs'

/**
 * 获取URL中的参数
 * @param {string} url URL字符串
 * @returns {object} 参数对象
 */
export const getUrlParams = (url) => {
  const params = {}
  const queryString = url.split('?')[1]
  if (!queryString) return params
  
  const pairs = queryString.split('&')
  pairs.forEach(pair => {
    const [key, value] = pair.split('=')
    params[key] = decodeURIComponent(value || '')
  })
  
  return params
}

// 别名导出，兼容现有代码
export const getQueryParams = getUrlParams

// 解析请求体
export const getRequestBody = (options) => {
  try {
    return JSON.parse(options.body)
  } catch (error) {
    console.error('解析请求体失败:', error)
    return {}
  }
}

// 模拟网络延迟方法已迁移到 ./utils/mock-helpers.js 中
import { delay as mockDelay, setupMockDelay } from './utils/mock-helpers'

// 重新导出，保持向后兼容
export const delay = mockDelay

// 生成分页响应
export const paginationResponse = (list, page = 1, limit = 10, message = '获取成功') => {
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const pagedList = list.slice(startIndex, endIndex)
  
  return {
    code: 200,
    message,
    data: {
      total: list.length,
      page: parseInt(page),
      limit: parseInt(limit),
      list: pagedList
    }
  }
}

// 生成成功响应
export const successResponse = (data, message = '操作成功') => {
  return {
    code: 200,
    message,
    data
  }
}

// 生成错误响应
export const errorResponse = (message = '操作失败', code = 400) => {
  return {
    code,
    message,
    data: null
  }
}

// 生成未找到响应
export const notFoundResponse = (message = '资源不存在') => {
  return {
    code: 404,
    message,
    data: null
  }
}

// 生成未授权响应
export const unauthorizedResponse = (message = '未授权访问') => {
  return {
    code: 401,
    message,
    data: null
  }
}

// 生成禁止访问响应
export const forbiddenResponse = (message = '禁止访问') => {
  return {
    code: 403,
    message,
    data: null
  }
}

// 随机ID生成器
export const randomId = () => {
  return Math.floor(Math.random() * 1000000) + 1
}

// 随机时间戳生成器
export const randomTimestamp = (startDay = 30, endDay = 0) => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - startDay)
  end.setDate(end.getDate() - endDay)
  
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()
}

// 随机元素选择器
export const randomPick = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 使用从mock-helpers导入的delay函数，上面已重新导出

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {number} wait 等待时间
 * @returns {Function} 经过防抖处理的函数
 */
export function debounce(fn, wait) {
  let timer = null
  
  return function(...args) {
    if (timer) clearTimeout(timer)
    
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, wait)
  }
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {number} wait 间隔时间
 * @returns {Function} 经过节流处理的函数
 */
export function throttle(fn, wait) {
  let lastTime = 0
  
  return function(...args) {
    const now = Date.now()
    
    if (now - lastTime > wait) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 深度克隆对象
 * @param {object} obj 要克隆的对象
 * @returns {object} 克隆后的对象
 */
export function deepClone(obj) {
  if (obj === null) return null
  if (typeof obj !== 'object') return obj
  
  const clone = Array.isArray(obj) ? [] : {}
  
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key])
    }
  }
  
  return clone
}

/**
 * 随机生成指定范围内的整数
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {number} 随机整数
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 数组随机乱序
 * @param {Array} arr 需要乱序的数组
 * @returns {Array} 乱序后的新数组
 */
export function shuffleArray(arr) {
  const result = [...arr]
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  
  return result
}

/**
 * 生成伪造的延迟响应
 * @param {any} data 要返回的数据
 * @param {number} minDelay 最小延迟时间(ms)
 * @param {number} maxDelay 最大延迟时间(ms)
 * @returns {Promise} 返回延迟后的数据Promise
 */
export function mockDelayResponse(data, minDelay = 300, maxDelay = 1500) {
  const delayTime = randomInt(minDelay, maxDelay)
  return delay(delayTime).then(() => data)
}