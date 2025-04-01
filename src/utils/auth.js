/**
 * 认证相关工具函数
 */

const TokenKey = 'campus_token'
const UserInfoKey = 'campus_user_info'
const LoginTimeKey = 'campus_login_time'

/**
 * 获取token
 * @returns {string|null} token值
 */
export function getToken() {
  return localStorage.getItem(TokenKey)
}

/**
 * 设置token
 * @param {string} token token值
 */
export function setToken(token) {
  localStorage.setItem(TokenKey, token)
  // 记录登录时间
  localStorage.setItem(LoginTimeKey, Date.now().toString())
}

/**
 * 移除token
 */
export function removeToken() {
  localStorage.removeItem(TokenKey)
  localStorage.removeItem(LoginTimeKey)
}

/**
 * 获取用户信息
 * @returns {Object|null} 用户信息对象
 */
export function getUserInfo() {
  const userInfo = localStorage.getItem(UserInfoKey)
  return userInfo ? JSON.parse(userInfo) : null
}

/**
 * 设置用户信息
 * @param {Object} userInfo 用户信息对象
 */
export function setUserInfo(userInfo) {
  localStorage.setItem(UserInfoKey, JSON.stringify(userInfo))
}

/**
 * 移除用户信息
 */
export function removeUserInfo() {
  localStorage.removeItem(UserInfoKey)
}

/**
 * 清除所有认证信息
 */
export function clearAuth() {
  removeToken()
  removeUserInfo()
}

/**
 * 检查token是否过期
 * @param {number} maxAgeHours token最大有效时间（小时）
 * @returns {boolean} 是否过期
 */
export function isTokenExpired(maxAgeHours = 24) {
  const loginTime = localStorage.getItem(LoginTimeKey)
  if (!loginTime) return true
  
  const now = Date.now()
  const loginTimeMs = parseInt(loginTime)
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000
  
  return now - loginTimeMs > maxAgeMs
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
  return !!getToken() && !isTokenExpired()
}

export default {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  clearAuth,
  isTokenExpired,
  isLoggedIn
} 