import request from '@/utils/request';
import axios from 'axios';

// 添加商品评论
export function commentProduct(id, data) {
  console.log(`[API] 发表商品${id}评论:`, data);
  
  // 确保token在请求头中
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[API] 发表评论失败: 未找到认证令牌');
    return Promise.reject({ 
      code: 401, 
      message: '认证失败，请重新登录', 
      status: 401 
    });
  }
  
  return axios({
    url: `${import.meta.env.VITE_API_BASE_URL || ''}/api/product/comment/${id}`,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: data
  })
  .then(response => {
    console.log(`[API] 发表评论成功:`, response.data);
    return response.data;
  })
  .catch(error => {
    console.error(`[API] 发表评论失败:`, error);
    throw error;
  });
}

// 取消收藏商品
export function unfavoriteProduct(id) {
  return request({
    url: `/api/product/unfavorite/${id}`,
    method: 'post',
    data: { favorite: false }
  })
}

// 生成默认商品数据
const generateDefaultProducts = (count = 4) => {
  const products = [];
  const categories = ['电子数码', '图书教材', '服装鞋包', '运动户外'];
  const conditions = ['全新', '几乎全新', '轻微使用痕迹', '明显使用痕迹'];
  
  for (let i = 0; i < count; i++) {
    products.push({
      id: 1000 + i,
      title: `测试商品 ${i+1}`,
      description: `这是一个测试商品描述，用于在API无法正常工作时显示。`,
      brief: `测试商品简介 ${i+1}`,
      price: Math.floor(Math.random() * 1000) + 10,
      originalPrice: Math.floor(Math.random() * 1500) + 100,
      categoryId: i % 4 + 1,
      category: categories[i % 4],
      tags: ['测试', '默认数据'],
      condition: conditions[i % 4],
      stock: Math.floor(Math.random() * 10) + 1,
      salesCount: Math.floor(Math.random() * 100),
      viewCount: Math.floor(Math.random() * 1000) + 100,
      likeCount: Math.floor(Math.random() * 50),
      status: 'on_sale',
      images: [`https://picsum.photos/id/${1000 + i}/400/400`],
      imageUrl: `https://picsum.photos/id/${1000 + i}/400/400`,
      thumbnails: [`https://picsum.photos/id/${1000 + i}/100/100`],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      seller: {
        id: 1,
        username: 'testuser',
        nickname: '测试用户',
        avatar: 'https://picsum.photos/id/1005/100/100',
        rating: 4.8
      }
    });
  }
  
  return products;
};

/**
 * 获取商品列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @param {string} params.category 商品分类
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.sort 排序方式
 * @returns {Promise} Promise对象
 */
export function getProductList(params) {
  console.log('[API] 调用getProductList API，参数:', params);
  
  // 使用相对路径，让Vite代理生效
  const apiUrl = `/api/product/list`;
  console.log('[API] 请求URL:', apiUrl);
  
  // 直接使用fetch API请求，确保获取原始数据
  return fetch(apiUrl + '?' + new URLSearchParams(params).toString())
    .then(response => response.json())
    .then(data => {
      console.log('[API] 获取到商品列表原始数据:', data);
      
      // 简单检查是否有数据
      if (!data) {
        console.error('[API] 获取到的数据为空');
        throw new Error('获取到的数据为空');
      }
      
      // 返回标准格式的响应
      if (data.list) {
        // 已经是标准格式，直接返回
        return { 
          code: 200, 
          message: 'success', 
          data: data 
        };
      } else if (Array.isArray(data)) {
        // 是数组格式，包装成标准响应
        return { 
          code: 200, 
          message: 'success', 
          data: { 
            list: data, 
            total: data.length 
          } 
        };
      } else {
        // 其他格式，尝试处理
        return { 
          code: 200, 
          message: 'success', 
          data: data 
        };
      }
    })
    .catch(error => {
      console.error('[API] 获取商品列表失败:', error);
      // 返回默认数据
      return {
        code: 500,
        message: error.message || '获取商品列表失败',
        data: {
          list: [],
          total: 0
        }
      };
    });
}

/**
 * 获取商品详情
 * @param {string|number} id 商品ID
 * @returns {Promise}
 */
export function getProductDetail(id) {
  return request({
    url: `/api/product/detail/${id}`,
    method: 'get'
  })
}

/**
 * 获取商品分类
 * @returns {Promise} Promise对象
 */
export function getProductCategories() {
  return request({
    url: '/api/product/categories',
    method: 'get'
  })
}

/**
 * 发布新商品
 * @param {Object} data 商品信息
 * @returns {Promise} Promise对象
 */
export function publishProduct(data) {
  console.log('[API] 调用publishProduct API，发送数据:', JSON.stringify(data));
  
  return request({
    url: '/api/product/publish',
    method: 'post',
    data
  })
  .then(response => {
    console.log('[API] publishProduct成功响应:', response);
    return response;
  })
  .catch(error => {
    console.error('[API] publishProduct错误:', error);
    // 返回友好的错误格式
    return {
      code: 500,
      message: error.message || '发布商品失败，请稍后重试',
      success: false
    };
  });
}

/**
 * 更新商品信息
 * @param {number|string} id 商品ID
 * @param {Object} data 商品信息
 * @returns {Promise} Promise对象
 */
export function updateProduct(id, data) {
  return request({
    url: `/api/product/update/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除商品
 * @param {number|string} id 商品ID
 * @returns {Promise} Promise对象
 */
export function deleteProduct(id) {
  return request({
    url: `/api/product/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 获取用户发布的商品列表
 * @param {number|string|object} userId 用户ID
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getUserProducts(userId, params) {
  // 处理userId可能是对象的情况
  let id = userId;
  
  if (typeof userId === 'object') {
    console.warn('getUserProducts: userId是对象类型', userId);
    id = userId.id || userId.userId || null;
  }
  
  if (!id) {
    console.error('getUserProducts: 无效的用户ID', userId);
    return Promise.reject(new Error('无效的用户ID'));
  }
  
  console.log(`调用getUserProducts API, userId: ${id}, 参数:`, params);
  
  return request({
    url: `/api/product/userProduct/${id}`,
    method: 'get',
    params
  });
}

/**
 * 收藏商品
 * @param {string|number} id 商品ID
 * @returns {Promise}
 */
export function favoriteProduct(id) {
  return request({
    url: `/api/product/favorite/${id}`,
    method: 'post',
    data: { favorite: true }
  })
}

/**
 * 获取收藏的商品列表
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getFavoriteProducts(params) {
  return request({
    url: '/api/product/favorites',
    method: 'get',
    params
  })
}

/**
 * 获取用户收藏的商品列表
 * 简化版本，直接调用getFavoriteProducts
 * @returns {Promise} Promise对象
 */
export function getUserFavorites() {
  return getFavoriteProducts();
}

/**
 * 举报商品
 * @param {string|number} id 商品ID
 * @param {Object} data 举报数据，包含reason、description和可选的images数组
 * @returns {Promise}
 */
export function reportProduct(id, data) {
  console.log('[API] 调用reportProduct API，商品ID:', id, '数据:', data);
  
  return request({
    url: `/api/product/report/${id}`,
    method: 'post',
    data
  })
  .then(response => {
    console.log('[API] 举报商品成功响应:', response);
    return response;
  })
  .catch(error => {
    console.error('[API] 举报商品失败:', error);
    // 返回友好的错误格式，确保前端可以处理
    return {
      code: 500,
      message: error.message || '举报失败，请稍后重试',
      success: false
    };
  });
}

/**
 * 获取商品评论列表
 * @param {number|string} id 商品ID
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function getProductComments(id, params = {}) {
  return request({
    url: `/api/product/comments/${id}`,
    method: 'get',
    params
  });
}