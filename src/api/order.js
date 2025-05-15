import request from '@/utils/request'

/**
 * 创建订单
 * @param {Object} data - 订单数据
 * @param {number} data.productId - 商品ID
 * @param {number} data.quantity - 购买数量
 * @param {string} data.remark - 订单备注（可选）
 * @returns {Promise} - 返回Promise对象
 */
export function createOrder(data) {
  return request({
    url: '/order/v1/order/create',
    method: 'post',
    data
  })
}

/**
 * 获取用户订单列表
 * @param {Object} data - 查询参数
 * @param {number} data.lastId - 上一页最后一条数据ID（可选，分页用）
 * @param {number} data.pageSize - 每页大小（默认20）
 * @param {number} data.status - 订单状态过滤（可选，-1:已取消 0:待支付 1:已支付 2:已完成）
 * @returns {Promise} - 返回Promise对象
 */
export function getUserOrderList(data) {
  return request({
    url: '/order/v1/order/list',
    method: 'post',
    data
  })
}

/**
 * 获取订单详情
 * @param {string} sn - 订单编号
 * @returns {Promise} - 返回Promise对象
 */
export function getOrderDetail(sn) {
  return request({
    url: '/order/v1/order/detail',
    method: 'post',
    data: { sn }
  })
}

/**
 * 取消订单
 * @param {string} sn - 订单编号
 * @returns {Promise} - 返回Promise对象
 */
export function cancelOrder(sn) {
  return request({
    url: '/order/v1/order/cancel',
    method: 'post',
    data: { sn }
  })
}

/**
 * 确认收货
 * @param {string} sn - 订单编号
 * @returns {Promise} - 返回Promise对象
 */
export function confirmReceipt(sn) {
  return request({
    url: '/order/v1/order/confirm',
    method: 'post',
    data: { sn }
  })
}