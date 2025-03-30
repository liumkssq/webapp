import request from '@/utils/request'

/**
 * 获取商品列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @param {string} params.category 商品分类
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.sort 排序方式
 * @returns {Promise} Promise对象
 */
export function getProductList(params) {
  return request({
    url: '/api/product/list',
    method: 'get',
    params
  })
}

/**
 * 获取商品详情
 * @param {number|string} id 商品ID
 * @returns {Promise} Promise对象
 */
export function getProductDetail(id) {
  return request({
    url: `/api/product/detail/${id}`,
    method: 'get'
  })
}

/**
 * 获取商品分类
 * @returns {Promise} Promise对象
 */
export function getProductCategories() {
  return request({
    url: '/api/product/categories',
    method: 'get'
  })
}

/**
 * 发布新商品
 * @param {Object} data 商品信息
 * @returns {Promise} Promise对象
 */
export function publishProduct(data) {
  return request({
    url: '/api/product/publish',
    method: 'post',
    data
  })
}

/**
 * 更新商品信息
 * @param {number|string} id 商品ID
 * @param {Object} data 商品信息
 * @returns {Promise} Promise对象
 */
export function updateProduct(id, data) {
  return request({
    url: `/api/product/update/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除商品
 * @param {number|string} id 商品ID
 * @returns {Promise} Promise对象
 */
export function deleteProduct(id) {
  return request({
    url: `/api/product/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 获取用户发布的商品列表
 * @param {number|string} userId 用户ID
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getUserProducts(userId, params) {
  return request({
    url: `/api/product/user/${userId}`,
    method: 'get',
    params
  })
}

/**
 * 收藏/取消收藏商品
 * @param {number|string} id 商品ID
 * @param {boolean} favorite 是否收藏
 * @returns {Promise} Promise对象
 */
export function favoriteProduct(id, favorite) {
  return request({
    url: `/api/product/favorite/${id}`,
    method: 'post',
    data: { favorite }
  })
}

/**
 * 获取收藏的商品列表
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getFavoriteProducts(params) {
  return request({
    url: '/api/product/favorites',
    method: 'get',
    params
  })
}

/**
 * 商品举报
 * @param {number|string} id 商品ID
 * @param {Object} data 举报信息
 * @returns {Promise} Promise对象
 */
export function reportProduct(id, data) {
  return request({
    url: `/api/product/report/${id}`,
    method: 'post',
    data
  })
}