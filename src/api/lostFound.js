import request from '@/utils/request'

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
 * @param {object} params 查询参数
 * @param {number} params.userId 用户ID
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function getUserLostFound(params) {
  return request({
    url: `/api/lost-found/user/${params.userId}`,
    method: 'get',
    params: {
      page: params.page,
      limit: params.limit
    }
  })
}

/**
 * 发布失物招领
 * @param {Object} data 失物招领数据
 * @returns {Promise} Promise对象
 */
export function publishLostFound(data) {
  return request({
    url: '/api/lost-found/publish',
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
  return request({
    url: `/api/lost-found/${id}`,
    method: 'delete'
  })
}

/**
 * 更新失物招领状态
 * @param {number} id 失物招领ID
 * @param {string} status 状态(pending/found/claimed/closed)
 * @returns {Promise} Promise对象
 */
export function updateLostFoundStatus(id, status) {
  return request({
    url: `/api/lost-found/${id}/status`,
    method: 'put',
    data: { status }
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