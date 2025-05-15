import request from '@/utils/request'

/**
 * 创建支付宝支付
 * @param {Object} data - 支付数据
 * @param {string} data.orderSn - 订单编号
 * @param {string} data.returnUrl - 支付完成后的前端跳转地址（可选）
 * @returns {Promise} - 返回Promise对象，包含支付表单和支付流水号
 */
export function createAlipayPayment(data) {
  return request({
    url: '/payment/v1/alipay/create',
    method: 'post',
    data
  })
}

/**
 * 查询支付状态
 * @param {string} paySn - 支付流水号
 * @returns {Promise} - 返回Promise对象，包含支付状态信息
 */
export function getPaymentStatus(paySn) {
  return request({
    url: '/payment/v1/payment/status',
    method: 'post',
    data: {
      paySn
    }
  })
}