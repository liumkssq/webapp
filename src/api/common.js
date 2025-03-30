import request from '@/utils/request'

/**
 * 获取热门搜索关键词
 * @returns {Promise} Promise对象
 */
export function getHotSearchKeywords() {
  return request({
    url: '/api/common/hot-keywords',
    method: 'get'
  })
}

/**
 * 获取系统配置
 * @returns {Promise} Promise对象
 */
export function getSystemConfig() {
  return request({
    url: '/api/common/config',
    method: 'get'
  })
}

/**
 * 获取版本信息
 * @returns {Promise} Promise对象
 */
export function getVersionInfo() {
  return request({
    url: '/api/common/version',
    method: 'get'
  })
}

/**
 * 获取应用通知
 * @returns {Promise} Promise对象
 */
export function getAppNotifications() {
  return request({
    url: '/api/common/notifications',
    method: 'get'
  })
}

/**
 * 提交反馈
 * @param {Object} data 反馈信息
 * @returns {Promise} Promise对象
 */
export function submitFeedback(data) {
  return request({
    url: '/api/common/feedback',
    method: 'post',
    data
  })
}

/**
 * 举报内容
 * @param {Object} data 举报信息
 * @returns {Promise} Promise对象
 */
export function reportContent(data) {
  return request({
    url: '/api/common/report',
    method: 'post',
    data
  })
}

/**
 * 获取隐私政策
 * @returns {Promise} Promise对象
 */
export function getPrivacyPolicy() {
  return request({
    url: '/api/common/privacy-policy',
    method: 'get'
  })
}

/**
 * 获取用户协议
 * @returns {Promise} Promise对象
 */
export function getUserAgreement() {
  return request({
    url: '/api/common/user-agreement',
    method: 'get'
  })
} 