import request from '@/utils/request'

/**
 * 用户登录
 * @param {object} data 登录信息
 * @param {string} data.username 用户名/手机号/邮箱
 * @param {string} data.password 密码
 * @returns {Promise} Promise对象
 */
export function login(data) {
  return request({
    url: '/api/user/login',
    method: 'post',
    data
  })
}

/**
 * 验证码登录
 * @param {object} data 登录信息
 * @param {string} data.phone 手机号
 * @param {string} data.verificationCode 验证码
 * @returns {Promise} Promise对象
 */
export function loginByVerificationCode(data) {
  return request({
    url: '/api/user/login',
    method: 'post',
    data
  })
}

/**
 * 用户注册
 * @param {object} data 注册信息
 * @param {string} data.username 用户名
 * @param {string} data.password 密码
 * @param {string} data.phone 手机号
 * @param {string} data.verificationCode 验证码
 * @returns {Promise} Promise对象
 */
export function register(data) {
  return request({
    url: '/api/user/register',
    method: 'post',
    data
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise} Promise对象
 */
export function getUserInfo() {
  return request({
    url: '/api/user/info',
    method: 'get'
  })
}

/**
 * 获取用户详细资料
 * @param {number} id 用户ID
 * @returns {Promise} Promise对象
 */
export function getUserProfile(id) {
  return request({
    url: `/api/user/profile/${id}`,
    method: 'get'
  })
}

/**
 * 更新用户信息
 * @param {object} data 用户信息
 * @returns {Promise} Promise对象
 */
export function updateUserInfo(data) {
  return request({
    url: '/api/user/info',
    method: 'put',
    data
  })
}

/**
 * 修改密码
 * @param {object} data 密码信息
 * @param {string} data.oldPassword 旧密码
 * @param {string} data.newPassword 新密码
 * @returns {Promise} Promise对象
 */
export function changePassword(data) {
  return request({
    url: '/api/user/password',
    method: 'put',
    data
  })
}

/**
 * 发送验证码
 * @param {object} data 手机信息
 * @param {string} data.phone 手机号
 * @returns {Promise} Promise对象
 */
export function sendVerificationCode(data) {
  return request({
    url: '/api/user/verification-code',
    method: 'post',
    data
  })
}

// 重命名为apiSendVerificationCode以避免与Login.vue中的sendVerificationCode函数冲突
export { sendVerificationCode as apiSendVerificationCode }

/**
 * 退出登录
 * @returns {Promise} Promise对象
 */
export function logout() {
  return request({
    url: '/api/user/logout',
    method: 'post'
  })
}

/**
 * 上传头像
 * @param {FormData} data 包含头像文件的FormData
 * @returns {Promise} Promise对象
 */
export function uploadAvatar(data) {
  return request({
    url: '/api/user/avatar',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取用户通知
 * @returns {Promise} Promise对象
 */
export function getNotifications() {
  return request({
    url: '/api/user/notifications',
    method: 'get'
  })
}

/**
 * 标记通知为已读
 * @param {number} id 通知ID
 * @returns {Promise} Promise对象
 */
export function markNotificationAsRead(id) {
  return request({
    url: `/api/user/notification/read/${id}`,
    method: 'put'
  })
}