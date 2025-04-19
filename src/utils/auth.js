/**
 * 身份验证相关工具函数
 */

// Token在LocalStorage中的键名
const TOKEN_KEY = 'user_token'
const USER_INFO_KEY = 'user_info'

/**
 * 获取Token
 * @returns {string} token字符串，如果不存在则返回空字符串
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

/**
 * 设置Token
 * @param {string} token - 身份验证token
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 移除Token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 获取用户信息
 * @returns {Object|null} 用户信息对象，如果不存在则返回null
 */
export function getUserInfo() {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY)
  if (!userInfoStr) return null
  
  try {
    return JSON.parse(userInfoStr)
  } catch (e) {
    console.error('解析用户信息失败:', e)
    return null
  }
}

/**
 * 设置用户信息
 * @param {Object} userInfo - 用户信息对象
 */
export function setUserInfo(userInfo) {
  if (!userInfo) {
    localStorage.removeItem(USER_INFO_KEY)
    return
  }
  
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

/**
 * 移除用户信息
 */
export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY)
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
  return !!getToken() && !!getUserInfo()
}

/**
 * 清除所有登录信息
 */
export function clearLoginInfo() {
  removeToken()
  removeUserInfo()
} 