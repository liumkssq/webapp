/**
 * 解析URL查询参数
 * @param {string} url - URL字符串
 * @returns {Object} 解析后的参数对象
 */
export function getQueryParams(url) {
  const search = url.split('?')[1]
  if (!search) return {}
  return JSON.parse(
    '{"' +
      decodeURIComponent(search)
        .replace(/"/g, '\\"')
        .replace(/&/g, '","')
        .replace(/=/g, '":"')
        .replace(/\+/g, ' ') +
      '"}'
  )
}

/**
 * 格式化时间
 * @param {Date|string|number} time - 时间对象或时间戳
 * @param {string} format - 格式化模板，默认'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 */
export function formatDate(time, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!time) return ''
  
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
      time = parseInt(time)
    }
    if (typeof time === 'number' && time.toString().length === 10) {
      time = time * 1000
    }
    date = new Date(time)
  }
  
  const formatObj = {
    YYYY: date.getFullYear(),
    MM: date.getMonth() + 1,
    DD: date.getDate(),
    HH: date.getHours(),
    mm: date.getMinutes(),
    ss: date.getSeconds(),
    A: date.getHours() < 12 ? 'AM' : 'PM'
  }
  
  return format.replace(/(YYYY|MM|DD|HH|mm|ss|A)/g, (match) => {
    const value = formatObj[match]
    // 补零处理
    if (match === 'YYYY') {
      return value.toString()
    }
    return value < 10 ? '0' + value : value.toString()
  })
}

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间，默认500ms
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 500) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} delay - 延迟时间，默认1000ms
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, delay = 1000) {
  let lastTime = 0
  return function(...args) {
    const nowTime = Date.now()
    if (nowTime - lastTime > delay) {
      fn.apply(this, args)
      lastTime = nowTime
    }
  }
}

/**
 * 深拷贝对象
 * @param {Object} obj - 需要拷贝的对象
 * @returns {Object} 拷贝后的新对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  
  const copy = Array.isArray(obj) ? [] : {}
  
  Object.keys(obj).forEach(key => {
    copy[key] = deepClone(obj[key])
  })
  
  return copy
}

/**
 * 格式化文件大小
 * @param {number} size - 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(size) {
  if (size === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(size) / Math.log(k))
  
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 生成随机ID
 * @param {number} length - ID长度，默认16
 * @returns {string} 随机ID
 */
export function generateRandomId(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}