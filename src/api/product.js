import request from '@/utils/request'

/**
 * 获取商品列表
 * @param {object} params 查询参数
 * @param {string} params.category 商品分类
 * @param {string} params.keywords 搜索关键词
 * @param {string} params.sort 排序方式(new/hot/price-asc/price-desc)
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {number} params.limit 限制返回数量
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
 * @param {number} id 商品ID
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
 * 发布商品
 * @param {object} data 商品信息
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
 * @param {number} id 商品ID
 * @param {object} data 商品信息
 * @returns {Promise} Promise对象
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
 * @param {number} id 商品ID
 * @returns {Promise} Promise对象
 */
export function deleteProduct(id) {
  return request({
    url: `/api/product/${id}`,
    method: 'delete'
  })
}

/**
 * 商品收藏/取消收藏
 * @param {number} id 商品ID
 * @param {boolean} isFavorite 是否收藏
 * @returns {Promise} Promise对象
 */
export function favoriteProduct(id, isFavorite) {
  return request({
    url: `/api/product/favorite/${id}`,
    method: 'post',
    data: {
      isFavorite
    }
  })
}

/**
 * 获取用户收藏的商品列表
 * @param {object} params 查询参数
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
 * 获取用户发布的商品列表
 * @param {object} params 查询参数
 * @param {number} params.userId 用户ID
 * @returns {Promise} Promise对象
 */
export function getUserProducts(params) {
  return request({
    url: '/api/product/user',
    method: 'get',
    params
  })
}