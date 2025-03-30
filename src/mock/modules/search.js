import Mock from 'mockjs'
import { getUrlParams, getRequestBody, delay } from '../utils'
import articleModule from './article'
import productModule from './product'
import userModule from './user'

// 获取各模块数据
const allArticles = articleModule ? articleModule.allArticles || [] : []
const allProducts = productModule ? productModule.allProducts || [] : []
const allUsers = userModule ? userModule.allUsers || [] : []

// 生成搜索历史记录
const generateSearchHistory = (count = 20) => {
  return Mock.mock({
    [`list|${count}`]: [{
      'id|+1': 1,
      'keyword': '@ctitle(2, 8)',
      'type|1': ['all', 'article', 'product', 'user', 'lost_found'],
      'count|1-100': 50,
      'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")'
    }]
  }).list
}

// 搜索历史记录
const searchHistory = generateSearchHistory()

// 热门搜索
const hotSearches = [
  { keyword: '校园卡', count: 1253 },
  { keyword: '二手书', count: 987 },
  { keyword: '考研资料', count: 876 },
  { keyword: '自习室', count: 654 },
  { keyword: '兼职', count: 543 },
  { keyword: '交友', count: 432 },
  { keyword: '电动车', count: 321 },
  { keyword: '共享单车', count: 210 },
  { keyword: '宿舍', count: 198 },
  { keyword: '食堂', count: 187 }
]

// 执行综合搜索
const performSearch = (keyword, type = 'all', page = 1, limit = 10) => {
  if (!keyword) {
    return {
      articles: { list: [], total: 0 },
      products: { list: [], total: 0 },
      users: { list: [], total: 0 }
    }
  }

  const regex = new RegExp(keyword, 'i')
  let matchedArticles = []
  let matchedProducts = []
  let matchedUsers = []

  // 搜索文章
  if (type === 'all' || type === 'article') {
    matchedArticles = allArticles.filter(article => 
      regex.test(article.title) || 
      regex.test(article.brief) || 
      regex.test(article.content)
    )
  }

  // 搜索商品
  if (type === 'all' || type === 'product') {
    matchedProducts = allProducts.filter(product => 
      regex.test(product.title) || 
      regex.test(product.brief) || 
      regex.test(product.description)
    )
  }

  // 搜索用户
  if (type === 'all' || type === 'user') {
    matchedUsers = allUsers.filter(user => 
      regex.test(user.nickname) || 
      regex.test(user.username) || 
      (user.bio && regex.test(user.bio))
    )
  }

  // 如果是综合搜索，只返回每种类型的前几条
  if (type === 'all') {
    return {
      articles: { 
        list: matchedArticles.slice(0, 3),
        total: matchedArticles.length
      },
      products: { 
        list: matchedProducts.slice(0, 3),
        total: matchedProducts.length
      },
      users: { 
        list: matchedUsers.slice(0, 3),
        total: matchedUsers.length
      }
    }
  }

  // 如果是特定类型搜索，进行分页
  const start = (page - 1) * limit
  const end = start + limit

  if (type === 'article') {
    return {
      articles: { 
        list: matchedArticles.slice(start, end),
        total: matchedArticles.length
      },
      products: { list: [], total: 0 },
      users: { list: [], total: 0 }
    }
  } else if (type === 'product') {
    return {
      articles: { list: [], total: 0 },
      products: { 
        list: matchedProducts.slice(start, end),
        total: matchedProducts.length
      },
      users: { list: [], total: 0 }
    }
  } else if (type === 'user') {
    return {
      articles: { list: [], total: 0 },
      products: { list: [], total: 0 },
      users: { 
        list: matchedUsers.slice(start, end),
        total: matchedUsers.length
      }
    }
  }

  return {
    articles: { list: [], total: 0 },
    products: { list: [], total: 0 },
    users: { list: [], total: 0 }
  }
}

// Mock 搜索接口
Mock.mock(/\/api\/search/, 'get', (options) => {
  const params = getUrlParams(options.url)
  const keyword = params.keyword
  const type = params.type || 'all'
  const page = parseInt(params.page) || 1
  const limit = parseInt(params.limit) || 10

  if (!keyword) {
    return {
      code: 400,
      message: '请输入搜索关键词'
    }
  }

  // 记录搜索历史
  const existingIndex = searchHistory.findIndex(item => item.keyword === keyword && item.type === type)
  if (existingIndex >= 0) {
    searchHistory[existingIndex].count += 1
    searchHistory[existingIndex].createdAt = new Date().toISOString()
  } else {
    searchHistory.unshift({
      id: searchHistory.length + 1,
      keyword,
      type,
      count: 1,
      createdAt: new Date().toISOString()
    })
  }

  // 执行搜索
  const searchResults = performSearch(keyword, type, page, limit)
  
  delay(300)

  return {
    code: 200,
    message: '搜索成功',
    data: {
      keyword,
      type,
      page,
      limit,
      ...searchResults
    }
  }
})

// Mock 获取搜索建议接口
Mock.mock(/\/api\/search\/suggest/, 'get', (options) => {
  const params = getUrlParams(options.url)
  const keyword = params.keyword

  if (!keyword || keyword.length < 2) {
    return {
      code: 200,
      message: '获取搜索建议成功',
      data: []
    }
  }

  const regex = new RegExp(keyword, 'i')
  
  // 从文章标题中提取建议
  const articleSuggestions = allArticles
    .filter(article => regex.test(article.title))
    .slice(0, 3)
    .map(article => ({
      type: 'article',
      id: article.id,
      title: article.title,
      highlight: article.title.replace(regex, match => `<em>${match}</em>`)
    }))

  // 从商品标题中提取建议
  const productSuggestions = allProducts
    .filter(product => regex.test(product.title))
    .slice(0, 3)
    .map(product => ({
      type: 'product',
      id: product.id,
      title: product.title,
      highlight: product.title.replace(regex, match => `<em>${match}</em>`),
      price: product.price
    }))

  // 从用户昵称中提取建议
  const userSuggestions = allUsers
    .filter(user => regex.test(user.nickname) || regex.test(user.username))
    .slice(0, 3)
    .map(user => ({
      type: 'user',
      id: user.id,
      title: user.nickname,
      highlight: user.nickname.replace(regex, match => `<em>${match}</em>`),
      avatar: user.avatar
    }))

  // 合并建议
  const suggestions = [
    ...articleSuggestions,
    ...productSuggestions,
    ...userSuggestions
  ]

  delay(100)

  return {
    code: 200,
    message: '获取搜索建议成功',
    data: suggestions
  }
})

// Mock 获取热门搜索接口
Mock.mock(/\/api\/search\/hot/, 'get', () => {
  delay(100)

  return {
    code: 200,
    message: '获取热门搜索成功',
    data: hotSearches
  }
})

// Mock 获取搜索历史接口
Mock.mock(/\/api\/search\/history/, 'get', (options) => {
  const params = getUrlParams(options.url)
  const limit = parseInt(params.limit) || 10

  // 按时间排序并限制数量
  const sortedHistory = [...searchHistory]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)

  delay(100)

  return {
    code: 200,
    message: '获取搜索历史成功',
    data: sortedHistory
  }
})

// Mock 清空搜索历史接口
Mock.mock(/\/api\/search\/history\/clear/, 'post', () => {
  // 清空历史记录
  searchHistory.length = 0
  
  delay(100)

  return {
    code: 200,
    message: '搜索历史已清空'
  }
})

// Mock 删除单条搜索历史接口
Mock.mock(/\/api\/search\/history\/delete/, 'post', (options) => {
  const body = getRequestBody(options)
  const id = body.id
  
  if (!id) {
    return {
      code: 400,
      message: '请指定要删除的历史记录ID'
    }
  }
  
  const index = searchHistory.findIndex(item => item.id === parseInt(id))
  if (index === -1) {
    return {
      code: 404,
      message: '历史记录不存在'
    }
  }
  
  // 删除指定记录
  searchHistory.splice(index, 1)
  
  delay(100)
  
  return {
    code: 200,
    message: '历史记录已删除'
  }
})

export default {
  searchHistory,
  hotSearches,
  performSearch
} 