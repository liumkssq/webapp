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
 * 自动登录（仅用于开发环境测试）
 * 无需提供用户名和密码，会自动登录为管理员账号
 * @returns {Promise} Promise对象
 */
export function autoLogin() {
  return request({
    url: '/api/user/login?admin_test=true',
    method: 'post',
    data: {}
  })
}

/**
 * 管理员账号登录（简化方式）
 * 直接使用admin/123456登录，开发环境使用
 * @returns {Promise} Promise对象
 */
export function adminLogin() {
  return request({
    url: '/api/user/login',
    method: 'post',
    data: {
      username: 'admin',
      password: '123456'
    }
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

/**
 * 重置密码
 * @param {object} data 重置密码信息
 * @param {string} data.phone 手机号
 * @param {string} data.verificationCode 验证码
 * @param {string} data.newPassword 新密码
 * @returns {Promise} Promise对象
 */
export function resetPassword(data) {
  return request({
    url: '/api/user/reset-password',
    method: 'post',
    data
  })
}

/**
 * 关注用户
 * @param {number} id 要关注的用户ID
 * @returns {Promise} Promise对象
 */
export function followUser(id) {
  return request({
    url: `/api/user/follow/${id}`,
    method: 'post'
  })
}

/**
 * 取消关注用户
 * @param {number} id 要取消关注的用户ID
 * @returns {Promise} Promise对象
 */
export function unfollowUser(id) {
  return request({
    url: `/api/user/unfollow/${id}`,
    method: 'post'
  })
}