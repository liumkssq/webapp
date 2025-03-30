import Mock from 'mockjs'
import { getQueryParams } from '../utils'

const Random = Mock.Random

// 用户数据池
const userPool = Array(50).fill().map((_, index) => {
  const id = index + 1
  const gender = Random.boolean() ? 'male' : 'female'
  return {
    id,
    name: Random.cname(),
    avatar: `https://randomuser.me/api/portraits/${gender === 'male' ? 'men' : 'women'}/${id % 99 || 1}.jpg`,
    gender,
    school: Random.pick(['清华大学', '北京大学', '复旦大学', '上海交通大学', '南京大学']),
    department: Random.pick(['计算机科学与技术', '软件工程', '电子信息工程', '经济学', '工商管理']),
    bio: Random.boolean(0.7) ? Random.csentence(5, 20) : '',
    onlineStatus: Random.boolean(0.7) ? 'online' : 'offline',
    lastActiveTime: Random.date('yyyy-MM-dd HH:mm:ss')
  }
})

// 群聊数据池
const groupPool = Array(20).fill().map((_, index) => {
  const id = index + 10001
  const memberCount = Random.integer(3, 100)
  const name = Random.ctitle(4, 8) + Random.pick(['学习小组', '兴趣小组', '交流群', '同学群'])
  
  return {
    id,
    name,
    avatar: `https://picsum.photos/200?random=${id}`,
    memberCount,
    owner: userPool[Random.integer(0, userPool.length - 1)],
    notice: Random.boolean(0.7) ? Random.csentence(10, 50) : '',
    createTime: Random.date('yyyy-MM-dd HH:mm:ss'),
    members: Array(Math.min(memberCount, 20)).fill().map(() => {
      const user = userPool[Random.integer(0, userPool.length - 1)]
      return {
        ...user,
        role: Random.boolean(0.2) ? 'admin' : 'member',
        joinTime: Random.date('yyyy-MM-dd HH:mm:ss')
      }
    })
  }
})

// 好友关系数据池
const friendRelationships = []

// 为每个用户创建随机的好友关系
userPool.forEach(user => {
  const friendCount = Random.integer(5, 15)
  const friendIds = new Set()
  
  while (friendIds.size < friendCount) {
    const friendId = Random.integer(1, userPool.length)
    if (friendId !== user.id) {
      friendIds.add(friendId)
    }
  }
  
  friendIds.forEach(friendId => {
    const friend = userPool.find(u => u.id === friendId)
    const addTime = Random.date('yyyy-MM-dd HH:mm:ss')
    
    friendRelationships.push({
      userId: user.id,
      friendId,
      note: Random.boolean(0.3) ? `我的${Random.pick(['同学', '室友', '老乡', '朋友'])}` : '',
      addTime,
      addSource: Random.pick(['搜索添加', '群聊中添加', '扫码添加', '附近的人'])
    })
  })
})

// 会话数据池
const conversationPool = []

// 创建私聊会话
friendRelationships.forEach(relation => {
  if (Random.boolean(0.5)) {
    const targetUser = userPool.find(u => u.id === relation.friendId)
    
    if (!targetUser) return
    
    // 创建一个会话
    conversationPool.push({
      id: Random.guid(),
      type: 'private',
      userId: relation.userId,
      targetId: relation.friendId,
      targetInfo: targetUser,
      unreadCount: Random.integer(0, 20),
      lastMessage: Random.boolean(0.8) ? {
        type: Random.pick(['text', 'image', 'voice']),
        content: Random.csentence(5, 20),
        timestamp: Random.date('yyyy-MM-dd HH:mm:ss'),
        senderId: Random.boolean() ? relation.userId : relation.friendId
      } : null,
      isPinned: Random.boolean(0.2),
      isMuted: Random.boolean(0.2),
      createTime: relation.addTime,
      updateTime: Random.date('yyyy-MM-dd HH:mm:ss')
    })
  }
})

// 创建群聊会话
groupPool.forEach(group => {
  const memberIds = group.members.map(member => member.id)
  
  memberIds.forEach(memberId => {
    if (Random.boolean(0.5)) {
      conversationPool.push({
        id: Random.guid(),
        type: 'group',
        userId: memberId,
        targetId: group.id,
        targetInfo: group,
        unreadCount: Random.integer(0, 30),
        lastMessage: Random.boolean(0.8) ? {
          type: Random.pick(['text', 'image', 'voice']),
          content: Random.csentence(5, 20),
          timestamp: Random.date('yyyy-MM-dd HH:mm:ss'),
          senderId: memberIds[Random.integer(0, memberIds.length - 1)]
        } : null,
        isPinned: Random.boolean(0.2),
        isMuted: Random.boolean(0.3),
        createTime: Random.date('yyyy-MM-dd HH:mm:ss'),
        updateTime: Random.date('yyyy-MM-dd HH:mm:ss')
      })
    }
  })
})

// 好友申请数据池
const friendRequestPool = Array(100).fill().map((_, index) => {
  const fromId = Random.integer(1, userPool.length)
  let toId
  
  do {
    toId = Random.integer(1, userPool.length)
  } while (toId === fromId)
  
  return {
    id: index + 1,
    fromId,
    toId,
    message: Random.pick([
      '我是你的同学',
      '请求添加您为好友',
      '我在二手市场看到你的商品',
      '我们是一个班的',
      '我是新生，想多认识一些同学'
    ]),
    status: Random.pick(['pending', 'accepted', 'rejected']),
    time: Random.date('yyyy-MM-dd HH:mm:ss')
  }
})

// 消息数据池
const messagePool = []

// 为每个会话生成一些消息
conversationPool.forEach(conversation => {
  const messageCount = Random.integer(10, 50)
  let currentTime = new Date(conversation.createTime)
  
  if (conversation.type === 'private') {
    const userId = conversation.userId
    const targetId = conversation.targetId
    
    for (let i = 0; i < messageCount; i++) {
      // 随机消息发送者
      const senderId = Random.boolean() ? userId : targetId
      // 消息时间递增
      currentTime = new Date(currentTime.getTime() + Random.integer(60000, 3600000))
      
      // 消息类型
      // 实现加权随机选择（替代 Random.weighted）
      const typeOptions = ['text', 'image', 'voice']
      const weights = [7, 2, 1]
      // 计算权重总和
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
      // 生成一个随机值
      let random = Math.random() * totalWeight
      let messageType = typeOptions[typeOptions.length - 1] // 默认最后一个
      // 根据权重选择
      for (let i = 0; i < weights.length; i++) {
        if (random < weights[i]) {
          messageType = typeOptions[i]
          break
        }
        random -= weights[i]
      }
      let content, duration
      
      if (messageType === 'text') {
        content = Random.csentence(5, 50)
      } else if (messageType === 'image') {
        content = `https://picsum.photos/300/200?random=${Random.integer(1, 1000)}`
      } else if (messageType === 'voice') {
        content = 'audio_url'
        duration = Random.integer(1, 60)
      }
      
      // 消息状态（只有自己发送的消息才有状态）
      let status
      if (senderId === userId) {
        status = Random.pick(['sent', 'delivered', 'read'])
      }
      
      messagePool.push({
        id: Random.guid(),
        conversationId: conversation.id,
        senderId,
        type: messageType,
        content,
        duration,
        timestamp: currentTime.toISOString(),
        status,
        isRecalled: Random.boolean(0.05)
      })
    }
  } else if (conversation.type === 'group') {
    const userId = conversation.userId
    const groupId = conversation.targetId
    const group = groupPool.find(g => g.id === groupId)
    
    if (group) {
      const members = group.members.map(m => m.id)
      
      for (let i = 0; i < messageCount; i++) {
        // 随机消息发送者
        const senderId = Random.pick([...members, userId])
        // 消息时间递增
        currentTime = new Date(currentTime.getTime() + Random.integer(10000, 600000))
        
        // 消息类型
        // 实现加权随机选择（替代 Random.weighted）
        const typeOptions = ['text', 'image', 'voice']
        const weights = [7, 2, 1]
        // 计算权重总和
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
        // 生成一个随机值
        let random = Math.random() * totalWeight
        let messageType = typeOptions[typeOptions.length - 1] // 默认最后一个
        // 根据权重选择
        for (let i = 0; i < weights.length; i++) {
          if (random < weights[i]) {
            messageType = typeOptions[i]
            break
          }
          random -= weights[i]
        }
        let content, duration
        
        if (messageType === 'text') {
          content = Random.csentence(5, 50)
        } else if (messageType === 'image') {
          content = `https://picsum.photos/300/200?random=${Random.integer(1, 1000)}`
        } else if (messageType === 'voice') {
          content = 'audio_url'
          duration = Random.integer(1, 60)
        }
        
        // 消息状态（只有自己发送的消息才有状态）
        let status
        if (senderId === userId) {
          status = Random.pick(['sent', 'delivered', 'read'])
        }
        
        messagePool.push({
          id: Random.guid(),
          conversationId: conversation.id,
          senderId,
          type: messageType,
          content,
          duration,
          timestamp: currentTime.toISOString(),
          status,
          isRecalled: Random.boolean(0.05)
        })
      }
    }
  }
})

// 格式化联系人列表，按首字母分组
const formatContactList = () => {
  // 用户ID为1的好友列表
  const myFriends = friendRelationships
    .filter(relation => relation.userId === 1)
    .map(relation => {
      const friend = userPool.find(user => user.id === relation.friendId)
      return {
        ...friend,
        note: relation.note,
        pinyin: Random.pick(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z']),
        addTime: relation.addTime
      }
    })
  
  // 按拼音首字母分组
  const groupedFriends = {}
  
  myFriends.forEach(friend => {
    const initial = friend.pinyin.charAt(0).toUpperCase()
    if (!groupedFriends[initial]) {
      groupedFriends[initial] = []
    }
    groupedFriends[initial].push(friend)
  })
  
  // 转换为按字母排序的数组
  const sortedKeys = Object.keys(groupedFriends).sort()
  const result = sortedKeys.map(key => ({
    initial: key,
    friends: groupedFriends[key].sort((a, b) => a.pinyin.localeCompare(b.pinyin))
  }))
  
  return result
}

// 模拟接口响应
Mock.mock(new RegExp('/api/im/contacts'), 'get', options => {
  const { url } = options
  const params = getQueryParams(url)
  
  return {
    code: 200,
    message: '获取联系人列表成功',
    data: formatContactList()
  }
})

// 好友申请列表
Mock.mock(new RegExp('/api/im/friend-requests'), 'get', options => {
  const { url } = options
  const params = getQueryParams(url)
  const status = params.status || 'all'
  
  // 过滤我收到的好友申请
  let requests = friendRequestPool.filter(req => req.toId === 1)
  
  if (status !== 'all') {
    requests = requests.filter(req => req.status === status)
  }
  
  // 为每个请求添加用户信息
  requests = requests.map(req => ({
    ...req,
    fromUser: userPool.find(user => user.id === req.fromId)
  }))
  
  return {
    code: 200,
    message: '获取好友申请列表成功',
    data: {
      total: requests.length,
      list: requests
    }
  }
})

// 用户详情
Mock.mock(new RegExp('/api/im/user/\\d+'), 'get', options => {
  const userId = parseInt(options.url.match(/\/api\/im\/user\/(\d+)/)[1])
  const user = userPool.find(u => u.id === userId)
  
  if (!user) {
    return {
      code: 404,
      message: '用户不存在',
      data: null
    }
  }
  
  // 查找是否已经是好友
  const isFriend = friendRelationships.some(
    relation => relation.userId === 1 && relation.friendId === userId
  )
  
  // 查找好友备注
  const friendRelation = friendRelationships.find(
    relation => relation.userId === 1 && relation.friendId === userId
  )
  
  return {
    code: 200,
    message: '获取用户详情成功',
    data: {
      ...user,
      isFriend,
      note: friendRelation?.note || '',
      addTime: friendRelation?.addTime || null
    }
  }
})

// 获取群聊列表
Mock.mock('/api/im/groups', 'get', () => {
  // 我参与的群聊
  const myGroups = conversationPool
    .filter(conv => conv.userId === 1 && conv.type === 'group')
    .map(conv => ({
      ...groupPool.find(g => g.id === conv.targetId),
      conversationId: conv.id
    }))
  
  return {
    code: 200,
    message: '获取群聊列表成功',
    data: myGroups
  }
})

// 会话列表
Mock.mock('/api/im/conversations', 'get', () => {
  // 我的所有会话
  const myConversations = conversationPool.filter(conv => conv.userId === 1)
  
  // 处理会话列表，添加目标信息
  const formattedConversations = myConversations.map(conv => {
    if (conv.type === 'private') {
      const targetUser = userPool.find(u => u.id === conv.targetId)
      // 查找好友备注
      const friendRelation = friendRelationships.find(
        relation => relation.userId === 1 && relation.friendId === conv.targetId
      )
      
      return {
        ...conv,
        targetUser: {
          ...targetUser,
          name: friendRelation?.note || targetUser.name
        }
      }
    } else if (conv.type === 'group') {
      const group = groupPool.find(g => g.id === conv.targetId)
      return {
        ...conv,
        targetUser: {
          id: group.id,
          name: group.name,
          avatar: group.avatar
        }
      }
    }
    return conv
  })
  
  // 按照更新时间排序
  return {
    code: 200,
    message: '获取会话列表成功',
    data: formattedConversations.sort((a, b) => {
      return new Date(b.updateTime) - new Date(a.updateTime)
    })
  }
})

// 会话详情
Mock.mock(new RegExp('/api/im/conversation/\\w+'), 'get', options => {
  const conversationId = options.url.match(/\/api\/im\/conversation\/(\w+)/)[1]
  const conversation = conversationPool.find(c => c.id === conversationId)
  
  if (!conversation) {
    return {
      code: 404,
      message: '会话不存在',
      data: null
    }
  }
  
  let targetInfo
  
  if (conversation.type === 'private') {
    const targetUser = userPool.find(u => u.id === conversation.targetId)
    // 查找好友备注
    const friendRelation = friendRelationships.find(
      relation => relation.userId === 1 && relation.friendId === conversation.targetId
    )
    
    targetInfo = {
      ...targetUser,
      name: friendRelation?.note || targetUser.name
    }
  } else if (conversation.type === 'group') {
    const group = groupPool.find(g => g.id === conversation.targetId)
    targetInfo = group
  }
  
  return {
    code: 200,
    message: '获取会话详情成功',
    data: {
      ...conversation,
      targetUser: targetInfo
    }
  }
})

// 消息历史
Mock.mock(new RegExp('/api/im/messages'), 'get', options => {
  const { url } = options
  const params = getQueryParams(url)
  const conversationId = params.conversationId
  const page = parseInt(params.page) || 1
  const limit = parseInt(params.limit) || 20
  
  if (!conversationId) {
    return {
      code: 400,
      message: '缺少会话ID',
      data: null
    }
  }
  
  // 查找会话的所有消息
  const messages = messagePool
    .filter(msg => msg.conversationId === conversationId)
    // 按时间排序，最新的在后面
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  
  const total = messages.length
  const hasMore = page * limit < total
  
  // 分页获取消息
  const startIndex = Math.max(0, total - page * limit)
  const endIndex = Math.max(0, total - (page - 1) * limit)
  const pageMessages = messages.slice(startIndex, endIndex).reverse()
  
  return {
    code: 200,
    message: '获取聊天记录成功',
    data: {
      total,
      hasMore,
      list: pageMessages.map(msg => {
        // 添加发送者信息
        const sender = userPool.find(u => u.id === msg.senderId)
        return {
          ...msg,
          sender: sender ? {
            id: sender.id,
            name: sender.name,
            avatar: sender.avatar
          } : null
        }
      })
    }
  }
})

// 搜索联系人
Mock.mock(new RegExp('/api/im/search-contacts'), 'get', options => {
  const { url } = options
  const params = getQueryParams(url)
  const keyword = params.keyword || ''
  
  if (!keyword.trim()) {
    return {
      code: 200,
      message: '搜索联系人成功',
      data: []
    }
  }
  
  // 搜索用户池中的用户
  const searchResults = userPool.filter(user => {
    // 排除自己
    if (user.id === 1) return false
    
    // 搜索名字或学校或院系
    return (
      user.name.includes(keyword) ||
      user.school.includes(keyword) ||
      user.department.includes(keyword)
    )
  })
  
  // 为搜索结果添加好友关系标记
  const resultsWithFriendInfo = searchResults.map(user => {
    const isFriend = friendRelationships.some(
      relation => relation.userId === 1 && relation.friendId === user.id
    )
    
    const friendRelation = friendRelationships.find(
      relation => relation.userId === 1 && relation.friendId === user.id
    )
    
    return {
      ...user,
      isFriend,
      note: friendRelation?.note || ''
    }
  })
  
  return {
    code: 200,
    message: '搜索联系人成功',
    data: resultsWithFriendInfo.slice(0, 20) // 最多返回20条
  }
})

export default {
  userPool,
  groupPool,
  friendRelationships,
  conversationPool,
  friendRequestPool,
  messagePool
}