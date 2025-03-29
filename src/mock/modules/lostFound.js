import Mock from 'mockjs'
import { getQueryParams, delay, getUrlParams } from '../utils'
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

// 失物招领模块
const lostFoundMock = {
  // 获取失物招领列表
  'GET /api/lost-found/list': config => {
    const { page = 1, limit = 10, type, status, sort, keywords } = getUrlParams(config.url)
    
    // 生成列表数据
    const items = generateLostFoundItems(30) // 生成30条数据
    
    // 根据type过滤
    let filteredItems = items
    if (type && type !== 'all') {
      filteredItems = items.filter(item => item.type === type)
    }
    
    // 根据status过滤
    if (status && status !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === status)
    }
    
    // 根据关键词搜索
    if (keywords) {
      const keyword = keywords.toLowerCase()
      filteredItems = filteredItems.filter(
        item =>
          item.title.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword) ||
          item.location.toLowerCase().includes(keyword)
      )
    }
    
    // 排序
    if (sort === 'latest') {
      filteredItems.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    } else if (sort === 'hot') {
      filteredItems.sort((a, b) => b.viewCount - a.viewCount)
    }
    
    // 分页
    const pageData = generateListPageData(filteredItems, Number(page), Number(limit))
    
    return {
      code: 200,
      message: '获取成功',
      data: pageData
    }
  },
  
  // 获取失物招领详情
  'GET /api/lost-found/detail/:id': config => {
    const { id } = config.params
    const items = generateLostFoundItems(30)
    const item = items.find(item => item.id === Number(id))
    
    if (!item) {
      return {
        code: 404,
        message: '未找到该失物招领信息',
        data: null
      }
    }
    
    // 添加评论数据
    item.comments = Array(Math.floor(Math.random() * 5))
      .fill()
      .map((_, i) => ({
        id: i + 1,
        content: `这是第${i + 1}条评论`,
        createTime: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
        user: {
          id: i + 2,
          nickname: `用户${i + 2}`,
          avatar: `https://picsum.photos/id/${i + 101}/100/100`
        }
      }))
    
    return {
      code: 200,
      message: '获取成功',
      data: item
    }
  },
  
  // 获取用户发布的失物招领列表
  'GET /api/lost-found/user/:id': config => {
    // 确保config.params存在
    const id = config?.params?.id || config.url.match(/\/user\/(\d+)/)?.[1]
    // 安全地从URL中提取参数，提供默认值
    const { page = 1, limit = 10 } = config.params || getUrlParams(config.url) || {}
    
    // 生成列表数据
    const items = generateLostFoundItems(15).map(item => {
      item.publisher.id = Number(id)
      return item
    })
    
    // 分页
    const pageData = generateListPageData(items, Number(page), Number(limit))
    
    return {
      code: 200,
      message: '获取成功',
      data: pageData
    }
  }
}

export default lostFoundMock