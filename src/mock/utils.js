/**
 * 获取URL中的参数
 * @param {string} url URL字符串
 * @returns {object} 参数对象
 */
export function getUrlParams(url) {
  const params = {}
  if (!url || url.indexOf('?') === -1) return params
  
  const queryString = url.split('?')[1]
  const pairs = queryString.split('&')
  
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=')
    const key = decodeURIComponent(pair[0])
    const value = pair.length > 1 ? decodeURIComponent(pair[1]) : ''
    
    // 处理数组参数
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2)
      if (!params[arrayKey]) {
        params[arrayKey] = []
      }
      params[arrayKey].push(value)
    } else {
      params[key] = value
    }
  }
  
  return params
}

// 添加别名以兼容现有代码
export const getQueryParams = getUrlParams

/**
 * 延迟函数
 * @param {number} ms 延迟的毫秒数
 * @returns {Promise} Promise对象
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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