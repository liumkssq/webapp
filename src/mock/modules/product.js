import Mock from 'mockjs'

const Random = Mock.Random

const products = []
for (let i = 0; i < 20; i++) {
  products.push(Mock.mock({
    id: '@guid',
    title: '@ctitle(5, 10)',
    description: '@cparagraph(1, 3)',
    price: '@float(0, 1000, 2, 2)',
    originalPrice: '@float(0, 2000, 2, 2)',
    'condition|1': ['全新', '几乎全新', '轻微使用痕迹', '使用正常', '有明显使用痕迹'],
    images: () => {
      const count = Random.integer(1, 5)
      const images = []
      for (let j = 0; j < count; j++) {
        images.push(Random.image('400x400', Random.color(), Random.word(2, 6)))
      }
      return images
    },
    category: '@pick(["电子产品", "图书", "衣物", "化妆品", "文具", "其他"])',
    seller: {
      id: '@id',
      name: '@cname',
      avatar: Random.image('100x100', Random.color(), Random.word(2)),
      rating: '@float(1, 5, 1, 1)'
    },
    location: '@county(true)',
    createTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    updateTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    'status|1': ['在售', '已售出', '已下架'],
    views: '@integer(0, 1000)',
    favorites: '@integer(0, 200)',
    contactInfo: {
      phone: /1[3-9]\d{9}/,
      wechat: '@word(5, 10)'
    },
    deliveryMethod: () => {
      return Random.pick(['邮寄', '当面交易', '均可'], 1, 2)
    },
    tags: () => {
      const count = Random.integer(0, 3)
      const tags = []
      for (let j = 0; j < count; j++) {
        tags.push(Random.cword(2, 4))
      }
      return tags
    }
  }))
}

export default {
  // 获取商品列表
  'GET /api/product/list': (options) => {
    const { page = 1, size = 10, sort, category } = JSON.parse(options.body || '{}')
    
    let result = [...products]
    
    // 根据分类筛选
    if (category) {
      result = result.filter(item => item.category === category)
    }
    
    // 根据排序方式排序
    if (sort === 'priceLow') {
      result.sort((a, b) => a.price - b.price)
    } else if (sort === 'priceHigh') {
      result.sort((a, b) => b.price - a.price)
    } else if (sort === 'newest') {
      result.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    } else if (sort === 'popularity') {
      result.sort((a, b) => b.views - a.views)
    }
    
    // 分页处理
    const startIndex = (page - 1) * size
    const endIndex = startIndex + parseInt(size)
    const pageResult = result.slice(startIndex, endIndex)
    
    return {
      code: 200,
      data: {
        list: pageResult,
        total: result.length,
        page: parseInt(page),
        size: parseInt(size)
      },
      message: 'success'
    }
  },
  
  // 获取商品详情
  'GET /api/product/:id': (options) => {
    const { id } = options.url.match(/\/api\/product\/([^/]+)/).slice(1)
    const product = products.find(item => item.id === id)
    
    if (product) {
      return {
        code: 200,
        data: product,
        message: 'success'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '商品不存在'
      }
    }
  },
  
  // 发布商品
  'POST /api/product/create': (options) => {
    const body = JSON.parse(options.body)
    
    const product = Mock.mock({
      id: '@guid',
      ...body,
      seller: {
        id: '@id',
        name: '@cname',
        avatar: Random.image('100x100', Random.color(), Random.word(2)),
        rating: '@float(1, 5, 1, 1)'
      },
      createTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      updateTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      views: 0,
      favorites: 0,
      status: '在售'
    })
    
    products.unshift(product)
    
    return {
      code: 200,
      data: product,
      message: '发布商品成功'
    }
  },
  
  // 更新商品
  'PUT /api/product/:id': (options) => {
    const { id } = options.url.match(/\/api\/product\/([^/]+)/).slice(1)
    const body = JSON.parse(options.body)
    
    const index = products.findIndex(item => item.id === id)
    
    if (index > -1) {
      products[index] = {
        ...products[index],
        ...body,
        updateTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
      }
      
      return {
        code: 200,
        data: products[index],
        message: '更新商品成功'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '商品不存在'
      }
    }
  },
  
  // 删除商品
  'DELETE /api/product/:id': (options) => {
    const { id } = options.url.match(/\/api\/product\/([^/]+)/).slice(1)
    
    const index = products.findIndex(item => item.id === id)
    
    if (index > -1) {
      const product = products[index]
      products.splice(index, 1)
      
      return {
        code: 200,
        data: product,
        message: '删除商品成功'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '商品不存在'
      }
    }
  }
}