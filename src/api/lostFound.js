import request from '@/utils/request'

/**
 * 获取失物招领列表
 * @param {object} params 查询参数
 * @param {string} params.type 类型(lost/found/all)
 * @param {string} params.keywords 搜索关键词
 * @param {string} params.sort 排序方式(latest/hot)
 * @param {string} params.status 状态(open/pending/closed/all)
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {number} params.limit 限制返回数量
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
 * 发布失物招领信息
 * @param {object} data 失物招领信息
 * @returns {Promise} Promise对象
 */
export function publishLostFound(data) {
  return request({
    url: '/api/lost-found/publish',
    method: 'post',
    data
  })
}

/**
 * 更新失物招领信息
 * @param {number} id 失物招领ID
 * @param {object} data 失物招领信息
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
 * 删除失物招领信息
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
 * @param {string} status 状态(open/pending/closed)
 * @returns {Promise} Promise对象
 */
export function updateLostFoundStatus(id, status) {
  return request({
    url: `/api/lost-found/status/${id}`,
    method: 'put',
    data: {
      status
    }
  })
}

/**
 * 获取用户发布的失物招领列表
 * @param {object} params 查询参数
 * @param {number} params.userId 用户ID
 * @returns {Promise} Promise对象
 */
export function getUserLostFound(params) {
  return request({
    url: '/api/lost-found/user',
    method: 'get',
    params
  })
}