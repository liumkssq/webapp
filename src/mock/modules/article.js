import Mock from 'mockjs'
import { getUrlParams, getRequestBody, delay } from '../utils'

const Random = Mock.Random

// 生成作者数据
const generateAuthor = (id, isCurrentUser = false) => {
  if (isCurrentUser) {
    return {
      id: 1,
      name: '测试用户',
      avatar: Random.image('100x100', Random.color(), Random.color(), 'png', 'TU'),
      school: '测试大学',
      bio: '这是一个测试账号'
    }
  }
  
  return {
    id,
    name: Random.cname(),
    avatar: Random.image('100x100', Random.color(), Random.color(), 'png', Random.first()),
    school: Random.pick(['北京大学', '清华大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '武汉大学', '中山大学']),
    bio: Random.csentence(5, 20)
  }
}

// 生成文章数据
const generateArticles = (count = 20) => {
  return Mock.mock({
    [`list|${count}`]: [{
      'id|+1': 1,
      'title': '@ctitle(10, 30)',
      'content': '@cparagraph(10, 20)',
      'brief': '@cparagraph(1, 3)',
      'coverImage': '@image("300x200", "#4A7BF7")',
      'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'updatedAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'category': () => {
        const categories = ['校园生活', '学习交流', '兴趣爱好', '活动组织', '职业发展', '情感交流', '资源共享']
        return categories[Math.floor(Math.random() * categories.length)]
      },
      'tags': () => {
        const tags = ['校园', '学习', '生活', '考试', '实习', '就业', '美食', '旅行', '电影', '音乐', '社团', '运动']
        const count = Math.floor(Math.random() * 4) + 1
        const result = []
        for (let i = 0; i < count; i++) {
          const tag = tags[Math.floor(Math.random() * tags.length)]
          if (!result.includes(tag)) {
            result.push(tag)
          }
        }
        return result
      },
      'viewCount|100-5000': 1000,
      'likeCount|0-500': 100,
      'commentCount|0-100': 20,
      'isLiked|1-2': true,
      'isFavorite|1-2': true,
      'status|1': ['published', 'draft'],
      'author': {
        'id|1-100': 1,
        'username': '@word(5, 10)',
        'nickname': '@cname',
        'avatar': '@image("100x100", "#ffcc33", "#FFF", "Avatar")'
      }
    }]
  }).list
}

// 所有文章数据
const allArticles = generateArticles(50)

// 热门文章
const hotArticles = allArticles.slice(0, 8).map(article => ({
  ...article,
  viewCount: article.viewCount + 2000,
  likeCount: article.likeCount + 200
}))

// 最新文章
const latestArticles = [...allArticles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

// 文章分类
const articleCategories = [
  { id: 1, name: '校园生活', count: 125 },
  { id: 2, name: '学习交流', count: 98 },
  { id: 3, name: '兴趣爱好', count: 76 },
  { id: 4, name: '活动组织', count: 45 },
  { id: 5, name: '职业发展', count: 67 },
  { id: 6, name: '情感交流', count: 34 },
  { id: 7, name: '资源共享', count: 56 }
]

// 生成文章评论
const generateComments = (articleId, count = 10) => {
  return Mock.mock({
    [`list|${count}`]: [{
      'id|+1': 1,
      'articleId': articleId,
      'content': '@cparagraph(1, 3)',
      'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'likeCount|0-50': 0,
      'isLiked|1-2': true,
      'replyCount|0-10': 0,
      'user': {
        'id|1-100': 1,
        'username': '@word(5, 10)',
        'nickname': '@cname',
        'avatar': '@image("50x50", "#4A7BF7", "#FFF", "Avatar")'
      },
      'replies|0-5': [{
        'id|+1': 100,
        'commentId': function() {
          return this.id
        },
        'content': '@cparagraph(1, 2)',
        'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
        'user': {
          'id|1-100': 1,
          'username': '@word(5, 10)',
          'nickname': '@cname',
          'avatar': '@image("50x50", "#ffcc33", "#FFF", "Avatar")'
        },
        'replyTo': {
          'id|1-100': 1,
          'username': '@word(5, 10)',
          'nickname': '@cname'
        }
      }]
    }]
  }).list
}

// 所有评论
const allComments = {}
allArticles.forEach(article => {
  allComments[article.id] = generateComments(article.id, Math.floor(Math.random() * 15) + 5)
})

// Mock 文章列表接口
Mock.mock(/\/api\/article\/list/, 'get', (options) => {
  const params = getUrlParams(options.url)
  const page = parseInt(params.page) || 1
  const limit = parseInt(params.limit) || 10
  const category = params.category
  const keyword = params.keyword
  const sort = params.sort || 'latest'
  
  // 过滤数据
  let filteredArticles = [...allArticles]
  
  // 根据分类过滤
  if (category && category !== 'all') {
    filteredArticles = filteredArticles.filter(article => article.category === category)
  }
  
  // 根据关键词过滤
  if (keyword) {
    const regex = new RegExp(keyword, 'i')
    filteredArticles = filteredArticles.filter(article => 
      regex.test(article.title) || 
      regex.test(article.brief) || 
      regex.test(article.content)
    )
  }
  
  // 根据排序字段排序
  if (sort === 'latest') {
    filteredArticles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else if (sort === 'hot') {
    filteredArticles.sort((a, b) => b.viewCount - a.viewCount)
  } else if (sort === 'comments') {
    filteredArticles.sort((a, b) => b.commentCount - a.commentCount)
  }
  
  // 分页处理
  const start = (page - 1) * limit
  const end = start + limit
  const pagedArticles = filteredArticles.slice(start, end)
  
  // 延迟响应
  delay(500)
  
  return {
    code: 200,
    message: '获取文章列表成功',
    data: {
      total: filteredArticles.length,
      page,
      limit,
      list: pagedArticles
    }
  }
})

// Mock 文章详情接口
Mock.mock(/\/api\/article\/detail\/\d+/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/detail\/(\d+)/)[1])
  const article = allArticles.find(a => a.id === id)
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 为文章详情生成更丰富的内容
  const fullArticle = {
    ...article,
    content: Mock.mock('@cparagraph(30, 50)'),
    // 添加相关文章
    relatedArticles: allArticles
      .filter(a => a.id !== id && a.category === article.category)
      .slice(0, 5)
      .map(({ id, title, coverImage, viewCount, createdAt }) => ({ id, title, coverImage, viewCount, createdAt }))
  }
  
  delay(300)
  
  return {
    code: 200,
    message: '获取文章详情成功',
    data: fullArticle
  }
})

// Mock 获取文章分类接口
Mock.mock(/\/api\/article\/categories/, 'get', () => {
  delay(200)
  
  return {
    code: 200,
    message: '获取文章分类成功',
    data: articleCategories
  }
})

// Mock 发布文章接口
Mock.mock(/\/api\/article\/publish/, 'post', (options) => {
  const body = getRequestBody(options)
  
  if (!body.title || !body.content) {
    return {
      code: 400,
      message: '标题和内容不能为空'
    }
  }
  
  const newArticle = {
    id: allArticles.length + 1,
    title: body.title,
    content: body.content,
    brief: body.brief || body.content.slice(0, 100) + '...',
    coverImage: body.coverImage || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: body.category || '校园生活',
    tags: body.tags || [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    isFavorite: false,
    status: body.status || 'published',
    author: {
      id: 1, // 当前登录用户
      username: 'current_user',
      nickname: '当前用户',
      avatar: Mock.Random.image('100x100', '#4A7BF7', '#FFF', 'Avatar')
    }
  }
  
  allArticles.unshift(newArticle)
  
  delay(500)
  
  return {
    code: 200,
    message: '发布文章成功',
    data: newArticle
  }
})

// Mock 更新文章接口
Mock.mock(/\/api\/article\/update\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/update\/(\d+)/)[1])
  const body = getRequestBody(options)
  const article = allArticles.find(a => a.id === id)
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 更新文章
  Object.assign(article, {
    title: body.title || article.title,
    content: body.content || article.content,
    brief: body.brief || (body.content ? body.content.slice(0, 100) + '...' : article.brief),
    coverImage: body.coverImage || article.coverImage,
    updatedAt: new Date().toISOString(),
    category: body.category || article.category,
    tags: body.tags || article.tags,
    status: body.status || article.status
  })
  
  delay(300)
  
  return {
    code: 200,
    message: '更新文章成功',
    data: article
  }
})

// Mock 删除文章接口
Mock.mock(/\/api\/article\/delete\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/delete\/(\d+)/)[1])
  const index = allArticles.findIndex(a => a.id === id)
  
  if (index === -1) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 删除文章
  allArticles.splice(index, 1)
  
  delay(200)
  
  return {
    code: 200,
    message: '删除文章成功'
  }
})

// Mock 获取文章评论接口
Mock.mock(/\/api\/article\/comments\/\d+/, 'get', (options) => {
  const params = getUrlParams(options.url)
  const articleId = parseInt(options.url.match(/\/comments\/(\d+)/)[1])
  const page = parseInt(params.page) || 1
  const limit = parseInt(params.limit) || 10
  
  const comments = allComments[articleId] || []
  
  // 分页处理
  const start = (page - 1) * limit
  const end = start + limit
  const pagedComments = comments.slice(start, end)
  
  delay(300)
  
  return {
    code: 200,
    message: '获取评论成功',
    data: {
      total: comments.length,
      page,
      limit,
      list: pagedComments
    }
  }
})

// Mock 发表评论接口
Mock.mock(/\/api\/article\/comment\/\d+/, 'post', (options) => {
  const articleId = parseInt(options.url.match(/\/comment\/(\d+)/)[1])
  const body = getRequestBody(options)
  
  if (!body.content) {
    return {
      code: 400,
      message: '评论内容不能为空'
    }
  }
  
  const article = allArticles.find(a => a.id === articleId)
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 创建新评论
  const newComment = {
    id: allComments[articleId] ? allComments[articleId].length + 1 : 1,
    articleId,
    content: body.content,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    isLiked: false,
    replyCount: 0,
    replies: [],
    user: {
      id: 1, // 当前登录用户
      username: 'current_user',
      nickname: '当前用户',
      avatar: Mock.Random.image('50x50', '#4A7BF7', '#FFF', 'Avatar')
    }
  }
  
  // 如果是回复其他评论
  if (body.replyTo) {
    const parentComment = allComments[articleId].find(c => c.id === body.replyTo)
    if (parentComment) {
      const reply = {
        id: parentComment.replies.length + 100,
        commentId: parentComment.id,
        content: body.content,
        createdAt: new Date().toISOString(),
        user: newComment.user,
        replyTo: body.replyToUser
      }
      
      parentComment.replies.push(reply)
      parentComment.replyCount += 1
      
      delay(200)
      
      return {
        code: 200,
        message: '回复评论成功',
        data: reply
      }
    }
  }
  
  // 创建评论
  if (!allComments[articleId]) {
    allComments[articleId] = []
  }
  allComments[articleId].unshift(newComment)
  
  // 更新文章评论数
  article.commentCount += 1
  
  delay(300)
  
  return {
    code: 200,
    message: '评论成功',
    data: newComment
  }
})

// Mock 点赞文章接口
Mock.mock(/\/api\/article\/like\/\d+/, 'post', (options) => {
  const id = parseInt(options.url.match(/\/like\/(\d+)/)[1])
  const body = getRequestBody(options)
  const article = allArticles.find(a => a.id === id)
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 更新点赞状态
  const isLike = body.like !== false
  
  if (isLike && !article.isLiked) {
    article.likeCount += 1
    article.isLiked = true
  } else if (!isLike && article.isLiked) {
    article.likeCount = Math.max(0, article.likeCount - 1)
    article.isLiked = false
  }
  
  delay(100)
  
  return {
    code: 200,
    message: isLike ? '点赞成功' : '取消点赞成功',
    data: {
      isLiked: article.isLiked,
      likeCount: article.likeCount
    }
  }
})

// Mock 收藏文章接口
Mock.mock(/\/api\/article\/favorite\/\d+/, 'post', (options) => {
  const id = parseInt(options.url.match(/\/favorite\/(\d+)/)[1])
  const body = getRequestBody(options)
  const article = allArticles.find(a => a.id === id)
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 更新收藏状态
  const isFavorite = body.favorite !== false
  article.isFavorite = isFavorite
  
  delay(100)
  
  return {
    code: 200,
    message: isFavorite ? '收藏成功' : '取消收藏成功',
    data: {
      isFavorite: article.isFavorite
    }
  }
})

// Mock 获取用户发布的文章列表
Mock.mock(/\/api\/article\/user\/\d+/, 'get', (options) => {
  const params = getUrlParams(options.url)
  const userId = parseInt(options.url.match(/\/user\/(\d+)/)[1])
  const page = parseInt(params.page) || 1
  const limit = parseInt(params.limit) || 10
  
  // 过滤出用户发布的文章
  const userArticles = allArticles.filter(article => article.author.id === userId)
  
  // 分页处理
  const start = (page - 1) * limit
  const end = start + limit
  const pagedArticles = userArticles.slice(start, end)
  
  delay(300)
  
  return {
    code: 200,
    message: '获取用户文章成功',
    data: {
      total: userArticles.length,
      page,
      limit,
      list: pagedArticles
    }
  }
})

// Mock 举报文章接口
Mock.mock(/\/api\/article\/report\/\d+/, 'post', (options) => {
  const id = parseInt(options.url.match(/\/report\/(\d+)/)[1])
  const body = getRequestBody(options)
  
  if (!body.reason) {
    return {
      code: 400,
      message: '举报理由不能为空'
    }
  }
  
  const article = allArticles.find(a => a.id === id)
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  delay(300)
  
  return {
    code: 200,
    message: '举报成功，我们会尽快处理',
    data: {
      reportId: Mock.Random.guid()
    }
  }
})

// 添加Mock API - 获取收藏的文章
Mock.mock(/\/api\/article\/favorites/, 'get', (options) => {
  const params = getUrlParams(options.url)
  const page = parseInt(params.page) || 1
  const limit = parseInt(params.limit) || 10
  
  // 模拟收藏的文章 - 随机取一些文章作为收藏的
  const favoriteArticles = allArticles
    .filter(() => Math.random() > 0.7) // 随机选择约30%的文章
    .slice(0, 15) // 最多15篇
  
  // 为收藏的文章设置收藏标记
  favoriteArticles.forEach(article => {
    article.isFavorite = true
  })
  
  // 分页处理
  const start = (page - 1) * limit
  const end = start + limit
  const pagedArticles = favoriteArticles.slice(start, end)
  
  delay(200)
  
  return {
    code: 200,
    message: '获取收藏文章成功',
    data: {
      total: favoriteArticles.length,
      page,
      limit,
      list: pagedArticles
    }
  }
})

export default {
  allArticles
}