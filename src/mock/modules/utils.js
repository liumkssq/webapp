/**
 * 从URL中解析查询参数
 * @param {string} url 需要解析的URL
 * @returns {Object} 解析出的参数对象
 */
export function getUrlParams(url) {
  const params = {}
  const queryString = url.split('?')[1]
  
  if (!queryString) {
    return params
  }
  
  const pairs = queryString.split('&')
  
  pairs.forEach(pair => {
    const [key, value] = pair.split('=')
    params[key] = decodeURIComponent(value || '')
  })
  
  return params
}

/**
 * 生成随机ID
 * @returns {number} 随机ID
 */
export function generateId() {
  return Math.floor(Math.random() * 10000000)
}

/**
 * 延迟函数，模拟网络延迟
 * @param {number} ms 延迟毫秒数
 * @returns {Promise} Promise对象
 */
export function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 格式化日期时间
 * @param {Date|string} date 日期对象或日期字符串
 * @param {string} format 格式化模板
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'yyyy-MM-dd HH:mm:ss') {
  date = typeof date === 'string' ? new Date(date) : date
  
  const obj = {
    'y+': date.getFullYear(),
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'H+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  }
  
  for (const key in obj) {
    if (new RegExp(`(${key})`).test(format)) {
      const str = obj[key] + ''
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? str : str.padStart(2, '0')
      )
    }
  }
  
  return format
} 