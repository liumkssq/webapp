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
  console.log('调用getLostFoundList API，参数:', params);
  
  // 使用相对路径，让Vite代理生效
  const apiUrl = `/api/lost-found/list`;
  console.log('请求API:', apiUrl);
  
  return request({
    url: apiUrl,
    method: 'get',
    params
  })
  .then(response => {
    console.log('getLostFoundList API原始响应:', response);
    
    // 处理不同格式的响应
    let processedResponse = response;
    
    // 如果是直接返回了数组
    if (Array.isArray(response)) {
      console.log('API直接返回了数组，包装为标准格式');
      processedResponse = {
        code: 200,
        message: 'success',
        data: {
          list: response,
          total: response.length
        }
      };
    } 
    // 如果response是对象但没有code，可能是直接返回了data对象
    else if (response && !response.code && (response.list || Array.isArray(response))) {
      console.log('API返回了data对象，包装为标准格式');
      processedResponse = {
        code: 200,
        message: 'success',
        data: Array.isArray(response) ? { list: response, total: response.length } : response
      };
    }
    
    // 确保有效的响应格式
    if (processedResponse.code === 200 && processedResponse.data) {
      // 确保data.list存在且是数组
      if (!processedResponse.data.list && Array.isArray(processedResponse.data)) {
        processedResponse.data = {
          list: processedResponse.data,
          total: processedResponse.data.length
        };
      }
      
      // 处理列表项
      if (processedResponse.data.list && Array.isArray(processedResponse.data.list)) {
        processedResponse.data.list = processedResponse.data.list.map(item => {
          // 创建一个新对象，避免直接修改原对象
          const processedItem = { ...item };
          
          // 处理图片字段
          if (processedItem.images) {
            // 如果images是字符串，尝试解析JSON
            if (typeof processedItem.images === 'string') {
              try {
                if (processedItem.images.startsWith('[')) {
                  processedItem.images = JSON.parse(processedItem.images);
                } else {
                  processedItem.images = [processedItem.images];
                }
              } catch (e) {
                console.error('解析失物招领图片JSON失败:', e);
                processedItem.images = [processedItem.images];
              }
            }
            
            // 设置imageUrl
            if (Array.isArray(processedItem.images) && processedItem.images.length > 0) {
              processedItem.imageUrl = processedItem.images[0];
            }
          }
          
          // 确保类型字段存在
          if (!processedItem.type) {
            processedItem.type = 'lost'; // 默认为寻物启事
          }
          
          // 确保状态字段存在
          if (!processedItem.status) {
            processedItem.status = 'open'; // 默认为进行中
          }
          
          // 确保发布者信息存在
          if (!processedItem.publisher && processedItem.publisherName) {
            processedItem.publisher = {
              id: processedItem.publisherId || 0,
              nickname: processedItem.publisherName,
              avatar: processedItem.publisherAvatar || ''
            };
          }
          
          return processedItem;
        });
      }
    }
    
    console.log('getLostFoundList API处理后的响应:', processedResponse);
    return processedResponse;
  })
  .catch(error => {
    console.error('获取失物招领列表失败:', error);
    // 返回一个友好的错误响应
    return {
      code: 500,
      message: error.message || '获取失物招领列表失败',
      data: {
        list: [],
        total: 0
      }
    };
  });
}

/**
 * 获取失物招领详情
 * @param {number} id 失物招领ID
 * @returns {Promise} Promise对象
 */
export function getLostFoundDetail(id) {
  return request({
    url: `/api/lost-found/detail/${id}`,
    method: 'get'
  })
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
    url: '/api/lost-found',
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