import request from '@/utils/request'

/**
 * 全局搜索
 * @param {Object} params 搜索参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.type 搜索类型，可选：all, product, article, lostfound, user
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function globalSearch(params) {
  return request({
    url: '/api/search',
    method: 'get',
    params
  })
}

/**
 * 搜索商品
 * @param {Object} params 搜索参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.category 分类
 * @param {string} params.sort 排序方式
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function searchProducts(params) {
  const searchParams = { ...params, type: 'product' }
  return request({
    url: '/api/search',
    method: 'get',
    params: searchParams
  })
}

/**
 * 搜索文章
 * @param {Object} params 搜索参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.category 分类
 * @param {string} params.sort 排序方式
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function searchArticles(params) {
  const searchParams = { ...params, type: 'article' }
  return request({
    url: '/api/search',
    method: 'get',
    params: searchParams
  })
}

/**
 * 搜索失物招领
 * @param {Object} params 搜索参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.type 失物招领子类型：lost, found
 * @param {string} params.sort 排序方式
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function searchLostFound(params) {
  // 原来的 type 参数是 lost 或 found，改名为 subtype
  const { type: subtype, ...otherParams } = params
  const searchParams = { 
    ...otherParams, 
    type: 'lostfound',
    // 如果有子类型，保留为 subtype 参数
    ...(subtype ? { subtype } : {})
  }
  
  return request({
    url: '/api/search',
    method: 'get',
    params: searchParams
  })
}

/**
 * 搜索用户
 * @param {Object} params 搜索参数
 * @param {string} params.keyword 搜索关键词
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function searchUsers(params) {
  const searchParams = { ...params, type: 'user' }
  return request({
    url: '/api/search',
    method: 'get',
    params: searchParams
  })
}

/**
 * 获取搜索历史
 * @returns {Promise} Promise对象
 */
export function getSearchHistory() {
  return request({
    url: '/api/search/history',
    method: 'get'
  })
}

/**
 * 清除搜索历史
 * @returns {Promise} Promise对象
 */
export function clearSearchHistory() {
  return request({
    url: '/api/search/history',
    method: 'delete'
  })
}

/**
 * 获取热门搜索关键词
 * @returns {Promise} Promise对象
 */
export function getHotSearchKeywords() {
  return request({
    url: '/api/search/hot-keywords',
    method: 'get'
  })
} 