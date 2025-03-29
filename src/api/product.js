import request from '@/utils/request'

/**
 * 获取商品列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码，默认1
 * @param {number} params.size 每页数量，默认10
 * @param {string} params.category 商品分类
 * @param {string} params.sort 排序方式：priceLow-价格从低到高，priceHigh-价格从高到低，newest-最新，popularity-最热
 * @returns {Promise}
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
 * @param {string} id 商品ID
 * @returns {Promise}
 */
export function getProductDetail(id) {
  return request({
    url: `/api/product/${id}`,
    method: 'get'
  })
}

/**
 * 发布商品
 * @param {Object} data 商品信息
 * @param {string} data.title 商品标题
 * @param {string} data.description 商品描述
 * @param {number} data.price 商品价格
 * @param {number} data.originalPrice 原价
 * @param {string} data.condition 商品成色
 * @param {Array} data.images 图片URL数组
 * @param {string} data.category 商品分类
 * @param {string} data.location 交易地点
 * @param {Object} data.contactInfo 联系方式
 * @param {Array} data.deliveryMethod 交易方式
 * @param {Array} data.tags 标签
 * @returns {Promise}
 */
export function createProduct(data) {
  return request({
    url: '/api/product/create',
    method: 'post',
    data
  })
}

/**
 * 更新商品信息
 * @param {string} id 商品ID
 * @param {Object} data 更新的商品信息
 * @returns {Promise}
 */
export function updateProduct(id, data) {
  return request({
    url: `/api/product/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除商品
 * @param {string} id 商品ID
 * @returns {Promise}
 */
export function deleteProduct(id) {
  return request({
    url: `/api/product/${id}`,
    method: 'delete'
  })
}

/**
 * 收藏商品
 * @param {string} id 商品ID
 * @returns {Promise}
 */
export function favoriteProduct(id) {
  return request({
    url: `/api/product/${id}/favorite`,
    method: 'post'
  })
}

/**
 * 取消收藏商品
 * @param {string} id 商品ID
 * @returns {Promise}
 */
export function unfavoriteProduct(id) {
  return request({
    url: `/api/product/${id}/unfavorite`,
    method: 'delete'
  })
}

/**
 * 获取用户收藏的商品列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码，默认1
 * @param {number} params.size 每页数量，默认10
 * @returns {Promise}
 */
export function getFavoriteProducts(params) {
  return request({
    url: '/api/user/favorite-products',
    method: 'get',
    params
  })
}

/**
 * 获取用户发布的商品列表
 * @param {string} userId 用户ID
 * @param {Object} params 查询参数
 * @param {number} params.page 页码，默认1
 * @param {number} params.size 每页数量，默认10
 * @returns {Promise}
 */
export function getUserProducts(userId, params) {
  return request({
    url: `/api/user/${userId}/products`,
    method: 'get',
    params
  })
}