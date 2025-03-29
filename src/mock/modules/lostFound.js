import Mock from 'mockjs'
import { getQueryParams } from '../utils'

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
const generateLostFoundItems = (count = 100) => {
  const items = []
  const categories = ['电子产品', '图书资料', '卡片证件', '衣物饰品', '生活用品', '运动用品', '背包箱包', '首饰配件', '钥匙钱包', '其他物品']
  const locations = ['教室', '图书馆', '食堂', '宿舍', '操场', '实验室', '校车', '路边', '超市', '校门口', '体育馆', '其他地点']
  const statuses = ['pending', 'found', 'claimed', 'closed']
  
  for (let i = 1; i <= count; i++) {
    const isLost = Random.boolean()
    const type = isLost ? 'lost' : 'found'
    const status = Random.pick(statuses, statuses.slice(0, 2))
    const publisherId = Random.natural(1, 30)
    const isCurrentUser = Random.boolean(0.1)
    
    // 随机生成图片数量
    const imageCount = Random.natural(0, 4)
    const images = []
    for (let j = 0; j < imageCount; j++) {
      images.push(Random.image('300x300', Random.color(), Random.color(), 'png', 'Item'))
    }
    
    // 生成评论
    const commentCount = Random.natural(0, 15)
    const comments = []
    for (let j = 0; j < commentCount; j++) {
      const commentId = `comment_${i}_${j}`
      const authorId = Random.natural(1, 30)
      
      // 随机生成回复
      const replyCount = Random.natural(0, 3)
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
    
    // 生成联系信息
    const contactInfo = {
      phone: `1${Random.pick(['3', '5', '7', '8', '9'])}${Random.string('number', 9)}`,
      wechat: Random.string('lower', 6, 12),
      showPhone: Random.boolean(0.7),
      showWechat: Random.boolean(0.7)
    }
    
    items.push({
      id: i,
      type,
      title: `${type === 'lost' ? '寻找' : '拾获'}${Random.pick(categories)}：${Random.csentence(5, 15)}`,
      description: Random.cparagraph(2, 5),
      category: Random.pick(categories),
      images,
      location: Random.pick(locations),
      eventTime: Random.date('yyyy-MM-dd HH:mm:ss'),
      createTime: Random.date('yyyy-MM-dd HH:mm:ss'),
      updateTime: Random.date('yyyy-MM-dd HH:mm:ss'),
      status,
      reward: type === 'lost' ? (Random.boolean(0.7) ? Random.natural(10, 200) : 0) : 0,
      publisher: generatePublisher(publisherId, isCurrentUser),
      contactInfo,
      viewCount: Random.natural(20, 1000),
      commentCount,
      comments: comments.length > 0 ? comments : undefined,
      isFollowed: Random.boolean(0.3)
    })
  }
  
  return items
}

// 生成失物招领数据
const lostFoundItems = generateLostFoundItems()

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

export default {
  'GET /api/lost-found': getLostFoundList,
  'GET /api/lost-found/\\d+': getLostFoundDetail,
  'POST /api/lost-found': publishLostFound,
  'PUT /api/lost-found/\\d+': updateLostFound,
  'DELETE /api/lost-found/\\d+': deleteLostFound,
  'PUT /api/lost-found/\\d+/status': updateLostFoundStatus,
  'POST /api/lost-found/\\d+/comment': commentLostFound,
  'POST /api/lost-found/images': uploadLostFoundImages
}