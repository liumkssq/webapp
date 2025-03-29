import Mock from 'mockjs'

const Random = Mock.Random

// 生成模拟数据
const lostFoundItems = []
for (let i = 0; i < 50; i++) {
  const isLost = Random.boolean() // 随机生成是丢失物品还是招领物品
  const type = isLost ? 'lost' : 'found'
  const status = Random.boolean() ? 'open' : 'closed' // 随机生成状态：未解决或已解决
  
  lostFoundItems.push(Mock.mock({
    id: '@guid',
    type,
    title: isLost ? '丢失：@ctitle(3, 8)' : '招领：@ctitle(3, 8)',
    description: '@cparagraph(1, 3)',
    'category|1': ['证件', '电子产品', '书籍', '钱包/钥匙', '服装', '生活用品', '其他'],
    images: () => {
      const count = Random.integer(0, 4)
      const images = []
      for (let j = 0; j < count; j++) {
        images.push(Random.image('400x300', Random.color(), Random.word(2, 6)))
      }
      return images
    },
    'location|1': ['图书馆', '教学楼', '食堂', '宿舍楼', '操场', '校门口', '其他'],
    'contactWay|1': ['电话', '微信', '邮箱', 'QQ'],
    contactInfo: function() {
      if (this.contactWay === '电话') {
        return /1[3-9]\d{9}/
      } else if (this.contactWay === '微信') {
        return Random.word(5, 12)
      } else if (this.contactWay === '邮箱') {
        return Random.email()
      } else {
        return Random.natural(10000000, 9999999999)
      }
    },
    reward: isLost ? Random.natural(0, 500) : 0,
    user: {
      id: '@id',
      name: '@cname',
      avatar: Random.image('100x100', Random.color(), Random.word(2))
    },
    createTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    updateTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    lostFoundTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    status,
    views: '@natural(0, 1000)',
    comments: () => {
      const count = Random.natural(0, 10)
      const comments = []
      for (let j = 0; j < count; j++) {
        comments.push({
          id: Random.guid(),
          userId: Random.id(),
          userName: Random.cname(),
          userAvatar: Random.image('50x50', Random.color(), Random.word(1)),
          content: Random.cparagraph(1, 2),
          createTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
        })
      }
      return comments
    }
  }))
}

export default {
  // 获取失物招领列表
  'GET /api/lost-found/list': (options) => {
    const { page = 1, size = 10, type, status, category, sort } = JSON.parse(options.body || '{}')
    
    let result = [...lostFoundItems]
    
    // 筛选类型：丢失物品或招领物品
    if (type) {
      result = result.filter(item => item.type === type)
    }
    
    // 筛选状态：未解决或已解决
    if (status) {
      result = result.filter(item => item.status === status)
    }
    
    // 筛选分类
    if (category) {
      result = result.filter(item => item.category === category)
    }
    
    // 排序
    if (sort === 'newest') {
      result.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    } else if (sort === 'views') {
      result.sort((a, b) => b.views - a.views)
    } else if (sort === 'reward') {
      result.sort((a, b) => b.reward - a.reward)
    }
    
    // 分页
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
  
  // 获取失物招领详情
  'GET /api/lost-found/:id': (options) => {
    const { id } = options.url.match(/\/api\/lost-found\/([^/]+)/).slice(1)
    const item = lostFoundItems.find(item => item.id === id)
    
    if (item) {
      // 增加浏览量
      item.views += 1
      
      return {
        code: 200,
        data: item,
        message: 'success'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '失物招领信息不存在'
      }
    }
  },
  
  // 发布失物招领信息
  'POST /api/lost-found/create': (options) => {
    const body = JSON.parse(options.body)
    
    const newItem = Mock.mock({
      id: '@guid',
      ...body,
      user: {
        id: '@id',
        name: '@cname',
        avatar: Random.image('100x100', Random.color(), Random.word(2))
      },
      createTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      updateTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      status: 'open',
      views: 0,
      comments: []
    })
    
    lostFoundItems.unshift(newItem)
    
    return {
      code: 200,
      data: newItem,
      message: '发布成功'
    }
  },
  
  // 更新失物招领信息
  'PUT /api/lost-found/:id': (options) => {
    const { id } = options.url.match(/\/api\/lost-found\/([^/]+)/).slice(1)
    const body = JSON.parse(options.body)
    
    const index = lostFoundItems.findIndex(item => item.id === id)
    
    if (index > -1) {
      lostFoundItems[index] = {
        ...lostFoundItems[index],
        ...body,
        updateTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
      }
      
      return {
        code: 200,
        data: lostFoundItems[index],
        message: '更新成功'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '失物招领信息不存在'
      }
    }
  },
  
  // 删除失物招领信息
  'DELETE /api/lost-found/:id': (options) => {
    const { id } = options.url.match(/\/api\/lost-found\/([^/]+)/).slice(1)
    
    const index = lostFoundItems.findIndex(item => item.id === id)
    
    if (index > -1) {
      const item = lostFoundItems[index]
      lostFoundItems.splice(index, 1)
      
      return {
        code: 200,
        data: item,
        message: '删除成功'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '失物招领信息不存在'
      }
    }
  },
  
  // 添加评论
  'POST /api/lost-found/:id/comment': (options) => {
    const { id } = options.url.match(/\/api\/lost-found\/([^/]+)\/comment/).slice(1)
    const body = JSON.parse(options.body)
    
    const item = lostFoundItems.find(item => item.id === id)
    
    if (item) {
      const newComment = Mock.mock({
        id: '@guid',
        userId: body.userId,
        userName: body.userName,
        userAvatar: body.userAvatar || Random.image('50x50', Random.color(), Random.word(1)),
        content: body.content,
        createTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
      })
      
      item.comments.push(newComment)
      
      return {
        code: 200,
        data: newComment,
        message: '评论成功'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '失物招领信息不存在'
      }
    }
  },
  
  // 标记为已解决
  'PUT /api/lost-found/:id/mark-solved': (options) => {
    const { id } = options.url.match(/\/api\/lost-found\/([^/]+)\/mark-solved/).slice(1)
    
    const item = lostFoundItems.find(item => item.id === id)
    
    if (item) {
      item.status = 'closed'
      item.updateTime = Random.datetime('yyyy-MM-dd HH:mm:ss')
      
      return {
        code: 200,
        data: item,
        message: '标记成功'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '失物招领信息不存在'
      }
    }
  }
}