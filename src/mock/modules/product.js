import Mock from 'mockjs'
import { getUrlParams } from '../utils'

// 生成随机商品分类
const categories = [
  { id: 'electronics', name: '电子数码' },
  { id: 'books', name: '图书教材' },
  { id: 'clothing', name: '服装鞋包' },
  { id: 'sports', name: '运动户外' },
  { id: 'beauty', name: '美妆日化' },
  { id: 'furniture', name: '家具家电' },
  { id: 'tickets', name: '门票卡券' },
  { id: 'stationery', name: '文具办公' },
  { id: 'toys', name: '玩具乐器' },
  { id: 'bicycles', name: '自行车' },
  { id: 'others', name: '其他' }
]

// 生成随机商品数据
const products = Mock.mock({
  'list|100': [{
    'id|+1': 1,
    'title': '@ctitle(5, 20)',
    'description': '@cparagraph(1, 3)',
    'price|10-9999': 100,
    'originalPrice|+1': function() {
      return this.price + Math.floor(Math.random() * 2000);
    },
    'categoryId': function() {
      return Mock.Random.pick(categories.map(c => c.id).concat('all'));
    },
    'category': function() {
      return categories.find(c => c.id === this.categoryId) || { id: 'all', name: '全部' };
    },
    'condition|1': ['全新', '几乎全新', '轻微使用痕迹', '使用良好', '使用正常'],
    'images': function() {
      const count = Mock.Random.integer(1, 5);
      const images = [];
      for (let i = 0; i < count; i++) {
        images.push(`https://picsum.photos/id/${Mock.Random.integer(1, 200)}/300/300`);
      }
      return images;
    },
    'viewCount|100-9999': 1000,
    'favoriteCount|0-100': 0,
    'status|1': ['published', 'sold', 'removed'],
    'location': '@city',
    'createTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
    'updateTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
    'seller': {
      'id|1-20': 1,
      'nickname': '@cname',
      'avatar': function() {
        return `https://api.dicebear.com/6.x/avataaars/svg?seed=${Mock.Random.word(5)}`;
      },
      'rating|3.5-5.0': 4.5
    }
  }]
}).list

// 用户收藏商品记录
const favorites = []

// 商品相关mock接口
export default {
  // 获取商品列表
  'GET /api/product/list': (options) => {
    const params = getUrlParams(options.url)
    
    let filteredProducts = [...products]
    
    // 分类过滤
    if (params.category && params.category !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.categoryId === params.category)
    }
    
    // 关键词搜索
    if (params.keywords) {
      const keywords = params.keywords.toLowerCase()
      filteredProducts = filteredProducts.filter(p => 
        p.title.toLowerCase().includes(keywords) || 
        p.description.toLowerCase().includes(keywords)
      )
    }
    
    // 价格区间过滤
    if (params.minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= parseInt(params.minPrice))
    }
    if (params.maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= parseInt(params.maxPrice))
    }
    
    // 排序
    if (params.sort) {
      switch (params.sort) {
        case 'price-asc':
          filteredProducts.sort((a, b) => a.price - b.price)
          break
        case 'price-desc':
          filteredProducts.sort((a, b) => b.price - a.price)
          break
        case 'latest':
          filteredProducts.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
          break
        case 'hot':
          filteredProducts.sort((a, b) => b.viewCount - a.viewCount)
          break
        default:
          // 默认按最新排序
          filteredProducts.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      }
    } else {
      // 默认按最新排序
      filteredProducts.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    }
    
    // 分页
    const page = parseInt(params.page) || 1
    const pageSize = parseInt(params.pageSize) || 10
    const limit = parseInt(params.limit) || pageSize
    
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + limit
    
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        total: filteredProducts.length,
        page,
        pageSize,
        list: paginatedProducts
      }
    }
  },
  
  // 获取商品详情
  'GET /api/product/detail/:id': (options) => {
    const id = parseInt(options.url.match(/\/detail\/(\d+)/)[1])
    const product = products.find(p => p.id === id)
    
    if (!product) {
      return {
        code: 404,
        message: '商品不存在',
        data: null
      }
    }
    
    // 增加浏览次数
    product.viewCount += 1
    
    return {
      code: 200,
      message: '获取成功',
      data: product
    }
  },
  
  // 获取商品分类
  'GET /api/product/categories': () => {
    return {
      code: 200,
      message: '获取成功',
      data: [
        { id: 'all', name: '全部' },
        ...categories
      ]
    }
  },
  
  // 发布商品
  'POST /api/product/publish': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    const productData = JSON.parse(options.body)
    
    // 创建新商品
    const newProduct = {
      id: products.length + 1,
      ...productData,
      viewCount: 0,
      favoriteCount: 0,
      status: 'published',
      createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      seller: {
        id: 1, // 假设当前登录用户ID为1
        nickname: '当前用户',
        avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=user1`,
        rating: 5.0
      }
    }
    
    products.push(newProduct)
    
    return {
      code: 200,
      message: '发布成功',
      data: newProduct
    }
  },
  
  // 更新商品
  'PUT /api/product/:id': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    const id = parseInt(options.url.match(/\/product\/(\d+)/)[1])
    const productIndex = products.findIndex(p => p.id === id)
    
    if (productIndex === -1) {
      return {
        code: 404,
        message: '商品不存在',
        data: null
      }
    }
    
    const productData = JSON.parse(options.body)
    
    // 检查是否是商品的发布者
    if (products[productIndex].seller.id !== 1) { // 假设当前用户ID为1
      return {
        code: 403,
        message: '无权限修改此商品',
        data: null
      }
    }
    
    // 更新商品信息
    products[productIndex] = {
      ...products[productIndex],
      ...productData,
      updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    }
    
    return {
      code: 200,
      message: '更新成功',
      data: products[productIndex]
    }
  },
  
  // 删除商品
  'DELETE /api/product/:id': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    const id = parseInt(options.url.match(/\/product\/(\d+)/)[1])
    const productIndex = products.findIndex(p => p.id === id)
    
    if (productIndex === -1) {
      return {
        code: 404,
        message: '商品不存在',
        data: null
      }
    }
    
    // 检查是否是商品的发布者
    if (products[productIndex].seller.id !== 1) { // 假设当前用户ID为1
      return {
        code: 403,
        message: '无权限删除此商品',
        data: null
      }
    }
    
    // 标记商品为已删除
    products[productIndex].status = 'removed'
    
    return {
      code: 200,
      message: '删除成功',
      data: null
    }
  },
  
  // 收藏/取消收藏商品
  'POST /api/product/favorite/:id': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    const id = parseInt(options.url.match(/\/favorite\/(\d+)/)[1])
    const productIndex = products.findIndex(p => p.id === id)
    
    if (productIndex === -1) {
      return {
        code: 404,
        message: '商品不存在',
        data: null
      }
    }
    
    const { isFavorite } = JSON.parse(options.body)
    const userId = 1 // 假设当前用户ID为1
    
    // 查找现有收藏记录
    const favoriteIndex = favorites.findIndex(f => f.productId === id && f.userId === userId)
    
    if (isFavorite) {
      // 添加收藏
      if (favoriteIndex === -1) {
        favorites.push({
          id: favorites.length + 1,
          userId,
          productId: id,
          createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
        })
        
        // 增加商品收藏数
        products[productIndex].favoriteCount += 1
      }
    } else {
      // 取消收藏
      if (favoriteIndex !== -1) {
        favorites.splice(favoriteIndex, 1)
        
        // 减少商品收藏数
        products[productIndex].favoriteCount = Math.max(0, products[productIndex].favoriteCount - 1)
      }
    }
    
    return {
      code: 200,
      message: isFavorite ? '收藏成功' : '取消收藏成功',
      data: {
        isFavorite,
        favoriteCount: products[productIndex].favoriteCount
      }
    }
  },
  
  // 获取用户收藏的商品列表
  'GET /api/product/favorites': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    const userId = 1 // 假设当前用户ID为1
    
    // 获取用户的收藏记录
    const userFavorites = favorites.filter(f => f.userId === userId)
    
    // 获取收藏的商品详情
    const favoriteProducts = userFavorites.map(f => {
      const product = products.find(p => p.id === f.productId)
      return product
    }).filter(Boolean) // 过滤掉不存在的商品
    
    // 分页
    const params = getUrlParams(options.url)
    const page = parseInt(params.page) || 1
    const pageSize = parseInt(params.pageSize) || 10
    
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    const paginatedProducts = favoriteProducts.slice(startIndex, endIndex)
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        total: favoriteProducts.length,
        page,
        pageSize,
        list: paginatedProducts
      }
    }
  },
  
  // 获取用户发布的商品列表
  'GET /api/product/user': (options) => {
    const params = getUrlParams(options.url)
    
    let userId = parseInt(params.userId) || 1 // 默认为当前用户
    
    // 获取用户发布的商品
    let userProducts = products.filter(p => p.seller.id === userId)
    
    // 状态过滤
    if (params.status) {
      userProducts = userProducts.filter(p => p.status === params.status)
    }
    
    // 排序
    userProducts.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    
    // 分页
    const page = parseInt(params.page) || 1
    const pageSize = parseInt(params.pageSize) || 10
    
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    const paginatedProducts = userProducts.slice(startIndex, endIndex)
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        total: userProducts.length,
        page,
        pageSize,
        list: paginatedProducts
      }
    }
  }
}