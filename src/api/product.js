import request from '@/utils/request'

/**
 * 获取商品列表
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.limit=10] - 每页数量
 * @param {string} [params.category] - 商品分类
 * @param {string} [params.keywords] - 搜索关键词
 * @param {string} [params.sort] - 排序方式: latest, hot, price-asc, price-desc
 * @returns {Promise<Object>} 商品列表数据
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
 * @param {number|string} id - 商品ID
 * @returns {Promise<Object>} 商品详情数据
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
 * 获取用户发布的商品
 * @param {Object} params - 查询参数
 * @param {number|string} params.userId - 用户ID
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.limit=10] - 每页数量
 * @returns {Promise<Object>} 用户商品列表数据
 */
export function getUserProducts(params) {
  return request({
    url: `/api/product/user/${params.userId}`,
    method: 'get',
    params: {
      page: params.page,
      limit: params.limit
    }
  })
}

/**
 * 获取用户收藏的商品
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.limit=10] - 每页数量
 * @returns {Promise<Object>} 用户收藏的商品列表数据
 */
export function getFavoriteProducts(params) {
  return request({
    url: '/api/product/favorites',
    method: 'get',
    params
  })
}

/**
 * 发布商品
 * @param {Object} data - 商品数据
 * @param {string} data.title - 商品标题
 * @param {string} data.description - 商品描述
 * @param {number} data.price - 商品价格
 * @param {number} [data.originalPrice] - 商品原价
 * @param {string} data.category - 商品分类
 * @param {string} data.condition - 商品成色状态
 * @param {string[]} data.images - 商品图片URL数组
 * @param {string} data.deliveryMethod - 交付方式
 * @param {Object} data.contactInfo - 联系信息
 * @returns {Promise<Object>} 发布结果
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
 * @param {number|string} id - 商品ID
 * @param {Object} data - 更新的商品数据
 * @returns {Promise<Object>} 更新结果
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
 * @param {number|string} id - 商品ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteProduct(id) {
  return request({
    url: `/api/product/${id}`,
    method: 'delete'
  })
}

/**
 * 收藏商品
 * @param {number|string} id - 商品ID
 * @returns {Promise<Object>} 收藏结果
 */
export function favoriteProduct(id) {
  return request({
    url: `/api/product/${id}/favorite`,
    method: 'post'
  })
}

/**
 * 取消收藏商品
 * @param {number|string} id - 商品ID
 * @returns {Promise<Object>} 取消收藏结果
 */
export function unfavoriteProduct(id) {
  return request({
    url: `/api/product/${id}/unfavorite`,
    method: 'post'
  })
}

/**
 * 评论商品
 * @param {number|string} id - 商品ID
 * @param {Object} data - 评论数据
 * @param {string} data.content - 评论内容
 * @param {number|string} [data.replyToId] - 回复的评论ID
 * @returns {Promise<Object>} 评论结果
 */
export function commentProduct(id, data) {
  return request({
    url: `/api/product/${id}/comment`,
    method: 'post',
    data
  })
}

/**
 * 上传商品图片
 * @param {FormData} data - 包含图片文件的FormData对象
 * @returns {Promise<Object>} 上传结果
 */
export function uploadProductImages(data) {
  return request({
    url: '/api/product/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  })
}