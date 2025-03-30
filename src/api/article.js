import request from '@/utils/request'

/**
 * 获取文章列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @param {string} params.category 文章分类
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.sort 排序方式
 * @returns {Promise} Promise对象
 */
export function getArticleList(params) {
  return request({
    url: '/api/article/list',
    method: 'get',
    params
  })
}

/**
 * 获取文章详情
 * @param {number|string} id 文章ID
 * @returns {Promise} Promise对象
 */
export function getArticleDetail(id) {
  return request({
    url: `/api/article/detail/${id}`,
    method: 'get'
  })
}

/**
 * 获取文章分类
 * @returns {Promise} Promise对象
 */
export function getArticleCategories() {
  return request({
    url: '/api/article/categories',
    method: 'get'
  })
}

/**
 * 发布文章
 * @param {Object} data 文章信息
 * @returns {Promise} Promise对象
 */
export function publishArticle(data) {
  return request({
    url: '/api/article/publish',
    method: 'post',
    data
  })
}

/**
 * 更新文章
 * @param {number|string} id 文章ID
 * @param {Object} data 文章信息
 * @returns {Promise} Promise对象
 */
export function updateArticle(id, data) {
  return request({
    url: `/api/article/update/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除文章
 * @param {number|string} id 文章ID
 * @returns {Promise} Promise对象
 */
export function deleteArticle(id) {
  return request({
    url: `/api/article/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 获取用户发布的文章列表
 * @param {number|string} userId 用户ID
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getUserArticles(userId, params) {
  return request({
    url: `/api/article/user/${userId}`,
    method: 'get',
    params
  })
}

/**
 * 点赞/取消点赞文章
 * @param {number|string} id 文章ID
 * @param {boolean} like 是否点赞
 * @returns {Promise} Promise对象
 */
export function likeArticle(id, like = true) {
  return request({
    url: `/api/article/like/${id}`,
    method: 'post',
    data: { like }
  })
}

/**
 * 收藏/取消收藏文章
 * @param {number|string} id 文章ID
 * @param {boolean} favorite 是否收藏
 * @returns {Promise} Promise对象
 */
export function favoriteArticle(id, favorite = true) {
  return request({
    url: `/api/article/favorite/${id}`,
    method: 'post',
    data: { favorite }
  })
}

/**
 * 获取用户收藏的文章列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function getFavoriteArticles(params) {
  return request({
    url: '/api/article/favorites',
    method: 'get',
    params
  })
}

/**
 * 获取文章评论列表
 * @param {number|string} id 文章ID
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getArticleComments(id, params) {
  return request({
    url: `/api/article/comments/${id}`,
    method: 'get',
    params
  })
}

/**
 * 评论文章
 * @param {number|string} id 文章ID
 * @param {Object} data 评论信息
 * @returns {Promise} Promise对象
 */
export function commentArticle(id, data) {
  return request({
    url: `/api/article/comment/${id}`,
    method: 'post',
    data
  })
}

/**
 * 举报文章
 * @param {number|string} id 文章ID
 * @param {Object} data 举报信息
 * @returns {Promise} Promise对象
 */
export function reportArticle(id, data) {
  return request({
    url: `/api/article/report/${id}`,
    method: 'post',
    data
  })
}