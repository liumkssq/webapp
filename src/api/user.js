import request from '@/utils/request'

/**
 * 账号密码登录
 * @param {object} data 登录信息
 * @param {string} data.username 用户名/邮箱
 * @param {string} data.password 密码
 * @returns {Promise} Promise对象
 */
export function loginByPassword(data) {
  return request({
    url: '/api/user/login/password',
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
    url: '/api/user/login/sms-code',
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
    url: '/api/user/login/auto?admin_test=true',
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
    url: '/api/user/login/password',
    method: 'post',
    data: {
      username: 'admin',
      password: '123456'
    }
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
  console.log('发起注册请求，参数:', data);
  
  return request({
    url: '/api/user/register',
    method: 'post',
    data
  })
  .then(response => {
    console.log('注册请求成功响应:', response);
    return response;
  })
  .catch(error => {
    console.error('注册请求失败详情:', error);
    console.error('错误响应数据:', error.response?.data);
    
    // 处理特定的错误情况并提供更有用的信息
    if (error.response) {
      const errorData = error.response.data || {};
      
      // 创建一个标准的错误响应格式
      return {
        code: error.response.status,
        message: errorData.message || getErrorMessage(error.response.status),
        data: null
      };
    }
    
    // 其他类型的错误
    return {
      code: 500,
      message: error.message || '注册失败，请稍后重试',
      data: null
    };
  });
}

// 根据状态码获取错误消息
function getErrorMessage(statusCode) {
  switch (statusCode) {
    case 400:
      return '请求参数错误，请检查输入信息';
    case 401:
      return '未授权，请重新登录';
    case 403:
      return '没有权限执行此操作';
    case 404:
      return '请求的资源不存在';
    case 409:
      return '用户名或手机号已存在';
    case 422:
      return '验证码错误或已过期';
    case 500:
      return '服务器错误，请稍后重试';
    default:
      return '请求失败，状态码：' + statusCode;
  }
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
 * @param {string} data.type 验证码类型，如login、register、reset_password等
 * @returns {Promise} Promise对象
 */
export function apiSendVerificationCode(data) {
  console.log('API函数apiSendVerificationCode被调用，参数:', data);
  
  try {
    // 确保type参数
    const requestData = {
      ...data,
      type: data.type || 'login'  // 默认为登录验证码
    };
    
    console.log('发送验证码请求数据:', requestData);
    console.log('请求URL:', '/api/user/send-code');
    
    return request({
      url: '/api/user/send-code',
      method: 'post',
      data: requestData
    })
      .then(response => {
        console.log('验证码请求原始响应:', response);
        
        // 适配后端响应格式到前端期望的格式
        // 后端返回 { success: true/false }
        // 前端期望 { code: 200/500, message: '...', data: {...} }
        if (response && typeof response === 'object') {
          // 如果响应已经是前端期望的格式 (code/message/data)
          if ('code' in response) {
            return response;
          }
          
          // 如果是后端原始响应格式 (success)
          if ('success' in response) {
            return {
              code: response.success ? 200 : 500,
              message: response.success ? '验证码发送成功' : '验证码发送失败',
              data: { success: response.success }
            };
          }
        }
        
        // 如果响应格式完全无法识别，返回标准格式的错误响应
        return {
          code: 500,
          message: '无法识别的响应格式',
          data: null
        };
      })
      .catch(error => {
        console.error('验证码请求失败:', error);
        // 返回一个统一格式的错误响应对象
        return {
          code: 500,
          data: null,
          message: error.message || '验证码发送失败，请稍后重试'
        };
      });
  } catch (outerError) {
    console.error('验证码函数执行发生错误:', outerError);
    // 捕获函数执行中可能出现的任何错误
    return Promise.resolve({
      code: 500,
      data: null,
      message: outerError.message || '验证码函数执行失败'
    });
  }
}

// 图形验证码相关函数已移除

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
    url: `/api/user/notifications/${id}/read`,
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

/**
 * 验证重置密码的验证码
 * @param {object} data 验证信息
 * @param {string} data.phone 手机号
 * @param {string} data.verificationCode 验证码
 * @param {string} data.type 验证类型
 * @returns {Promise} Promise对象
 */
export function verifyCode(data) {
  return request({
    url: '/api/user/verify-code',
    method: 'post',
    data
  })
}

// 为了向后兼容，保留原来的login函数
export function login(data) {
  // 根据数据内容判断使用哪种登录方式
  if (data.phone && data.verificationCode) {
    return loginByVerificationCode(data)
  } else {
    return loginByPassword(data)
  }
}