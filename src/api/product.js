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
 * @param {number} params.pageSize 每页数量
 * @param {string} params.category 分类
 * @param {string} params.keyword 关键词
 * @param {string} params.sort 排序方式 (latest/price-asc/price-desc)
 * @returns {Promise} Promise对象
 */
export function getProductList(params) {
  return request({
    url: '/api/product/list',
    method: 'get',
    params
  })
}

/**
 * 获取商品详情
 * @param {number} id 商品ID
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
 * 发布商品
 * @param {Object} data 商品数据
 * @param {string} data.title 商品标题
 * @param {string} data.category 商品分类
 * @param {number} data.price 售价
 * @param {number} [data.originalPrice] 原价
 * @param {string} data.condition 商品成色(new/like_new/slight_used/used/heavily_used)
 * @param {string} data.description 商品描述
 * @param {Array<string>} data.imageUrls 图片URL数组
 * @param {Array<string>} data.deliveryMethods 交易方式数组(meetup/shipping)
 * @param {Object} [data.location] 交易地点(当面交易时必填)
 * @param {string} data.location.address 地址描述
 * @param {Object} [data.location.coordinates] 坐标
 * @param {number} data.location.coordinates.lng 经度
 * @param {number} data.location.coordinates.lat 纬度
 * @param {Object} data.contactInfo 联系方式
 * @param {string} data.contactInfo.phone 手机号
 * @param {string} [data.contactInfo.wechat] 微信号
 * @returns {Promise} Promise对象
 */
export function publishProduct(data) {
  console.log('调用发布商品API:', data);
  
  return request({
    url: 'http://localhost:8888/api/product/publish',
    method: 'post',
    data
  })
}

/**
 * 更新商品
 * @param {number} id 商品ID
 * @param {Object} data 商品更新数据
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
 * @param {number} id 商品ID
 * @returns {Promise} Promise对象
 */
export function deleteProduct(id) {
  return request({
    url: `/api/product/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 收藏商品
 * @param {number} id 商品ID
 * @returns {Promise} Promise对象
 */
export function favoriteProduct(id) {
  return request({
    url: `/api/product/favorite/${id}`,
    method: 'post'
  })
}

/**
 * 获取用户收藏的商品列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
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
 * 获取用户发布的商品列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {number} [params.userId] 用户ID，不传则获取当前登录用户的商品
 * @returns {Promise} Promise对象
 */
export function getUserProducts(params) {
  return request({
    url: '/api/product/user',
    method: 'get',
    params
  })
}

/**
 * 搜索商品
 * @param {Object} params 搜索参数
 * @param {string} params.keyword 关键词
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} [params.category] 分类
 * @param {string} [params.sort] 排序方式
 * @returns {Promise} Promise对象
 */
export function searchProducts(params) {
  return request({
    url: '/api/product/search',
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