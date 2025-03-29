import request from '@/utils/request'

/**
 * 获取失物招领列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码，默认1
 * @param {number} params.size 每页数量，默认10
 * @param {string} params.type 类型：lost-丢失物品，found-招领物品
 * @param {string} params.status 状态：open-未解决，closed-已解决
 * @param {string} params.category 分类
 * @param {string} params.sort 排序方式：newest-最新，views-浏览量，reward-酬谢金额
 * @returns {Promise}
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
 * @param {string} id 失物招领ID
 * @returns {Promise}
 */
export function getLostFoundDetail(id) {
  return request({
    url: `/api/lost-found/${id}`,
    method: 'get'
  })
}

/**
 * 发布失物招领信息
 * @param {Object} data 失物招领信息
 * @param {string} data.type 类型：lost-丢失物品，found-招领物品
 * @param {string} data.title 标题
 * @param {string} data.description 描述
 * @param {string} data.category 分类
 * @param {Array} data.images 图片URL数组
 * @param {string} data.location 地点
 * @param {string} data.contactWay 联系方式类型
 * @param {string} data.contactInfo 联系方式
 * @param {number} data.reward 酬谢金额（仅丢失物品）
 * @param {string} data.lostFoundTime 丢失/拾获时间
 * @returns {Promise}
 */
export function createLostFound(data) {
  return request({
    url: '/api/lost-found/create',
    method: 'post',
    data
  })
}

/**
 * 更新失物招领信息
 * @param {string} id 失物招领ID
 * @param {Object} data 更新的失物招领信息
 * @returns {Promise}
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
 * @param {string} id 失物招领ID
 * @returns {Promise}
 */
export function deleteLostFound(id) {
  return request({
    url: `/api/lost-found/${id}`,
    method: 'delete'
  })
}

/**
 * 添加评论
 * @param {string} id 失物招领ID
 * @param {Object} data 评论信息
 * @param {string} data.userId 用户ID
 * @param {string} data.userName 用户名
 * @param {string} data.userAvatar 用户头像
 * @param {string} data.content 评论内容
 * @returns {Promise}
 */
export function addComment(id, data) {
  return request({
    url: `/api/lost-found/${id}/comment`,
    method: 'post',
    data
  })
}

/**
 * 标记为已解决
 * @param {string} id 失物招领ID
 * @returns {Promise}
 */
export function markAsSolved(id) {
  return request({
    url: `/api/lost-found/${id}/mark-solved`,
    method: 'put'
  })
}

/**
 * 获取用户发布的失物招领列表
 * @param {string} userId 用户ID
 * @param {Object} params 查询参数
 * @param {number} params.page 页码，默认1
 * @param {number} params.size 每页数量，默认10
 * @param {string} params.type 类型：lost-丢失物品，found-招领物品
 * @param {string} params.status 状态：open-未解决，closed-已解决
 * @returns {Promise}
 */
export function getUserLostFounds(userId, params) {
  return request({
    url: `/api/user/${userId}/lost-founds`,
    method: 'get',
    params
  })
}