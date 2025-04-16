import request from '../utils/request'

/**
 * 获取订单列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 返回订单列表数据
 */
export function getOrderList(params) {
  return request({
    url: '/user/order/list',
    method: 'get',
    params
  })
}

/**
 * 获取订单详情
 * @param {number|string} id 订单ID
 * @returns {Promise<Object>} 返回订单详情
 */
export function getOrderDetail(id) {
  return request({
    url: `/user/order/detail/${id}`,
    method: 'get'
  })
}

/**
 * 创建订单
 * @param {Object} data 订单数据
 * @returns {Promise<Object>} 返回创建结果
 */
export function createOrder(data) {
  return request({
    url: '/user/order/create',
    method: 'post',
    data
  })
}

/**
 * 取消订单
 * @param {number|string} id 订单ID
 * @returns {Promise<Object>} 返回取消结果
 */
export function cancelOrder(id) {
  return request({
    url: `/user/order/cancel/${id}`,
    method: 'put'
  })
}

/**
 * 删除订单
 * @param {number|string} id 订单ID
 * @returns {Promise<Object>} 返回删除结果
 */
export function deleteOrder(id) {
  return request({
    url: `/user/order/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 确认收货
 * @param {number|string} id 订单ID
 * @returns {Promise<Object>} 返回确认结果
 */
export function confirmReceipt(id) {
  return request({
    url: `/user/order/confirm-receipt/${id}`,
    method: 'put'
  })
}

/**
 * 提交评价
 * @param {Object} data 评价数据
 * @returns {Promise<Object>} 返回评价结果
 */
export function submitReview(data) {
  return request({
    url: '/user/order/review',
    method: 'post',
    data
  })
}

/**
 * 支付订单
 * @param {Object} data 支付数据
 * @returns {Promise<Object>} 返回支付结果
 */
export function payOrder(data) {
  return request({
    url: '/user/order/pay',
    method: 'post',
    data
  })
}