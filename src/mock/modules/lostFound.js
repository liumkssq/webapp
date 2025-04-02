import Mock from 'mockjs'
import { getUrlParams, delay, getQueryParams } from '../utils'
import { generateId, generateListPageData } from '../helpers'

const Random = Mock.Random

// 生成发布者数据
const generatePublisher = (id, isCurrentUser = false) => {
  if (isCurrentUser) {
    return {
      id: 1,
      name: '测试用户',
      avatar: Random.image('100x100', Random.color(), Random.color(), 'png', 'TU'),
      school: '测试大学',
      verified: true
    }
  }
  
  return {
    id,
    name: Random.cname(),
    avatar: Random.image('100x100', Random.color(), Random.color(), 'png', Random.first()),
    school: Random.pick(['北京大学', '清华大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '武汉大学', '中山大学']),
    verified: Random.boolean(0.3)
  }
}

// 生成失物招领数据
const generateLostFoundItems = count => {
  return Array(count)
    .fill()
    .map((_, i) => ({
      id: i + 1,
      type: i % 2 === 0 ? 'lost' : 'found',
      title: i % 2 === 0 ? `寻找失物：钱包${i + 1}` : `招领启事：钥匙${i + 1}`,
      description: '物品描述信息，包含物品特征、丢失/拾取时间等详细信息。',
      location: i % 2 === 0 ? '图书馆三楼' : '学生食堂',
      category: ['电子产品', '证件', '钱包', '钥匙', '衣物'][i % 5],
      eventTime: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      createTime: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      images: i % 3 === 0 ? [`https://picsum.photos/id/${50 + i}/300/200`] : [],
      status: ['pending', 'found', 'closed'][i % 3],
      reward: i % 2 === 0 ? Math.floor(Math.random() * 100) : 0,
      publisher: {
        id: 1,
        nickname: '测试用户',
        avatar: 'https://picsum.photos/id/100/100/100'
      },
      contactPhone: '13800138000',
      contactWechat: 'test_wechat',
      viewCount: Math.floor(Math.random() * 100) + 10
    }))
}

// 生成失物招领数据
const lostFoundItems = generateLostFoundItems(100)

// 获取失物招领列表
const getLostFoundList = (config) => {
  const { 
    type, category, location, status,
    startTime, endTime, keyword,
    userId, page = 1, limit = 10 
  } = getQueryParams(config.url)
  
  // 筛选条件
  let filteredItems = [...lostFoundItems]
  
  // 根据类型筛选
  if (type) {
    filteredItems = filteredItems.filter(item => item.type === type)
  }
  
  // 根据分类筛选
  if (category && category !== 'all') {
    filteredItems = filteredItems.filter(item => item.category === category)
  }
  
  // 根据地点筛选
  if (location && location !== 'all') {
    filteredItems = filteredItems.filter(item => item.location === location)
  }
  
  // 根据状态筛选
  if (status && status !== 'all') {
    filteredItems = filteredItems.filter(item => item.status === status)
  }
  
  // 根据时间筛选
  if (startTime) {
    const start = new Date(Number(startTime))
    filteredItems = filteredItems.filter(item => new Date(item.eventTime) >= start)
  }
  
  if (endTime) {
    const end = new Date(Number(endTime))
    filteredItems = filteredItems.filter(item => new Date(item.eventTime) <= end)
  }
  
  // 根据关键词筛选
  if (keyword) {
    const key = keyword.toLowerCase()
    filteredItems = filteredItems.filter(item => 
      item.title.toLowerCase().includes(key) || 
      item.description.toLowerCase().includes(key) ||
      item.category.toLowerCase().includes(key) ||
      item.location.toLowerCase().includes(key)
    )
  }
  
  // 根据用户ID筛选
  if (userId) {
    filteredItems = filteredItems.filter(item => item.publisher.id === Number(userId))
  }
  
  // 分页
  const currentPage = Number(page)
  const pageSize = Number(limit)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  
  // 分页数据
  const pagedItems = filteredItems.slice(startIndex, endIndex)
  
  // 为每个物品添加相似物品推荐
  pagedItems.forEach(item => {
    // 随机添加相似物品
    const similarItems = []
    const count = Random.natural(2, 5)
    const sameTypeItems = lostFoundItems.filter(i => i.type === item.type && i.id !== item.id)
    
    for (let i = 0; i < count && i < sameTypeItems.length; i++) {
      const randomIndex = Random.natural(0, sameTypeItems.length - 1)
      const similarItem = { ...sameTypeItems[randomIndex] }
      
      // 只保留必要字段
      similarItems.push({
        id: similarItem.id,
        title: similarItem.title,
        type: similarItem.type,
        category: similarItem.category,
        location: similarItem.location,
        eventTime: similarItem.eventTime,
        status: similarItem.status,
        images: similarItem.images
      })
    }
    
    if (similarItems.length > 0) {
      item.similarItems = similarItems
    }
  })
  
  return {
    code: 200,
    data: {
      list: pagedItems,
      total: filteredItems.length,
      page: currentPage,
      limit: pageSize,
      hasMore: endIndex < filteredItems.length
    },
    message: '获取成功'
  }
}

// 获取失物招领详情
const getLostFoundDetail = (config) => {
  const id = config.url.match(/\/api\/lost-found\/(\d+)/)[1]
  const item = lostFoundItems.find(item => item.id === Number(id))
  
  if (!item) {
    return {
      code: 404,
      message: '物品不存在'
    }
  }
  
  // 增加浏览量
  item.viewCount += 1
  
  return {
    code: 200,
    data: item,
    message: '获取成功'
  }
}

// 发布失物招领
const publishLostFound = (config) => {
  const data = JSON.parse(config.body)
  
  // 验证必要字段
  if (!data.type || !data.title || !data.category || !data.location || !data.eventTime) {
    return {
      code: 400,
      message: '请填写完整信息'
    }
  }
  
  // 创建新物品
  const newId = lostFoundItems.length + 1
  const now = new Date().toISOString()
  
  const newItem = {
    id: newId,
    ...data,
    createTime: now,
    updateTime: now,
    status: 'pending',
    publisher: {
      id: 1,
      name: '测试用户',
      avatar: Random.image('100x100', Random.color(), Random.color(), 'png', 'TU'),
      school: '测试大学',
      verified: true
    },
    viewCount: 0,
    commentCount: 0
  }
  
  lostFoundItems.unshift(newItem)
  
  return {
    code: 200,
    data: {
      id: newId
    },
    message: '发布成功'
  }
}

// 更新失物招领
const updateLostFound = (config) => {
  const id = config.url.match(/\/api\/lost-found\/(\d+)/)[1]
  const data = JSON.parse(config.body)
  
  // 查找物品
  const item = lostFoundItems.find(item => item.id === Number(id))
  
  if (!item) {
    return {
      code: 404,
      message: '物品不存在'
    }
  }
  
  // 验证是否为发布者
  if (item.publisher.id !== 1) {
    return {
      code: 403,
      message: '无权限修改'
    }
  }
  
  // 更新物品信息
  Object.assign(item, data, {
    updateTime: new Date().toISOString()
  })
  
  return {
    code: 200,
    data: item,
    message: '更新成功'
  }
}

// 删除失物招领
const deleteLostFound = (config) => {
  const id = config.url.match(/\/api\/lost-found\/(\d+)/)[1]
  
  // 查找物品索引
  const index = lostFoundItems.findIndex(item => item.id === Number(id))
  
  if (index === -1) {
    return {
      code: 404,
      message: '物品不存在'
    }
  }
  
  // 验证是否为发布者
  if (lostFoundItems[index].publisher.id !== 1) {
    return {
      code: 403,
      message: '无权限删除'
    }
  }
  
  // 删除物品
  lostFoundItems.splice(index, 1)
  
  return {
    code: 200,
    message: '删除成功'
  }
}

// 更新失物招领状态
const updateLostFoundStatus = (config) => {
  const id = config.url.match(/\/api\/lost-found\/(\d+)\/status/)[1]
  const { status } = JSON.parse(config.body)
  
  // 查找物品
  const item = lostFoundItems.find(item => item.id === Number(id))
  
  if (!item) {
    return {
      code: 404,
      message: '物品不存在'
    }
  }
  
  // 验证是否为发布者
  if (item.publisher.id !== 1) {
    return {
      code: 403,
      message: '无权限修改'
    }
  }
  
  // 更新状态
  item.status = status
  item.updateTime = new Date().toISOString()
  
  return {
    code: 200,
    data: item,
    message: '状态更新成功'
  }
}

// 评论失物招领
const commentLostFound = (config) => {
  const id = config.url.match(/\/api\/lost-found\/(\d+)\/comment/)[1]
  const { content, replyToId } = JSON.parse(config.body)
  
  // 查找物品
  const item = lostFoundItems.find(item => item.id === Number(id))
  
  if (!item) {
    return {
      code: 404,
      message: '物品不存在'
    }
  }
  
  const now = new Date().toISOString()
  
  // 如果是回复评论
  if (replyToId) {
    // 查找原评论
    let foundComment
    
    for (const comment of (item.comments || [])) {
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
      id: `comment_${item.id}_reply_${now}`,
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
    id: `comment_${item.id}_${now}`,
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
  if (!item.comments) {
    item.comments = []
  }
  item.comments.unshift(newComment)
  item.commentCount += 1
  
  return {
    code: 200,
    data: newComment,
    message: '评论成功'
  }
}

// 上传失物招领图片
const uploadLostFoundImages = () => {
  // 模拟上传成功
  const imageCount = Random.natural(1, 3)
  const images = []
  
  for (let i = 0; i < imageCount; i++) {
    images.push(Random.image('800x600', Random.color(), Random.color(), 'png', 'Item'))
  }
  
  return {
    code: 200,
    data: {
      urls: images
    },
    message: '上传成功'
  }
}

// 创建模拟数据
const mockLostFound = Mock.mock({
  'list|20': [{
    'id|+1': 1,
    'type|1': ['lost', 'found'],
    'title': '@ctitle(5, 20)',
    'description': '@cparagraph(3, 5)',
    'category|1': ['电子设备', '证件', '钱包/钥匙', '衣物', '学习用品', '其他'],
    'location': '@ctitle(3, 10)',
    'eventTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
    'createTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
    'images|0-3': ['@image("300x200", "#50B347", "#FFF", "Mock")'],
    'status|1': ['pending', 'found', 'claimed', 'closed'],
    'reward|0-200': 0,
    'likes|0-100': 0,
    'comments|0-20': 0,
    'isLiked|1': [true, false],
    'publisher': {
      'id|+1': 10000,
      'name': '@cname',
      'avatar': '@image("100x100", "#894FC4", "#FFF", "avatar")',
      'school': '@ctitle(4, 10)大学',
      'verified|1': [true, false]
    },
    'contactInfo': {
      'phone': /1[3-9]\d{9}/,
      'wechat': /wx_\w{6,12}/,
      'showPhone|1': [true, false],
      'showWechat|1': [true, false]
    },
    'commentList|0-5': [{
      'id|+1': 1,
      'content': '@cparagraph(1, 3)',
      'createTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'likeCount|0-30': 0,
      'isLiked|1': [true, false],
      'author': {
        'id|+1': 20000,
        'name': '@cname',
        'avatar': '@image("100x100", "#894FC4", "#FFF", "avatar")'
      },
      'replies|0-3': [{
        'id|+1': 1,
        'content': '@cparagraph(1, 2)',
        'createTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
        'author': {
          'id|+1': 30000,
          'name': '@cname',
          'avatar': '@image("100x100", "#894FC4", "#FFF", "avatar")'
        },
        'replyTo|+1': {
          'id': '@integer(20000, 30000)',
          'name': '@cname'
        }
      }]
    }]
  }]
})

// 获取列表
Mock.mock(/\/api\/lost-found\/list/, 'get', (options) => {
  const params = getUrlParams(options.url)
  const { page = 1, limit = 10, type, status, keywords } = params
  
  let list = mockLostFound.list
  
  // 筛选类型
  if (type && type !== 'all') {
    list = list.filter(item => item.type === type)
  }
  
  // 筛选状态
  if (status && status !== 'all') {
    list = list.filter(item => item.status === status)
  }
  
  // 搜索关键词
  if (keywords) {
    const reg = new RegExp(keywords, 'i')
    list = list.filter(item => reg.test(item.title) || reg.test(item.description))
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

// 获取详情
Mock.mock(/\/api\/lost-found\/detail\/(\d+)/, 'get', (options) => {
  const id = options.url.match(/\/lost-found\/detail\/(\d+)/)[1]
  const item = mockLostFound.list.find(item => item.id === parseInt(id))
  
  if (!item) {
    return {
      code: 404,
      message: '物品不存在'
    }
  }
  
  // 构建详情数据
  const detail = {
    ...item,
    comments: item.commentList || [],
    commentCount: item.comments || 0,
    similarItems: mockLostFound.list
      .filter(other => other.id !== item.id && other.type === item.type)
      .slice(0, 3)
  }
  
  return {
    code: 200,
    message: '获取成功',
    data: detail
  }
})

// 获取用户发布的失物招领
Mock.mock(/\/api\/lost-found\/user\/\d+/, 'get', (options) => {
  const userId = options.url.match(/\/user\/(\d+)/)[1]
  const params = getUrlParams(options.url)
  const { page = 1, limit = 10 } = params
  
  const list = mockLostFound.list.filter(item => item.publisher.id === parseInt(userId))
  
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

// 更新状态
Mock.mock(/\/api\/lost-found\/\d+\/status/, 'put', (options) => {
  const id = options.url.match(/\/lost-found\/(\d+)\/status/)[1]
  const { status } = JSON.parse(options.body)
  const item = mockLostFound.list.find(item => item.id === parseInt(id))
  
  if (!item) {
    return {
      code: 404,
      message: '物品不存在'
    }
  }
  
  // 更新状态
  item.status = status
  
  return {
    code: 200,
    message: '状态更新成功',
    data: { status }
  }
})

// 发表评论
Mock.mock(/\/api\/lost-found\/\d+\/comment/, 'post', (options) => {
  const id = options.url.match(/\/lost-found\/(\d+)\/comment/)[1]
  const { content, replyToId } = JSON.parse(options.body)
  const item = mockLostFound.list.find(item => item.id === parseInt(id))
  
  if (!item) {
    return {
      code: 404,
      message: '物品不存在'
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
      'avatar': '@image("100x100", "#894FC4", "#FFF", "avatar")'
    }
  })
  
  // 如果是回复
  if (replyToId) {
    newComment.replyTo = {
      id: replyToId,
      name: Mock.Random.cname()
    }
  }
  
  // 更新评论
  if (!item.commentList) {
    item.commentList = []
  }
  
  item.commentList.unshift(newComment)
  item.comments = (item.comments || 0) + 1
  
  return {
    code: 200,
    message: '评论成功',
    data: newComment
  }
})

// 点赞
Mock.mock(/\/api\/lost-found\/\d+\/like/, 'post', (options) => {
  const id = options.url.match(/\/lost-found\/(\d+)\/like/)[1]
  const item = mockLostFound.list.find(item => item.id === parseInt(id))
  
  if (!item) {
    return {
      code: 404,
      message: '物品不存在'
    }
  }
  
  // 如果已经点赞，不做处理
  if (item.isLiked) {
    return {
      code: 200,
      message: '已点赞',
      data: {
        isLiked: true,
        likeCount: item.likes
      }
    }
  }
  
  // 设置点赞状态
  item.isLiked = true
  item.likes = item.likes + 1
  
  return {
    code: 200,
    message: '点赞成功',
    data: {
      isLiked: true,
      likeCount: item.likes
    }
  }
})

// 取消点赞
Mock.mock(/\/api\/lost-found\/\d+\/unlike/, 'post', (options) => {
  const id = options.url.match(/\/lost-found\/(\d+)\/unlike/)[1]
  const item = mockLostFound.list.find(item => item.id === parseInt(id))
  
  if (!item) {
    return {
      code: 404,
      message: '物品不存在'
    }
  }
  
  // 如果未点赞，不做处理
  if (!item.isLiked) {
    return {
      code: 200,
      message: '未点赞',
      data: {
        isLiked: false,
        likeCount: item.likes
      }
    }
  }
  
  // 取消点赞状态
  item.isLiked = false
  item.likes = Math.max(0, item.likes - 1)
  
  return {
    code: 200,
    message: '已取消点赞',
    data: {
      isLiked: false,
      likeCount: item.likes
    }
  }
})

// 失物招领模块
const lostFoundMock = {
  'GET /api/lost-found/list': getLostFoundList,
  'GET /api/lost-found/detail/:id': getLostFoundDetail,
  'POST /api/lost-found/publish': publishLostFound,
  'PUT /api/lost-found/:id': updateLostFound,
  'DELETE /api/lost-found/:id': deleteLostFound,
  'PUT /api/lost-found/:id/status': updateLostFoundStatus,
  'POST /api/lost-found/:id/comment': commentLostFound,
  'GET /api/lost-found/:id/comments': getLostFoundComments,
  'POST /api/lost-found/images': uploadLostFoundImages,
  'POST /api/lost-found/:id/like': likeLostFound,
  'POST /api/lost-found/:id/unlike': unlikeLostFound,
  'POST /api/lost-found/:id/favorite': favoriteLostFound,
  'DELETE /api/lost-found/:id/favorite': unfavoriteLostFound,
  'POST /api/lost-found/:id/report': reportLostFound
}

export default lostFoundMock