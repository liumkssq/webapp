import request from '@/utils/request';
import axios from 'axios';

/**
 * 获取失物招领列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @param {string} params.type 类型(lost/found/all)
 * @param {string} params.status 状态(pending/found/claimed/closed/all)
 * @param {string} params.sort 排序方式(latest/hot)
 * @param {string} params.keywords 搜索关键词
 * @returns {Promise} Promise对象
 */
export function getLostFoundList(params) {
  return request({
    url: '/api/lost-found/list',
    method: 'get',
    params
  })
}

/**
 * 获取失物招领详情
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function getLostFoundDetail(id) {
  console.log('调用获取失物招领详情API, id:', id);
  
  return request({
    url: `/api/lost-found/detail/${id}`,
    method: 'get'
  }).then(response => {
    console.log('失物招领详情API响应:', response);
    
    // 确保响应有效
    if (!response) {
      console.error('API响应为空');
      return { code: 500, msg: '获取详情失败', data: null };
    }
    
    // 标准化响应格式
    let result;
    
    // 处理不同的响应格式
    if (response.code !== undefined) {
      // 已经是标准格式
      result = response;
    } else if (typeof response === 'object') {
      // 直接返回的数据对象
      result = { code: 200, msg: 'success', data: response };
    } else {
      // 无法识别的格式
      console.error('无法识别的API响应格式:', response);
      result = { code: 500, msg: '数据格式错误', data: null };
    }
    
    // 确保data字段存在
    if (result.code === 200 && !result.data) {
      result.data = {};
    }
    
    // 处理图片数据
    if (result.code === 200 && result.data) {
      // 确保images是数组
      if (!result.data.images) {
        result.data.images = [];
      } else if (typeof result.data.images === 'string') {
        try {
          result.data.images = JSON.parse(result.data.images);
        } catch (e) {
          result.data.images = [result.data.images];
        }
      }
      
      // 确保图片是数组格式
      if (!Array.isArray(result.data.images)) {
        result.data.images = [result.data.images];
      }
    }
    
    return result;
  });
}

/**
 * 获取用户发布的失物招领
 * @param {number|string|object} userIdOrParams 用户ID或包含userId的参数对象
 * @param {Object} [optionalParams] 可选的查询参数
 * @returns {Promise} Promise对象
 */
export function getUserLostFound(userIdOrParams, optionalParams = {}) {
  // 判断第一个参数是对象还是ID
  let userId;
  let params = { page: 1, limit: 20, ...optionalParams };
  
  if (typeof userIdOrParams === 'object') {
    // 从对象中尝试提取用户ID
    if (userIdOrParams.userId) {
      userId = userIdOrParams.userId;
    } else if (userIdOrParams.id) {
      userId = userIdOrParams.id;
    } else if (userIdOrParams.publisherId) {
      userId = userIdOrParams.publisherId;
    } else {
      console.error('getUserLostFound: 无法从对象中提取用户ID', userIdOrParams);
      return Promise.reject(new Error('无效的用户ID'));
    }
    
    // 合并其他参数
    params = { ...params, ...userIdOrParams };
    
    // 删除ID字段，避免URL参数冲突
    delete params.userId;
    delete params.id;
    delete params.publisherId;
    
    console.warn('getUserLostFound: 从对象提取的ID:', userId);
  } else {
    // 如果是直接提供的ID
    userId = userIdOrParams;
  }
  
  // 确保有userId
  if (!userId) {
    console.error('getUserLostFound: 未提供用户ID或ID无效', userIdOrParams);
    return Promise.reject(new Error('获取用户失物招领信息失败：未提供用户ID或ID无效'));
  }
  
  console.log(`调用getUserLostFound API, userId: ${userId}, 参数:`, params);
  
  return request({
    url: `/api/lost-found/userLostFound/${userId}`,
    method: 'get',
    params
  });
}

/**
 * 发布失物招领
 * @param {Object} data 失物招领数据
 * @returns {Promise} Promise对象
 */
export function publishLostFound(data) {
  return request({
    url: '/api/lost-found/',
    method: 'post',
    data
  })
}

/**
 * 更新失物招领
 * @param {number} id 失物招领ID
 * @param {Object} data 更新数据
 * @returns {Promise} Promise对象
 */
export function updateLostFound(id, data) {
  return request({
    url: `/api/lost-found/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除失物招领
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function deleteLostFound(id) {
  const token = localStorage.getItem('token');
  console.log(`[API] 开始删除失物招领, ID: ${id}, 认证状态: ${token ? '已设置令牌' : '未设置令牌'}`);
  
  if (!token) {
    console.error('[API] 删除失物招领失败: 未找到认证令牌');
    return Promise.reject({ 
      code: 401, 
      message: '认证失败，请重新登录', 
      status: 401 
    });
  }
  
  // 按照后端API格式，通过认证中间件发送请求
  return axios({
    url: `${import.meta.env.VITE_API_BASE_URL || ''}/api/lost-found/${id}`,
    method: 'delete',
    headers: {
      'Content-Type': 'application/json',
      // 确保令牌格式正确，Bearer 后应该有空格
      'Authorization': `Bearer ${token}`
    },
    // 不需要在请求体中传递ID，因为它已经在URL路径中了
    data: {} // 空的请求体
  })
  .then(response => {
    console.log(`[API] 删除失物招领成功, ID: ${id}, 响应:`, response.data);
    return response.data;
  })
  .catch(error => {
    console.error(`[API] 删除失物招领失败, ID: ${id}, 错误:`, error);
    
    // 特殊处理认证错误
    if (error.response?.status === 401 || 
        error.response?.data?.includes('authenticated') ||
        error.message?.includes('authenticated')) {
      // 清除无效的token
      localStorage.removeItem('token');
      
      return Promise.reject({
        code: 401,
        message: '认证失败，请重新登录',
        status: 401
      });
    }
    
    return Promise.reject({
      code: error.response?.status || 500,
      message: error.response?.data || error.message || '删除失败',
      status: error.response?.status || 500
    });
  });
}

/**
 * 更新失物招领状态
 * @param {number} id 失物招领ID
 * @param {string|number} status 状态(pending/found/claimed/closed)或状态码
 * @returns {Promise} Promise对象
 */
export function updateLostFoundStatus(id, status) {
  console.log(`更新失物招领状态，ID: ${id}, 状态: ${status}`);
  
  // 确保status是正确的格式
  const statusData = typeof status === 'object' ? status : { status };
  
  return request({
    url: `/api/lost-found/${id}/status`,
    method: 'put',
    data: statusData
  })
}

/**
 * 评论失物招领
 * @param {number} id 失物招领ID
 * @param {Object} data 评论数据
 * @param {string} data.content 评论内容
 * @returns {Promise} Promise对象
 */
export function commentLostFound(id, data) {
  return request({
    url: `/api/lost-found/${id}/comment`,
    method: 'post',
    data
  })
}

/**
 * 获取失物招领评论列表
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function getLostFoundComments(id) {
  return request({
    url: `/api/lost-found/${id}/comments`,
    method: 'get'
  })
}

/**
 * 上传失物招领图片
 * @param {FormData} data 包含图片文件的FormData
 * @returns {Promise} Promise对象
 */
export function uploadLostFoundImages(data) {
  return request({
    url: '/api/lost-found/images',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 点赞失物招领
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function likeLostFound(id) {
  return request({
    url: `/api/lost-found/${id}/like`,
    method: 'post'
  })
}

/**
 * 取消点赞失物招领
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function unlikeLostFound(id) {
  return request({
    url: `/api/lost-found/${id}/unlike`,
    method: 'post'
  })
}

/**
 * 收藏失物招领
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function favoriteLostFound(id) {
  return request({
    url: `/api/lost-found/${id}/favorite`,
    method: 'post'
  })
}

/**
 * 取消收藏失物招领
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function unfavoriteLostFound(id) {
  return request({
    url: `/api/lost-found/${id}/favorite`,
    method: 'delete'
  })
}

/**
 * 举报失物招领内容
 * @param {Object} data 举报数据
 * @returns {Promise} Promise对象
 */
export function reportLostFound(data) {
  return request({
    url: '/v1/report',
    method: 'post',
    data
  })
}