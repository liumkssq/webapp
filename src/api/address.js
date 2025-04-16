import request from '../utils/request'

/**
 * 获取用户地址列表
 * @returns {Promise<Object>} 返回地址列表数据
 */
export function getAddressList() {
  return request({
    url: '/user/address/list',
    method: 'get'
  })
}

/**
 * 添加新地址
 * @param {Object} data 地址信息
 * @returns {Promise<Object>} 返回添加结果
 */
export function addAddress(data) {
  return request({
    url: '/user/address/add',
    method: 'post',
    data
  })
}

/**
 * 更新地址信息
 * @param {Object} data 地址信息，包含id
 * @returns {Promise<Object>} 返回更新结果
 */
export function updateAddress(data) {
  return request({
    url: '/user/address/update',
    method: 'put',
    data
  })
}

/**
 * 删除地址
 * @param {number|string} id 地址ID
 * @returns {Promise<Object>} 返回删除结果
 */
export function deleteAddress(id) {
  return request({
    url: `/user/address/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 设置默认地址
 * @param {number|string} id 地址ID
 * @returns {Promise<Object>} 返回设置结果
 */
export function setDefaultAddress(id) {
  return request({
    url: `/user/address/set-default/${id}`,
    method: 'put'
  })
}

/**
 * 获取单个地址详情
 * @param {number|string} id 地址ID
 * @returns {Promise<Object>} 返回地址详情
 */
export function getAddressDetail(id) {
  return request({
    url: `/user/address/detail/${id}`,
    method: 'get'
  })
}