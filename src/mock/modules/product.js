import Mock from 'mockjs'
import { getUrlParams } from '../utils'

// 创建模拟数据
const mockProducts = Mock.mock({
  'list|20': [{
    'id|+1': 1,
    'title': '@ctitle(5, 20)',
    'description': '@cparagraph(3, 5)',
    'price|1-9999': 100,
    'originalPrice|+1000': 2000,
    'images|1-5': ['@image("300x300", "#4A7BF7", "#FFF", "商品")'],
    'category|1': ['数码电子', '服装', '书籍', '美妆', '家具', '其他'],
    'condition|1': ['全新', '几乎全新', '轻微使用痕迹', '使用正常'],
    'deliveryMethod|1': ['线下自取', '校内配送', '快递邮寄'],
    'location': '@city(true)',
    'createTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
    'status|1': ['在售', '已售出', '已下架'],
    'viewCount|100-5000': 100,
    'contactInfo': {
      'phone': /1[3-9]\d{9}/,
      'wechat': /wx_\w{6,12}/,
      'showPhone|1': [true, false],
      'showWechat|1': [true, false]
    },
    'isLiked|1': [true, false],
    'seller': {
      'id|+1': 10000,
      'name': '@cname',
      'avatar': '@image("100x100", "#4A7BF7", "#FFF", "用户")',
      'school': '@ctitle(4, 8)大学',
      'verified|1': [true, false],
      'goodRate|70-100': 70,
      'otherProducts|0-4': [{
        'id|+1': 1000,
        'title': '@ctitle(5, 15)',
        'images|1-3': ['@image("200x200", "#4A7BF7", "#FFF", "其他商品")'],
        'price|1-9999': 100,
        'status|1': ['在售', '已售出', '已下架']
      }]
    },
    'comments|0-10': [{
      'id|+1': 1,
      'content': '@cparagraph(1, 3)',
      'createTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'likeCount|0-50': 0,
      'isLiked|1': [true, false],
      'author': {
        'id|+1': 20000,
        'name': '@cname',
        'avatar': '@image("100x100", "#4A7BF7", "#FFF", "评论者")'
      },
      'replies|0-3': [{
        'id|+1': 1,
        'content': '@cparagraph(1, 2)',
        'createTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
        'author': {
          'id|+1': 30000,
          'name': '@cname',
          'avatar': '@image("100x100", "#4A7BF7", "#FFF", "回复者")'
        },
        'replyTo': {
          'id': '@integer(20000, 30000)',
          'name': '@cname'
        }
      }]
    }],
    'similarProducts|0-5': [{
      'id|+1': 2000,
      'title': '@ctitle(5, 15)',
      'images|1-3': ['@image("200x200", "#4A7BF7", "#FFF", "相似商品")'],
      'price|1-9999': 100,
      'description': '@csentence(10, 20)'
    }]
  }]
})

// 获取商品列表
Mock.mock(/\/api\/product\/list/, 'get', (options) => {
  const params = getUrlParams(options.url)
  const { page = 1, limit = 10, category, sort, keywords } = params
  
  let list = mockProducts.list
  
  // 筛选分类
  if (category) {
    list = list.filter(item => item.category === category)
  }
  
  // 搜索关键词
  if (keywords) {
    const reg = new RegExp(keywords, 'i')
    list = list.filter(item => reg.test(item.title) || reg.test(item.description))
  }
  
  // 排序
  if (sort) {
    switch (sort) {
      case 'price-asc':
        list = list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list = list.sort((a, b) => b.price - a.price)
        break
      case 'latest':
        list = list.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        break
      case 'hot':
        list = list.sort((a, b) => b.viewCount - a.viewCount)
        break
    }
  }
  
  // 分页
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + parseInt(limit)
  const pageList = list.slice(startIndex, endIndex)
  
  return {
    code: 200,
    message: '获取成功',
    data: {
      total: list.length,
      page: parseInt(page),
      pageSize: parseInt(limit),
      list: pageList
    }
  }
})

// 获取商品详情
Mock.mock(/\/api\/product\/detail\/\d+/, 'get', (options) => {
  const id = options.url.match(/\/detail\/(\d+)/)[1]
  const item = mockProducts.list.find(item => item.id === parseInt(id))
  
  if (!item) {
    return {
      code: 404,
      message: '商品不存在'
    }
  }
  
  // 增加查看次数
  item.viewCount += 1
  
  return {
    code: 200,
    message: '获取成功',
    data: item
  }
})

// 获取用户发布的商品
Mock.mock(/\/api\/product\/user\/\d+/, 'get', (options) => {
  const userId = options.url.match(/\/user\/(\d+)/)[1]
  const params = getUrlParams(options.url)
  const { page = 1, limit = 10 } = params
  
  const list = mockProducts.list.filter(item => item.seller.id === parseInt(userId))
  
  // 分页
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + parseInt(limit)
  const pageList = list.slice(startIndex, endIndex)
  
  return {
    code: 200,
    message: '获取成功',
    data: {
      total: list.length,
      page: parseInt(page),
      pageSize: parseInt(limit),
      list: pageList
    }
  }
})

// 收藏商品
Mock.mock(/\/api\/product\/\d+\/favorite/, 'post', (options) => {
  const id = options.url.match(/\/product\/(\d+)\/favorite/)[1]
  const item = mockProducts.list.find(item => item.id === parseInt(id))
  
  if (!item) {
    return {
      code: 404,
      message: '商品不存在'
    }
  }
  
  item.isLiked = true
  
  return {
    code: 200,
    message: '收藏成功',
    data: {
      isLiked: true
    }
  }
})

// 取消收藏商品
Mock.mock(/\/api\/product\/\d+\/unfavorite/, 'post', (options) => {
  const id = options.url.match(/\/product\/(\d+)\/unfavorite/)[1]
  const item = mockProducts.list.find(item => item.id === parseInt(id))
  
  if (!item) {
    return {
      code: 404,
      message: '商品不存在'
    }
  }
  
  item.isLiked = false
  
  return {
    code: 200,
    message: '已取消收藏',
    data: {
      isLiked: false
    }
  }
})

// 评论商品
Mock.mock(/\/api\/product\/\d+\/comment/, 'post', (options) => {
  const id = options.url.match(/\/product\/(\d+)\/comment/)[1]
  const { content, replyToId } = JSON.parse(options.body)
  const item = mockProducts.list.find(item => item.id === parseInt(id))
  
  if (!item) {
    return {
      code: 404,
      message: '商品不存在'
    }
  }
  
  // 模拟新评论
  const newComment = Mock.mock({
    'id': '@integer(1000, 9999)',
    'content': content,
    'createTime': '@now',
    'likeCount': 0,
    'isLiked': false,
    'author': {
      'id': '@integer(1000, 9999)',
      'name': '@cname',
      'avatar': '@image("100x100", "#4A7BF7", "#FFF", "评论者")'
    }
  })
  
  // 如果是回复
  if (replyToId) {
    newComment.replyTo = {
      id: replyToId,
      name: Mock.Random.cname()
    }
  }
  
  // 添加到评论列表
  if (!item.comments) {
    item.comments = []
  }
  
  item.comments.unshift(newComment)
  
  return {
    code: 200,
    message: '评论成功',
    data: newComment
  }
})

// 导出模块
export default mockProducts