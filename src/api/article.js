import request from '@/utils/request'

/**
 * 获取文章列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页记录数
 * @param {string} params.type - 文章类型
 * @param {string} params.tag - 标签
 * @param {string} params.sort - 排序方式
 * @returns {Promise} 返回Promise对象
 */
export function getArticleList(params) {
  return request({
    url: '/article/list',
    method: 'get',
    params
  })
}

/**
 * 获取文章详情
 * @param {string} id - 文章ID
 * @returns {Promise} 返回Promise对象
 */
export function getArticleDetail(id) {
  return request({
    url: `/article/${id}`,
    method: 'get'
  })
}

/**
 * 发布文章
 * @param {Object} data - 文章数据
 * @returns {Promise} 返回Promise对象
 */
export function publishArticle(data) {
  return request({
    url: '/article/publish',
    method: 'post',
    data
  })
}

/**
 * 更新文章
 * @param {string} id - 文章ID
 * @param {Object} data - 文章数据
 * @returns {Promise} 返回Promise对象
 */
export function updateArticle(id, data) {
  return request({
    url: `/article/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除文章
 * @param {string} id - 文章ID
 * @returns {Promise} 返回Promise对象
 */
export function deleteArticle(id) {
  return request({
    url: `/article/${id}`,
    method: 'delete'
  })
}

/**
 * 点赞文章
 * @param {string} id - 文章ID
 * @returns {Promise} 返回Promise对象
 */
export function likeArticle(id) {
  return request({
    url: `/article/${id}/like`,
    method: 'post'
  })
}

/**
 * 取消点赞文章
 * @param {string} id - 文章ID
 * @returns {Promise} 返回Promise对象
 */
export function unlikeArticle(id) {
  return request({
    url: `/article/${id}/unlike`,
    method: 'post'
  })
}

/**
 * 收藏文章
 * @param {string} id - 文章ID
 * @returns {Promise} 返回Promise对象
 */
export function collectArticle(id) {
  return request({
    url: `/article/${id}/collect`,
    method: 'post'
  })
}

/**
 * 取消收藏文章
 * @param {string} id - 文章ID
 * @returns {Promise} 返回Promise对象
 */
export function uncollectArticle(id) {
  return request({
    url: `/article/${id}/uncollect`,
    method: 'post'
  })
}

/**
 * 获取文章评论列表
 * @param {string} id - 文章ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页记录数
 * @returns {Promise} 返回Promise对象
 */
export function getArticleComments(id, params) {
  return request({
    url: `/article/${id}/comments`,
    method: 'get',
    params
  })
}

/**
 * 发表评论
 * @param {string} id - 文章ID
 * @param {Object} data - 评论数据
 * @returns {Promise} 返回Promise对象
 */
export function addComment(id, data) {
  return request({
    url: `/article/${id}/comment`,
    method: 'post',
    data
  })
}

/**
 * 回复评论
 * @param {string} articleId - 文章ID
 * @param {string} commentId - 评论ID
 * @param {Object} data - 回复数据
 * @returns {Promise} 返回Promise对象
 */
export function replyComment(articleId, commentId, data) {
  return request({
    url: `/article/${articleId}/comment/${commentId}/reply`,
    method: 'post',
    data
  })
}