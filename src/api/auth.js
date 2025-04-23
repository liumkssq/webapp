/**
 * 认证相关API
 */
import request from '@/utils/request';

/**
 * 用户登录
 * @param {Object} data - 登录参数
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise} - API响应
 */
export const login = (data) => {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data
  });
};

/**
 * 用户注册
 * @param {Object} data - 注册参数
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.email - 邮箱
 * @param {string} [data.nickname] - 昵称
 * @returns {Promise} - API响应
 */
export const register = (data) => {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data
  });
};

/**
 * 用户退出登录
 * @returns {Promise} - API响应
 */
export const logout = () => {
  return request({
    url: '/api/auth/logout',
    method: 'post'
  });
};

/**
 * 获取当前用户信息
 * @returns {Promise} - API响应
 */
export const getUserInfo = () => {
  return request({
    url: '/api/user/info',
    method: 'get'
  });
};

/**
 * 修改密码
 * @param {Object} data - 密码修改参数
 * @param {string} data.oldPassword - 旧密码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise} - API响应
 */
export const changePassword = (data) => {
  return request({
    url: '/api/auth/password',
    method: 'put',
    data
  });
};

/**
 * 发送邮箱验证码
 * @param {Object} data - 邮箱参数
 * @param {string} data.email - 邮箱地址
 * @param {string} data.type - 验证码类型，如'register','reset'
 * @returns {Promise} - API响应
 */
export const sendVerificationCode = (data) => {
  return request({
    url: '/api/auth/verification-code',
    method: 'post',
    data
  });
};

/**
 * 重置密码
 * @param {Object} data - 重置密码参数
 * @param {string} data.email - 邮箱地址
 * @param {string} data.code - 验证码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise} - API响应
 */
export const resetPassword = (data) => {
  return request({
    url: '/api/auth/reset-password',
    method: 'post',
    data
  });
};