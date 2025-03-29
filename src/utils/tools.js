/**
 * 通用工具函数集合
 */

/**
 * 防抖函数
 * @param {Function} fn 需要防抖的函数
 * @param {Number} delay 延迟时间（毫秒）
 * @return {Function} 防抖处理后的函数
 */
export const debounce = (fn, delay = 300) => {
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
 * @param {Function} fn 需要节流的函数
 * @param {Number} delay 延迟时间（毫秒）
 * @return {Function} 节流处理后的函数
 */
export const throttle = (fn, delay = 300) => {
  let last = 0
  return function(...args) {
    const now = Date.now()
    if (now - last > delay) {
      last = now
      fn.apply(this, args)
    }
  }
}

/**
 * 格式化日期
 * @param {Date|String|Number} date 日期对象、日期字符串或时间戳
 * @param {String} format 格式化模板，如：'YYYY-MM-DD HH:mm:ss'
 * @return {String} 格式化后的日期字符串
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const padZero = (num) => num.toString().padStart(2, '0')
  
  const map = {
    YYYY: d.getFullYear(),
    MM: padZero(d.getMonth() + 1),
    DD: padZero(d.getDate()),
    HH: padZero(d.getHours()),
    mm: padZero(d.getMinutes()),
    ss: padZero(d.getSeconds())
  }
  
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match])
}

/**
 * 格式化相对时间（如：刚刚、5分钟前、1小时前、昨天等）
 * @param {Date|String|Number} date 日期对象、日期字符串或时间戳
 * @return {String} 格式化后的相对时间字符串
 */
export const formatRelativeTime = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const diffInSeconds = Math.floor(diff / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`
  } else if (diffInDays === 1) {
    return '昨天'
  } else if (diffInDays === 2) {
    return '前天'
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`
  } else if (d.getFullYear() === now.getFullYear()) {
    return formatDate(date, 'MM-DD')
  } else {
    return formatDate(date, 'YYYY-MM-DD')
  }
}

/**
 * 数字格式化（如：1000 → 1k, 1500 → 1.5k）
 * @param {Number} num 数字
 * @param {Number} digits 小数位数
 * @return {String} 格式化后的数字字符串
 */
export const formatNumber = (num, digits = 1) => {
  if (isNaN(num) || num === null) return '0'
  
  if (num < 1000) return num.toString()
  
  if (num < 10000) {
    return (num / 1000).toFixed(digits).replace(/\.0$/, '') + 'k'
  }
  
  if (num < 1000000) {
    return (num / 10000).toFixed(digits).replace(/\.0$/, '') + 'w'
  }
  
  return (num / 1000000).toFixed(digits).replace(/\.0$/, '') + 'm'
}

/**
 * 深拷贝对象
 * @param {Object} obj 需要拷贝的对象
 * @return {Object} 拷贝后的新对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj)
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (obj instanceof Object) {
    const copy = {}
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key])
    })
    return copy
  }
  
  return obj
}

/**
 * 获取URL参数
 * @param {String} name 参数名
 * @param {String} url URL字符串，默认为当前页面URL
 * @return {String|null} 参数值
 */
export const getUrlParam = (name, url = window.location.href) => {
  name = name.replace(/[[\]]/g, '\\$&')
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

/**
 * 生成随机字符串
 * @param {Number} length 字符串长度
 * @return {String} 随机字符串
 */
export const randomString = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 将对象序列化为URL查询字符串
 * @param {Object} obj 需要序列化的对象
 * @return {String} URL查询字符串（不带?前缀）
 */
export const objectToQueryString = (obj) => {
  if (!obj) return ''
  
  return Object.keys(obj)
    .filter(key => obj[key] != null && obj[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&')
}

/**
 * 简单的文本内容截断函数
 * @param {String} text 文本内容
 * @param {Number} length 最大长度
 * @param {String} suffix 截断后的后缀，默认为'...'
 * @return {String} 截断后的文本
 */
export const truncateText = (text, length = 100, suffix = '...') => {
  if (!text) return ''
  
  if (text.length <= length) return text
  
  return text.substring(0, length) + suffix
}

/**
 * 判断是否是移动设备
 * @return {Boolean} 是否是移动设备
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 判断是否为iPhone设备
 * @return {Boolean} 是否是iPhone设备
 */
export const isIphone = () => {
  return /iPhone/i.test(navigator.userAgent)
}

/**
 * 判断是否为iPad设备
 * @return {Boolean} 是否是iPad设备
 */
export const isIpad = () => {
  return /iPad/i.test(navigator.userAgent)
}

/**
 * 判断是否为iOS设备
 * @return {Boolean} 是否是iOS设备
 */
export const isIos = () => {
  return isIphone() || isIpad()
}

/**
 * 判断是否为Android设备
 * @return {Boolean} 是否是Android设备
 */
export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent)
}

/**
 * 获取浏览器信息
 * @return {Object} 浏览器信息对象
 */
export const getBrowser = () => {
  const ua = navigator.userAgent.toLowerCase()
  
  const match = 
    /(chrome)[ \/]([\w.]+)/.exec(ua) ||
    /(firefox)[ \/]([\w.]+)/.exec(ua) ||
    /(safari)[ \/]([\w.]+)/.exec(ua) ||
    /(opera)[ \/]([\w.]+)/.exec(ua) ||
    /(msie) ([\w.]+)/.exec(ua) ||
    /(trident).+rv:(\w.)+/.exec(ua) ||
    ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
    []
  
  if (match[1] === 'trident') {
    return { name: 'ie', version: '11' }
  }
  
  return {
    name: match[1] || '',
    version: match[2] || '0'
  }
}