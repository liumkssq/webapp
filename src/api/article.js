import request from '@/utils/request'

/**
 * 获取文章列表
 * @param {object} params 查询参数
 * @param {string} params.category 文章分类
 * @param {string} params.keywords 搜索关键词
 * @param {string} params.sort 排序方式(new/hot)
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {number} params.limit 限制返回数量
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
 * @param {number} id 文章ID
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
 * @param {object} data 文章信息
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
 * 更新文章信息
 * @param {number} id 文章ID
 * @param {object} data 文章信息
 * @returns {Promise} Promise对象
 */
export function updateArticle(id, data) {
  return request({
    url: `/api/article/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除文章
 * @param {number} id 文章ID
 * @returns {Promise} Promise对象
 */
export function deleteArticle(id) {
  return request({
    url: `/api/article/${id}`,
    method: 'delete'
  })
}

/**
 * 收藏文章
 * @param {number} id 文章ID
 * @returns {Promise} Promise对象
 */
export function collectArticle(id) {
  return request({
    url: `/api/article/collect/${id}`,
    method: 'post'
  })
}

/**
 * 取消收藏文章
 * @param {number} id 文章ID
 * @returns {Promise} Promise对象
 */
export function uncollectArticle(id) {
  return request({
    url: `/api/article/uncollect/${id}`,
    method: 'post'
  })
}

/**
 * 点赞文章
 * @param {number} id 文章ID
 * @returns {Promise} Promise对象
 */
export function likeArticle(id) {
  return request({
    url: `/api/article/like/${id}`,
    method: 'post'
  })
}

/**
 * 取消点赞文章
 * @param {number} id 文章ID
 * @returns {Promise} Promise对象
 */
export function unlikeArticle(id) {
  return request({
    url: `/api/article/unlike/${id}`,
    method: 'post'
  })
}

/**
 * 收藏/取消收藏文章
 * @param {number} id 文章ID
 * @param {boolean} isFavorite 是否收藏
 * @returns {Promise} Promise对象
 */
export function favoriteArticle(id, isFavorite) {
  return request({
    url: `/api/article/favorite/${id}`,
    method: 'post',
    data: {
      isFavorite
    }
  })
}

/**
 * 获取文章评论列表
 * @param {number} articleId 文章ID
 * @param {object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getArticleComments(articleId, params) {
  return request({
    url: `/api/article/comments/${articleId}`,
    method: 'get',
    params
  })
}

/**
 * 发表文章评论
 * @param {number} articleId 文章ID
 * @param {object} data 评论内容
 * @returns {Promise} Promise对象
 */
export function commentArticle(articleId, data) {
  return request({
    url: `/api/article/comment/${articleId}`,
    method: 'post',
    data
  })
}

/**
 * 获取用户发布的文章列表
 * @param {object} params 查询参数
 * @param {number} params.userId 用户ID
 * @returns {Promise} Promise对象
 */
export function getUserArticles(params) {
  return request({
    url: '/api/article/user',
    method: 'get',
    params
  })
}

/**
 * 获取用户收藏的文章列表
 * @param {object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function getFavoriteArticles(params) {
  return request({
    url: '/api/article/favorite',
    method: 'get',
    params
  })
}