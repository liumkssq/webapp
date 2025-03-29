import Mock from 'mockjs'
import { getQueryParams } from '../utils'

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
const generateArticles = (count = 100) => {
  const articles = []
  const categories = ['校园生活', '学习经验', '技术分享', '活动宣传', '社团招新', '就业实习', '心情随笔', '二手交易', '失物招领', '求助互助']
  
  for (let i = 1; i <= count; i++) {
    const authorId = Random.natural(1, 30)
    const isCurrentUser = Random.boolean(0.1)
    const author = generateAuthor(authorId, isCurrentUser)
    
    // 决定内容类型，文字内容+可能有图片
    const hasImages = Random.boolean(0.8)
    const imageCount = hasImages ? Random.natural(1, 6) : 0
    const images = []
    
    for (let j = 0; j < imageCount; j++) {
      images.push(Random.image('800x600', Random.color(), Random.color(), 'png', 'Article'))
    }
    
    // 生成标签
    const tagCount = Random.natural(0, 5)
    const tags = []
    for (let j = 0; j < tagCount; j++) {
      tags.push(Random.cword(2, 4))
    }
    
    // 生成评论
    const commentCount = Random.natural(0, 20)
    const comments = []
    for (let j = 0; j < commentCount; j++) {
      const commentId = `comment_${i}_${j}`
      const authorId = Random.natural(1, 30)
      
      // 随机生成回复
      const replyCount = Random.natural(0, 5)
      const replies = []
      for (let k = 0; k < replyCount; k++) {
        const replyAuthorId = Random.natural(1, 30)
        const replyToAuthorId = k === 0 ? authorId : Random.pick(replies).author.id
        
        replies.push({
          id: `${commentId}_reply_${k}`,
          content: Random.csentence(5, 30),
          author: {
            id: replyAuthorId,
            name: Random.cname(),
            avatar: Random.image('50x50', Random.color(), Random.color(), 'png', Random.first())
          },
          replyTo: {
            id: replyToAuthorId,
            name: Random.cname()
          },
          createTime: Random.date('yyyy-MM-dd HH:mm:ss'),
          likeCount: Random.natural(0, 20),
          isLiked: Random.boolean(0.3)
        })
      }
      
      comments.push({
        id: commentId,
        content: Random.csentence(10, 50),
        author: {
          id: authorId,
          name: Random.cname(),
          avatar: Random.image('50x50', Random.color(), Random.color(), 'png', Random.first())
        },
        createTime: Random.date('yyyy-MM-dd HH:mm:ss'),
        likeCount: Random.natural(0, 30),
        isLiked: Random.boolean(0.3),
        replies: replies.length > 0 ? replies : undefined
      })
    }
    
    articles.push({
      id: i,
      title: Random.csentence(5, 15),
      content: Random.cparagraph(5, 15),
      summary: Random.cparagraph(1, 3),
      category: Random.pick(categories),
      tags: tags.length > 0 ? tags : undefined,
      images: images.length > 0 ? images : undefined,
      author,
      createTime: Random.date('yyyy-MM-dd HH:mm:ss'),
      updateTime: Random.date('yyyy-MM-dd HH:mm:ss'),
      viewCount: Random.natural(50, 5000),
      commentCount,
      likeCount: Random.natural(0, 300),
      isLiked: Random.boolean(0.3),
      collectCount: Random.natural(0, 200),
      isCollected: Random.boolean(0.3),
      comments: comments.length > 0 ? comments : undefined
    })
  }
  
  return articles
}

// 生成文章数据
const articles = generateArticles()

// 获取文章列表
const getArticleList = (config) => {
  const { 
    category, tag, sort,
    keyword, userId, isFavorite,
    page = 1, limit = 10 
  } = getQueryParams(config.url)
  
  // 筛选条件
  let filteredArticles = [...articles]
  
  // 根据分类筛选
  if (category && category !== 'all') {
    filteredArticles = filteredArticles.filter(article => article.category === category)
  }
  
  // 根据标签筛选
  if (tag) {
    filteredArticles = filteredArticles.filter(article => article.tags && article.tags.includes(tag))
  }
  
  // 根据关键词筛选
  if (keyword) {
    const key = keyword.toLowerCase()
    filteredArticles = filteredArticles.filter(article => 
      article.title.toLowerCase().includes(key) || 
      article.content.toLowerCase().includes(key) ||
      article.category.toLowerCase().includes(key)
    )
  }
  
  // 根据用户ID筛选
  if (userId) {
    filteredArticles = filteredArticles.filter(article => article.author.id === Number(userId))
  }
  
  // 获取收藏的文章
  if (isFavorite === 'true') {
    filteredArticles = filteredArticles.filter(article => article.isCollected)
  }
  
  // 排序
  if (sort) {
    if (sort === 'popular') {
      filteredArticles.sort((a, b) => b.viewCount - a.viewCount)
    } else if (sort === 'comments') {
      filteredArticles.sort((a, b) => b.commentCount - a.commentCount)
    } else if (sort === 'likes') {
      filteredArticles.sort((a, b) => b.likeCount - a.likeCount)
    } else {
      // 默认按最新排序
      filteredArticles.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    }
  } else {
    // 默认按最新排序
    filteredArticles.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  }
  
  // 分页
  const currentPage = Number(page)
  const pageSize = Number(limit)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  
  // 分页数据
  const pagedArticles = filteredArticles.slice(startIndex, endIndex).map(article => ({
    ...article,
    comments: undefined // 列表不返回评论数据
  }))
  
  return {
    code: 200,
    data: {
      list: pagedArticles,
      total: filteredArticles.length,
      page: currentPage,
      limit: pageSize,
      hasMore: endIndex < filteredArticles.length
    },
    message: '获取成功'
  }
}

// 获取文章详情
const getArticleDetail = (config) => {
  const id = config.url.match(/\/api\/article\/(\d+)/)[1]
  const article = articles.find(article => article.id === Number(id))
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 增加浏览量
  article.viewCount += 1
  
  // 随机生成相关推荐
  const recommendCount = Random.natural(3, 6)
  const sameCategoryArticles = articles.filter(a => a.category === article.category && a.id !== article.id)
  const recommendations = []
  
  for (let i = 0; i < recommendCount && i < sameCategoryArticles.length; i++) {
    const randomIndex = Random.natural(0, sameCategoryArticles.length - 1)
    const recommendedArticle = { ...sameCategoryArticles[randomIndex] }
    
    // 只保留必要字段
    recommendations.push({
      id: recommendedArticle.id,
      title: recommendedArticle.title,
      summary: recommendedArticle.summary,
      category: recommendedArticle.category,
      author: {
        id: recommendedArticle.author.id,
        name: recommendedArticle.author.name,
        avatar: recommendedArticle.author.avatar
      },
      createTime: recommendedArticle.createTime,
      viewCount: recommendedArticle.viewCount,
      images: recommendedArticle.images ? [recommendedArticle.images[0]] : undefined
    })
  }
  
  return {
    code: 200,
    data: {
      ...article,
      recommendations
    },
    message: '获取成功'
  }
}

// 发布文章
const publishArticle = (config) => {
  const data = JSON.parse(config.body)
  
  // 验证必要字段
  if (!data.title || !data.content || !data.category) {
    return {
      code: 400,
      message: '请填写完整信息'
    }
  }
  
  // 创建新文章
  const newId = articles.length + 1
  const now = new Date().toISOString()
  
  const newArticle = {
    id: newId,
    ...data,
    author: {
      id: 1,
      name: '测试用户',
      avatar: Random.image('100x100', Random.color(), Random.color(), 'png', 'TU'),
      school: '测试大学',
      bio: '这是一个测试账号'
    },
    createTime: now,
    updateTime: now,
    viewCount: 0,
    commentCount: 0,
    likeCount: 0,
    isLiked: false,
    collectCount: 0,
    isCollected: false
  }
  
  // 生成摘要
  if (!newArticle.summary) {
    // 从内容截取摘要
    newArticle.summary = newArticle.content.length > 100 
      ? newArticle.content.substring(0, 100) + '...'
      : newArticle.content
  }
  
  articles.unshift(newArticle)
  
  return {
    code: 200,
    data: {
      id: newId
    },
    message: '发布成功'
  }
}

// 更新文章
const updateArticle = (config) => {
  const id = config.url.match(/\/api\/article\/(\d+)/)[1]
  const data = JSON.parse(config.body)
  
  // 查找文章
  const article = articles.find(article => article.id === Number(id))
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 验证是否为作者
  if (article.author.id !== 1) {
    return {
      code: 403,
      message: '无权限修改'
    }
  }
  
  // 更新文章信息
  Object.assign(article, data, {
    updateTime: new Date().toISOString()
  })
  
  // 更新摘要
  if (!article.summary || data.content) {
    // 从内容截取摘要
    article.summary = article.content.length > 100 
      ? article.content.substring(0, 100) + '...'
      : article.content
  }
  
  return {
    code: 200,
    data: article,
    message: '更新成功'
  }
}

// 删除文章
const deleteArticle = (config) => {
  const id = config.url.match(/\/api\/article\/(\d+)/)[1]
  
  // 查找文章索引
  const index = articles.findIndex(article => article.id === Number(id))
  
  if (index === -1) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 验证是否为作者
  if (articles[index].author.id !== 1) {
    return {
      code: 403,
      message: '无权限删除'
    }
  }
  
  // 删除文章
  articles.splice(index, 1)
  
  return {
    code: 200,
    message: '删除成功'
  }
}

// 点赞文章
const likeArticle = (config) => {
  const id = config.url.match(/\/api\/article\/(\d+)\/like/)[1]
  
  // 查找文章
  const article = articles.find(article => article.id === Number(id))
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 更新点赞状态
  article.isLiked = true
  article.likeCount += 1
  
  return {
    code: 200,
    data: {
      isLiked: true,
      likeCount: article.likeCount
    },
    message: '点赞成功'
  }
}

// 取消点赞
const unlikeArticle = (config) => {
  const id = config.url.match(/\/api\/article\/(\d+)\/unlike/)[1]
  
  // 查找文章
  const article = articles.find(article => article.id === Number(id))
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 更新点赞状态
  article.isLiked = false
  article.likeCount = Math.max(0, article.likeCount - 1)
  
  return {
    code: 200,
    data: {
      isLiked: false,
      likeCount: article.likeCount
    },
    message: '已取消点赞'
  }
}

// 收藏文章
const collectArticle = (config) => {
  const id = config.url.match(/\/api\/article\/(\d+)\/collect/)[1]
  
  // 查找文章
  const article = articles.find(article => article.id === Number(id))
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 更新收藏状态
  article.isCollected = true
  article.collectCount += 1
  
  return {
    code: 200,
    data: {
      isCollected: true,
      collectCount: article.collectCount
    },
    message: '收藏成功'
  }
}

// 取消收藏
const uncollectArticle = (config) => {
  const id = config.url.match(/\/api\/article\/(\d+)\/uncollect/)[1]
  
  // 查找文章
  const article = articles.find(article => article.id === Number(id))
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  // 更新收藏状态
  article.isCollected = false
  article.collectCount = Math.max(0, article.collectCount - 1)
  
  return {
    code: 200,
    data: {
      isCollected: false,
      collectCount: article.collectCount
    },
    message: '已取消收藏'
  }
}

// 评论文章
const commentArticle = (config) => {
  const id = config.url.match(/\/api\/article\/(\d+)\/comment/)[1]
  const { content, replyToId } = JSON.parse(config.body)
  
  // 查找文章
  const article = articles.find(article => article.id === Number(id))
  
  if (!article) {
    return {
      code: 404,
      message: '文章不存在'
    }
  }
  
  const now = new Date().toISOString()
  
  // 如果是回复评论
  if (replyToId) {
    // 查找原评论
    let foundComment
    
    for (const comment of (article.comments || [])) {
      if (foundComment) break
      
      if (comment.author.id === replyToId) {
        foundComment = comment
        break
      }
      
      // 在回复中查找
      if (comment.replies) {
        for (const reply of comment.replies) {
          if (reply.author.id === replyToId) {
            foundComment = comment
            break
          }
        }
      }
    }
    
    if (!foundComment) {
      return {
        code: 404,
        message: '原评论不存在'
      }
    }
    
    // 创建回复
    const reply = {
      id: `comment_${article.id}_reply_${now}`,
      content,
      author: {
        id: 1,
        name: '测试用户',
        avatar: Random.image('50x50', Random.color(), Random.color(), 'png', 'TU')
      },
      replyTo: {
        id: replyToId,
        name: Random.cname()
      },
      createTime: now,
      likeCount: 0,
      isLiked: false
    }
    
    // 添加回复
    if (!foundComment.replies) {
      foundComment.replies = []
    }
    foundComment.replies.push(reply)
    
    return {
      code: 200,
      data: reply,
      message: '回复成功'
    }
  }
  
  // 创建新评论
  const newComment = {
    id: `comment_${article.id}_${now}`,
    content,
    author: {
      id: 1,
      name: '测试用户',
      avatar: Random.image('50x50', Random.color(), Random.color(), 'png', 'TU')
    },
    createTime: now,
    likeCount: 0,
    isLiked: false
  }
  
  // 添加评论
  if (!article.comments) {
    article.comments = []
  }
  article.comments.unshift(newComment)
  article.commentCount += 1
  
  return {
    code: 200,
    data: newComment,
    message: '评论成功'
  }
}

// 上传文章图片
const uploadArticleImages = () => {
  // 模拟上传成功
  const imageCount = Random.natural(1, 5)
  const images = []
  
  for (let i = 0; i < imageCount; i++) {
    images.push(Random.image('800x600', Random.color(), Random.color(), 'png', 'Article'))
  }
  
  return {
    code: 200,
    data: {
      urls: images
    },
    message: '上传成功'
  }
}

export default {
  'GET /api/article': getArticleList,
  'GET /api/article/\\d+': getArticleDetail,
  'POST /api/article': publishArticle,
  'PUT /api/article/\\d+': updateArticle,
  'DELETE /api/article/\\d+': deleteArticle,
  'POST /api/article/\\d+/like': likeArticle,
  'POST /api/article/\\d+/unlike': unlikeArticle,
  'POST /api/article/\\d+/collect': collectArticle,
  'POST /api/article/\\d+/uncollect': uncollectArticle,
  'POST /api/article/\\d+/comment': commentArticle,
  'POST /api/article/images': uploadArticleImages
}