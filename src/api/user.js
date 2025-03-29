import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - 登录信息
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise} 返回Promise对象
 */
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

/**
 * 用户注册
 * @param {Object} data - 注册信息
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.email - 邮箱
 * @param {string} data.phone - 手机号
 * @returns {Promise} 返回Promise对象
 */
export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data
  })
}

/**
 * 发送验证码
 * @param {Object} data - 手机号信息
 * @param {string} data.phone - 手机号
 * @returns {Promise} 返回Promise对象
 */
export function sendVerifyCode(data) {
  return request({
    url: '/user/send-verify-code',
    method: 'post',
    data
  })
}

/**
 * 重置密码
 * @param {Object} data - 重置密码信息
 * @param {string} data.phone - 手机号
 * @param {string} data.code - 验证码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise} 返回Promise对象
 */
export function resetPassword(data) {
  return request({
    url: '/user/reset-password',
    method: 'post',
    data
  })
}

/**
 * 获取用户信息
 * @returns {Promise} 返回Promise对象
 */
export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

/**
 * 获取用户主页信息
 * @param {string} userId - 用户ID
 * @returns {Promise} 返回Promise对象
 */
export function getUserProfile(userId) {
  return request({
    url: `/user/profile/${userId}`,
    method: 'get'
  })
}

/**
 * 更新用户信息
 * @param {Object} data - 用户信息
 * @returns {Promise} 返回Promise对象
 */
export function updateUserInfo(data) {
  return request({
    url: '/user/update',
    method: 'post',
    data
  })
}

/**
 * 上传用户头像
 * @param {FormData} data - 表单数据，包含图片文件
 * @returns {Promise} 返回Promise对象
 */
export function uploadAvatar(data) {
  return request({
    url: '/user/upload-avatar',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 关注用户
 * @param {string} userId - 被关注的用户ID
 * @returns {Promise} 返回Promise对象
 */
export function followUser(userId) {
  return request({
    url: '/user/follow',
    method: 'post',
    data: { userId }
  })
}

/**
 * 取消关注用户
 * @param {string} userId - 被取消关注的用户ID
 * @returns {Promise} 返回Promise对象
 */
export function unfollowUser(userId) {
  return request({
    url: '/user/unfollow',
    method: 'post',
    data: { userId }
  })
}

/**
 * 获取我的关注列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页记录数
 * @returns {Promise} 返回Promise对象
 */
export function getFollowingList(params) {
  return request({
    url: '/user/following',
    method: 'get',
    params
  })
}

/**
 * 获取我的粉丝列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页记录数
 * @returns {Promise} 返回Promise对象
 */
export function getFollowersList(params) {
  return request({
    url: '/user/followers',
    method: 'get',
    params
  })
}

/**
 * 退出登录
 * @returns {Promise} 返回Promise对象
 */
export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}