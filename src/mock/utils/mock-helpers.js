import Mock from 'mockjs'

/**
 * 延迟函数 - 可用于模拟网络延迟
 * @param {number} ms 延迟的毫秒数
 * @returns {Promise} Promise对象
 */
export const delay = (ms = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 配置Mock.js的全局延迟
 * @param {number} ms 毫秒数
 */
export const setupMockDelay = (ms = 200) => {
  if (typeof Mock.setup === 'function') {
    Mock.setup({ timeout: ms })
  }
}

/**
 * 生成随机ID
 * @returns {string} 随机ID
 */
export const generateId = () => Math.floor(Math.random() * 1000000).toString()

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

/**
 * 解析请求体
 * @param {object} options 请求选项
 * @returns {object} 解析后的请求体
 */
export const getRequestBody = (options) => {
  try {
    return JSON.parse(options.body)
  } catch (error) {
    console.error('解析请求体失败:', error)
    return {}
  }
}

/**
 * 生成分页响应
 * @param {Array} list 数据列表
 * @param {number} page 页码
 * @param {number} limit 每页数量
 * @param {string} message 成功消息
 * @returns {object} 分页响应对象
 */
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

/**
 * 生成成功响应
 * @param {any} data 响应数据
 * @param {string} message 成功消息
 * @returns {object} 成功响应对象
 */
export const successResponse = (data, message = '操作成功') => {
  return {
    code: 200,
    message,
    data
  }
}

/**
 * 生成错误响应
 * @param {string} message 错误消息
 * @param {number} code 错误码
 * @returns {object} 错误响应对象
 */
export const errorResponse = (message = '操作失败', code = 400) => {
  return {
    code,
    message,
    data: null
  }
}