import request from '@/utils/request'

// 添加商品评论
export function commentProduct(productId, data) {
  return request({
    url: `/api/product/comment/${productId}`,
    method: 'post',
    data
  })
}

// 取消收藏商品
export function unfavoriteProduct(id) {
  return request({
    url: `/api/product/unfavorite/${id}`,
    method: 'post'
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
 * @param {number|string} id 商品ID
 * @returns {Promise} Promise对象
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
 * @param {number|string} userId 用户ID
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getUserProducts(userId, params) {
  return request({
    url: `/api/product/user/${userId}`,
    method: 'get',
    params
  })
}

/**
 * 收藏/取消收藏商品
 * @param {number|string} id 商品ID
 * @param {boolean} favorite 是否收藏
 * @returns {Promise} Promise对象
 */
export function favoriteProduct(id, favorite) {
  return request({
    url: `/api/product/favorite/${id}`,
    method: 'post',
    data: { favorite }
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
 * 商品举报
 * @param {number|string} id 商品ID
 * @param {Object} data 举报信息
 * @returns {Promise} Promise对象
 */
export function reportProduct(id, data) {
  return request({
    url: `/api/product/report/${id}`,
    method: 'post',
    data
  })
}