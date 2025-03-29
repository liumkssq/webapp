/**
 * 从URL中获取查询参数
 * @param {string} url URL字符串
 * @returns {object} 查询参数对象
 */
export const getUrlParam = (url) => {
  const params = {}
  const questionMarkIndex = url.indexOf('?')
  
  if (questionMarkIndex !== -1) {
    const queryString = url.slice(questionMarkIndex + 1)
    const parts = queryString.split('&')
    
    parts.forEach(part => {
      const [key, value] = part.split('=')
      params[key] = decodeURIComponent(value || '')
    })
  }
  
  return params
}

/**
 * 构建带查询参数的URL
 * @param {string} baseUrl 基础URL
 * @param {object} params 参数对象
 * @returns {string} 完整URL
 */
export const buildUrlWithParams = (baseUrl, params) => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl
  }
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * 获取路由中的ID参数
 * @param {string} url URL字符串
 * @param {string} pattern 匹配模式，例如 /article/(\\w+)
 * @returns {string|null} ID参数
 */
export const getIdFromUrl = (url, pattern) => {
  const regex = new RegExp(pattern)
  const match = url.match(regex)
  return match ? match[1] : null
}