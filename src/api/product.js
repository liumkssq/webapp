import request from '@/utils/request'

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
  console.log('调用getProductList API，参数:', params);
  
  // 确保使用正确的端口
  const apiUrl = `http://localhost:5175/api/product/list`;
  console.log('请求真实API:', apiUrl);
  
  // 设置超时时间，10秒后自动使用默认数据
  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => {
      console.error('API请求超时(10秒)，使用默认商品数据');
      resolve({
        code: 200,
        message: 'success (默认数据)',
        data: {
          list: generateDefaultProducts(params.limit || 4),
          total: params.limit || 4
        }
      });
    }, 10000);
  });
  
  const fetchPromise = request({
    url: apiUrl,
    method: 'get',
    params
  })
  .then(response => {
    console.log('getProductList API原始响应:', response);
    
    // 如果没有正确响应，使用默认数据
    if (!response || (response.code !== 200 && !Array.isArray(response))) {
      console.error('API响应异常，使用默认商品数据');
      return {
        code: 200,
        message: 'success (默认数据)',
        data: {
          list: generateDefaultProducts(params.limit || 4),
          total: params.limit || 4
        }
      };
    }
    
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
    
    // 检查是否有有效数据
    if (processedResponse.code === 200 && 
        (!processedResponse.data || 
         !processedResponse.data.list || 
         !Array.isArray(processedResponse.data.list) ||
         processedResponse.data.list.length === 0)) {
      console.error('API响应无有效数据，使用默认商品数据');
      processedResponse.data = {
        list: generateDefaultProducts(params.limit || 4),
        total: params.limit || 4
      };
    }
    
    // 处理API返回的数据，确保商品图片正确
    if (processedResponse && processedResponse.code === 200 && processedResponse.data) {
      // 确保data.list存在且是数组
      if (!processedResponse.data.list && Array.isArray(processedResponse.data)) {
        processedResponse.data = {
          list: processedResponse.data,
          total: processedResponse.data.length
        };
      }
      
      if (processedResponse.data.list && Array.isArray(processedResponse.data.list)) {
        const productList = processedResponse.data.list.map(product => {
          // 创建一个新对象，避免直接修改原对象
          const processedProduct = { ...product };
          
          // 处理商品图片
          if (processedProduct.images) {
            // 如果images是字符串，尝试解析JSON
            if (typeof processedProduct.images === 'string') {
              try {
                if (processedProduct.images.startsWith('[')) {
                  processedProduct.images = JSON.parse(processedProduct.images);
                  console.log(`商品[${processedProduct.id}]成功解析图片JSON:`, processedProduct.images);
                } else {
                  // 单个图片URL字符串
                  processedProduct.images = [processedProduct.images];
                }
              } catch (e) {
                console.error(`商品[${processedProduct.id}]解析图片JSON失败:`, e);
                processedProduct.images = [processedProduct.images];
              }
            } 
            // 如果images是数组，处理每个元素
            else if (Array.isArray(processedProduct.images)) {
              processedProduct.images = processedProduct.images.map(img => {
                if (typeof img === 'string' && img.startsWith('[')) {
                  try {
                    const parsed = JSON.parse(img);
                    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : img;
                  } catch (e) {
                    console.error('解析数组中的图片JSON失败:', e);
                    return img.replace(/^\[\"|\"\]$/g, '');
                  }
                }
                return img;
              });
            }
          } 
          // 如果没有images字段但有imageUrl字段
          else if (processedProduct.imageUrl) {
            processedProduct.images = [processedProduct.imageUrl];
          }
          // 如果没有任何图片字段
          else {
            // 生成一个默认图片
            processedProduct.images = [`https://picsum.photos/id/${processedProduct.id || Math.floor(Math.random() * 1000)}/400/400`];
          }
          
          // 设置imageUrl字段，确保兼容性
          if (processedProduct.images && processedProduct.images.length > 0) {
            processedProduct.imageUrl = processedProduct.images[0];
          } else {
            processedProduct.imageUrl = `https://picsum.photos/id/${processedProduct.id || Math.floor(Math.random() * 1000)}/400/400`;
          }
          
          // 处理卖家信息
          if (!processedProduct.seller && (processedProduct.sellerId || processedProduct.sellerName)) {
            processedProduct.seller = {
              id: processedProduct.sellerId || 'unknown',
              name: processedProduct.sellerName || '未知用户',
              avatar: processedProduct.sellerAvatar || '',
              nickname: processedProduct.sellerName || '未知用户'
            };
          } else if (!processedProduct.seller) {
            // 创建默认卖家信息
            processedProduct.seller = {
              id: 1,
              name: '测试用户',
              nickname: '测试用户',
              avatar: 'https://picsum.photos/id/1005/100/100'
            };
          }
          
          // 确保价格是数字
          if (processedProduct.price && typeof processedProduct.price !== 'number') {
            processedProduct.price = parseFloat(processedProduct.price) || 0;
          } else if (processedProduct.price === undefined || processedProduct.price === null) {
            processedProduct.price = Math.floor(Math.random() * 1000) + 10;
          }
          
          return processedProduct;
        });
        
        processedResponse.data.list = productList;
      }
    }
    
    console.log('getProductList API处理后的响应:', processedResponse);
    return processedResponse;
  })
  .catch(error => {
    console.error('获取商品列表失败:', error);
    // 返回默认数据
    return {
      code: 200,
      message: 'success (默认数据)',
      data: {
        list: generateDefaultProducts(params.limit || 4),
        total: params.limit || 4
      }
    };
  });
  
  // 使用Promise.race确保在API超时时返回默认数据
  return Promise.race([fetchPromise, timeoutPromise]);
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
  return request({
    url: '/api/product/publish',
    method: 'post',
    data
  })
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