import request from '@/utils/request'

/**
 * 获取失物招领列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @param {string} params.type 类型(lost/found/all)
 * @param {string} params.status 状态(pending/found/claimed/closed/all)
 * @param {string} params.sort 排序方式(latest/hot)
 * @param {string} params.keywords 搜索关键词
 * @returns {Promise} Promise对象
 */
export function getLostFoundList(params) {
  return request({
    url: '/api/lost-found/list',
    method: 'get',
    params
  })
}

/**
 * 获取失物招领详情
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function getLostFoundDetail(id) {
  return request({
    url: `/api/lost-found/detail/${id}`,
    method: 'get'
  })
}

/**
 * 获取用户发布的失物招领
 * @param {number} userId 用户ID
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function getUserLostFound(userId, params) {
  return request({
    url: `/api/lost-found/user/${userId}`,
    method: 'get',
    params
  })
}

/**
 * 发布失物招领
 * @param {Object} data 失物招领数据
 * @returns {Promise} Promise对象
 */
export function publishLostFound(data) {
  return request({
    url: '/api/lost-found',
    method: 'post',
    data
  })
}

/**
 * 更新失物招领
 * @param {number} id 失物招领ID
 * @param {Object} data 更新数据
 * @returns {Promise} Promise对象
 */
export function updateLostFound(id, data) {
  return request({
    url: `/api/lost-found/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除失物招领
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function deleteLostFound(id) {
  return request({
    url: `/api/lost-found/${id}`,
    method: 'delete'
  })
}

/**
 * 更新失物招领状态
 * @param {number} id 失物招领ID
 * @param {string} status 状态(pending/found/claimed/closed)
 * @returns {Promise} Promise对象
 */
export function updateLostFoundStatus(id, status) {
  return request({
    url: `/api/lost-found/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 评论失物招领
 * @param {number} id 失物招领ID
 * @param {Object} data 评论数据
 * @param {string} data.content 评论内容
 * @returns {Promise} Promise对象
 */
export function commentLostFound(id, data) {
  return request({
    url: `/api/lost-found/${id}/comment`,
    method: 'post',
    data
  })
}

/**
 * 上传失物招领图片
 * @param {FormData} data 包含图片文件的FormData
 * @returns {Promise} Promise对象
 */
export function uploadLostFoundImages(data) {
  return request({
    url: '/api/lost-found/images',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}