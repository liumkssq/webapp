import { mock } from 'mockjs'
import { param2Obj } from '../utils'

// 生成用户头像
const generateAvatar = (userId) => {
  const avatars = [
    'https://img01.yzcdn.cn/vant/cat.jpeg',
    'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg',
    'https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg',
    'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
  ]
  return avatars[userId % avatars.length]
}

// 生成随机用户
const generateUser = (id) => {
  return {
    id,
    name: mock('@cname'),
    avatar: generateAvatar(id),
    status: mock('@pick(["online", "offline", "busy"])')
  }
}

// 生成随机消息内容
const generateMessageContent = (type) => {
  if (type === 'text') {
    return mock('@sentence(3, 20)')
  } else if (type === 'image') {
    return { url: mock('@image("200x200")') }
  } else if (type === 'voice') {
    return { url: 'https://example.com/voice.mp3', duration: mock('@integer(1, 60)') }
  } else {
    return { url: 'https://example.com/file.pdf' }
  }
}

// 生成随机消息
const generateMessage = (id, conversationType, targetId, senderId) => {
  const messageType = mock('@pick(["text", "image", "voice", "file"])');
  return {
    id,
    conversationType,
    targetId,
    senderId,
    senderName: `User ${senderId}`,
    senderAvatar: generateAvatar(senderId),
    type: messageType,
    content: generateMessageContent(messageType),
    timestamp: mock('@datetime("yyyy-MM-dd HH:mm:ss")'),
    status: 'sent',
    isRecalled: false
  }
}

// 生成随机群组
const generateGroup = (id) => {
  const memberCount = mock('@integer(3, 20)')
  const members = Array.from({ length: memberCount }, (_, i) => {
    const userId = mock('@integer(1, 100)')
    let role = 'member'
    if (i === 0) role = 'owner'
    else if (i < 3) role = 'admin'
    
    return {
      id: userId,
      name: mock('@cname'),
      avatar: generateAvatar(userId),
      role,
      joinTime: mock('@datetime("yyyy-MM-dd HH:mm:ss")')
    }
  })
  
  return {
    id,
    name: `${mock('@ctitle(2, 5)')}群`,
    avatar: '',
    description: mock('@cparagraph(1, 3)'),
    announcement: mock('@cparagraph(1, 2)'),
    memberCount,
    members,
    lastMessage: members.length > 0 ? generateMessage(mock('@id'), 'group', id, members[mock('@integer(0, ' + (members.length - 1) + ')')].id) : null,
    lastActiveTime: mock('@datetime("yyyy-MM-dd HH:mm:ss")'),
    unreadCount: mock('@integer(0, 99)'),
    isMuted: mock('@boolean'),
    isSticky: mock('@boolean')
  }
}

// 生成随机好友请求
const generateFriendRequest = (id) => {
  const userId = mock('@integer(1, 100)')
  return {
    id,
    userId,
    userName: mock('@cname'),
    userAvatar: generateAvatar(userId),
    message: mock('@sentence(3, 10)'),
    status: mock('@pick(["pending", "accepted", "rejected"])'),
    createTime: mock('@datetime("yyyy-MM-dd HH:mm:ss")')
  }
}

// 预生成一些数据
const mockUsers = Array.from({ length: 50 }, (_, i) => generateUser(i + 1))
const mockGroups = Array.from({ length: 10 }, (_, i) => generateGroup(i + 1))
const mockFriendRequests = Array.from({ length: 15 }, (_, i) => generateFriendRequest(i + 1))

// 初始化会话列表数据
const mockConversations = []

// 添加私聊会话
mockUsers.slice(0, 15).forEach(user => {
  const messageCount = mock('@integer(0, 20)')
  const messages = Array.from({ length: messageCount }, (_, i) => {
    const senderId = mock('@boolean') ? 1 : user.id
    return generateMessage(i + 1, 'private', senderId === 1 ? user.id : 1, senderId)
  }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  
  mockConversations.push({
    id: `private_${user.id}`,
    type: 'private',
    targetId: user.id,
    targetInfo: user,
    lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
    lastActiveTime: messages.length > 0 ? messages[messages.length - 1].timestamp : mock('@datetime("yyyy-MM-dd HH:mm:ss")'),
    unreadCount: mock('@integer(0, 30)'),
    isMuted: mock('@boolean'),
    isSticky: mock('@boolean')
  })
})

// 添加群聊会话
mockGroups.forEach(group => {
  const messageCount = mock('@integer(0, 30)')
  const messages = Array.from({ length: messageCount }, (_, i) => {
    const sender = group.members[mock('@integer(0, ' + (group.members.length - 1) + ')')]
    return generateMessage(i + 1, 'group', group.id, sender.id)
  }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  
  mockConversations.push({
    id: `group_${group.id}`,
    type: 'group',
    targetId: group.id,
    targetInfo: group,
    lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
    lastActiveTime: messages.length > 0 ? messages[messages.length - 1].timestamp : mock('@datetime("yyyy-MM-dd HH:mm:ss")'),
    unreadCount: mock('@integer(0, 99)'),
    isMuted: mock('@boolean'),
    isSticky: mock('@boolean')
  })
})

// 按最后活跃时间排序会话列表
mockConversations.sort((a, b) => new Date(b.lastActiveTime) - new Date(a.lastActiveTime))

export default {
  // 获取好友列表
  'GET /api/im/friends': (config) => {
    return {
      code: 200,
      data: mockUsers.slice(0, 20),
      message: 'success'
    }
  },
  
  // 获取好友申请列表
  'GET /api/im/friend-requests': (config) => {
    const { status } = param2Obj(config.url)
    let result = [...mockFriendRequests]
    
    if (status) {
      result = result.filter(request => request.status === status)
    }
    
    return {
      code: 200,
      data: {
        list: result,
        total: result.length
      },
      message: 'success'
    }
  },
  
  // 发送好友申请
  'POST /api/im/friend-requests': (config) => {
    const { userId, message } = JSON.parse(config.body)
    const user = mockUsers.find(user => user.id === userId)
    
    if (!user) {
      return {
        code: 400,
        message: '用户不存在'
      }
    }
    
    const newRequest = {
      id: mockFriendRequests.length + 1,
      userId,
      userName: user.name,
      userAvatar: user.avatar,
      message: message || '请求添加您为好友',
      status: 'pending',
      createTime: new Date().toISOString()
    }
    
    mockFriendRequests.push(newRequest)
    
    return {
      code: 200,
      data: newRequest,
      message: 'success'
    }
  },
  
  // 处理好友申请
  'PUT /api/im/friend-requests/:id': (config) => {
    const id = parseInt(config.url.match(/\/friend-requests\/(\d+)/)[1])
    const { action } = JSON.parse(config.body)
    
    const requestIndex = mockFriendRequests.findIndex(req => req.id === id)
    if (requestIndex === -1) {
      return {
        code: 400,
        message: '申请不存在'
      }
    }
    
    mockFriendRequests[requestIndex].status = action === 'accept' ? 'accepted' : 'rejected'
    
    return {
      code: 200,
      data: null,
      message: 'success'
    }
  },
  
  // 删除好友
  'DELETE /api/im/friends/:id': (config) => {
    return {
      code: 200,
      data: null,
      message: 'success'
    }
  },
  
  // 获取群组列表
  'GET /api/im/groups': (config) => {
    return {
      code: 200,
      data: mockGroups,
      message: 'success'
    }
  },
  
  // 获取群组详情
  'GET /api/im/groups/:id': (config) => {
    const id = parseInt(config.url.match(/\/groups\/(\d+)/)[1])
    const group = mockGroups.find(group => group.id === id)
    
    if (!group) {
      return {
        code: 400,
        message: '群组不存在'
      }
    }
    
    return {
      code: 200,
      data: group,
      message: 'success'
    }
  },
  
  // 创建群组
  'POST /api/im/groups': (config) => {
    const { name, description, memberIds = [] } = JSON.parse(config.body)
    
    const members = [
      {
        id: 1, // 当前用户
        name: '当前用户',
        avatar: generateAvatar(1),
        role: 'owner',
        joinTime: new Date().toISOString()
      }
    ]
    
    // 添加初始成员
    if (memberIds.length > 0) {
      memberIds.forEach(id => {
        const user = mockUsers.find(user => user.id === id)
        if (user) {
          members.push({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            role: 'member',
            joinTime: new Date().toISOString()
          })
        }
      })
    }
    
    const newGroup = {
      id: mockGroups.length + 1,
      name,
      avatar: '',
      description: description || '',
      announcement: '',
      memberCount: members.length,
      members,
      lastMessage: null,
      lastActiveTime: new Date().toISOString(),
      unreadCount: 0,
      isMuted: false,
      isSticky: false
    }
    
    mockGroups.push(newGroup)
    
    // 添加会话
    mockConversations.push({
      id: `group_${newGroup.id}`,
      type: 'group',
      targetId: newGroup.id,
      targetInfo: newGroup,
      lastMessage: null,
      lastActiveTime: new Date().toISOString(),
      unreadCount: 0,
      isMuted: false,
      isSticky: false
    })
    
    return {
      code: 200,
      data: newGroup,
      message: 'success'
    }
  },
  
  // 更新群组信息
  'PUT /api/im/groups/:id': (config) => {
    const id = parseInt(config.url.match(/\/groups\/(\d+)/)[1])
    const updateData = JSON.parse(config.body)
    
    const groupIndex = mockGroups.findIndex(group => group.id === id)
    if (groupIndex === -1) {
      return {
        code: 400,
        message: '群组不存在'
      }
    }
    
    mockGroups[groupIndex] = {
      ...mockGroups[groupIndex],
      ...updateData
    }
    
    return {
      code: 200,
      data: mockGroups[groupIndex],
      message: 'success'
    }
  },
  
  // 解散群组
  'DELETE /api/im/groups/:id': (config) => {
    const id = parseInt(config.url.match(/\/groups\/(\d+)/)[1])
    
    const groupIndex = mockGroups.findIndex(group => group.id === id)
    if (groupIndex === -1) {
      return {
        code: 400,
        message: '群组不存在'
      }
    }
    
    // 移除群组
    mockGroups.splice(groupIndex, 1)
    
    // 移除对应的会话
    const conversationIndex = mockConversations.findIndex(
      conv => conv.type === 'group' && conv.targetId === id
    )
    if (conversationIndex !== -1) {
      mockConversations.splice(conversationIndex, 1)
    }
    
    return {
      code: 200,
      data: null,
      message: 'success'
    }
  },
  
  // 获取消息列表
  'GET /api/im/messages': (config) => {
    const { conversationType, targetId, lastMessageId, pageSize = 20 } = param2Obj(config.url)
    
    let conversation
    if (conversationType === 'private') {
      conversation = mockConversations.find(
        conv => conv.type === 'private' && conv.targetId === parseInt(targetId)
      )
    } else {
      conversation = mockConversations.find(
        conv => conv.type === 'group' && conv.targetId === parseInt(targetId)
      )
    }
    
    if (!conversation) {
      return {
        code: 200,
        data: {
          list: [],
          hasMore: false
        },
        message: 'success'
      }
    }
    
    // 模拟生成消息
    const totalCount = mock('@integer(20, 50)')
    const messages = Array.from({ length: totalCount }, (_, i) => {
      let senderId
      if (conversationType === 'private') {
        senderId = mock('@boolean') ? 1 : parseInt(targetId)
      } else {
        const group = mockGroups.find(g => g.id === parseInt(targetId))
        if (group && group.members.length > 0) {
          const sender = group.members[mock('@integer(0, ' + (group.members.length - 1) + ')')]
          senderId = sender.id
        } else {
          senderId = mock('@integer(1, 100)')
        }
      }
      
      return generateMessage(
        i + 1,
        conversationType,
        parseInt(targetId),
        senderId
      )
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    // 根据lastMessageId分页
    let startIndex = 0
    if (lastMessageId) {
      const lastIndex = messages.findIndex(msg => msg.id === parseInt(lastMessageId))
      if (lastIndex !== -1) {
        startIndex = lastIndex + 1
      }
    }
    
    const result = messages.slice(startIndex, startIndex + parseInt(pageSize))
    
    return {
      code: 200,
      data: {
        list: result,
        hasMore: startIndex + parseInt(pageSize) < messages.length
      },
      message: 'success'
    }
  },
  
  // 发送消息
  'POST /api/im/messages': (config) => {
    const { conversationType, targetId, messageType, content } = JSON.parse(config.body)
    
    // 生成新消息
    const newMessage = {
      id: mock('@id'),
      conversationType,
      targetId,
      senderId: 1, // 当前用户
      senderName: '当前用户',
      senderAvatar: generateAvatar(1),
      type: messageType,
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
      isRecalled: false
    }
    
    // 更新会话的最后一条消息
    const conversationIndex = mockConversations.findIndex(
      conv => conv.type === conversationType && conv.targetId === targetId
    )
    
    if (conversationIndex !== -1) {
      mockConversations[conversationIndex].lastMessage = newMessage
      mockConversations[conversationIndex].lastActiveTime = newMessage.timestamp
      
      // 将此会话移到顶部
      const conversation = mockConversations.splice(conversationIndex, 1)[0]
      mockConversations.unshift(conversation)
    } else {
      // 如果会话不存在，创建新会话
      let targetInfo
      if (conversationType === 'private') {
        targetInfo = mockUsers.find(user => user.id === targetId) || {
          id: targetId,
          name: `用户${targetId}`,
          avatar: generateAvatar(targetId)
        }
      } else {
        targetInfo = mockGroups.find(group => group.id === targetId) || {
          id: targetId,
          name: `群组${targetId}`,
          avatar: ''
        }
      }
      
      mockConversations.unshift({
        id: `${conversationType}_${targetId}`,
        type: conversationType,
        targetId,
        targetInfo,
        lastMessage: newMessage,
        lastActiveTime: newMessage.timestamp,
        unreadCount: 0,
        isMuted: false,
        isSticky: false
      })
    }
    
    return {
      code: 200,
      data: newMessage,
      message: 'success'
    }
  },
  
  // 撤回消息
  'PUT /api/im/messages/:id/recall': (config) => {
    return {
      code: 200,
      data: null,
      message: 'success'
    }
  },
  
  // 获取会话列表
  'GET /api/im/conversations': (config) => {
    // 按置顶状态和最后活跃时间排序
    const sortedConversations = [...mockConversations].sort((a, b) => {
      if (a.isSticky && !b.isSticky) return -1
      if (!a.isSticky && b.isSticky) return 1
      return new Date(b.lastActiveTime) - new Date(a.lastActiveTime)
    })
    
    return {
      code: 200,
      data: sortedConversations,
      message: 'success'
    }
  },
  
  // 获取会话详情
  'GET /api/im/conversations/detail': (config) => {
    const { conversationType, targetId } = param2Obj(config.url)
    
    const conversation = mockConversations.find(
      conv => conv.type === conversationType && conv.targetId === parseInt(targetId)
    )
    
    if (!conversation) {
      // 创建新会话对象
      let targetInfo
      if (conversationType === 'private') {
        targetInfo = mockUsers.find(user => user.id === parseInt(targetId)) || {
          id: parseInt(targetId),
          name: `用户${targetId}`,
          avatar: generateAvatar(parseInt(targetId))
        }
      } else {
        targetInfo = mockGroups.find(group => group.id === parseInt(targetId)) || {
          id: parseInt(targetId),
          name: `群组${targetId}`,
          avatar: ''
        }
      }
      
      return {
        code: 200,
        data: {
          id: `${conversationType}_${targetId}`,
          type: conversationType,
          targetId: parseInt(targetId),
          targetInfo,
          lastMessage: null,
          lastActiveTime: new Date().toISOString(),
          unreadCount: 0,
          isMuted: false,
          isSticky: false
        },
        message: 'success'
      }
    }
    
    return {
      code: 200,
      data: conversation,
      message: 'success'
    }
  },
  
  // 设置会话置顶
  'PUT /api/im/conversations/sticky': (config) => {
    const { conversationType, targetId, isSticky } = JSON.parse(config.body)
    
    const conversationIndex = mockConversations.findIndex(
      conv => conv.type === conversationType && conv.targetId === targetId
    )
    
    if (conversationIndex !== -1) {
      mockConversations[conversationIndex].isSticky = isSticky
    }
    
    return {
      code: 200,
      data: null,
      message: 'success'
    }
  },
  
  // 设置会话免打扰
  'PUT /api/im/conversations/muted': (config) => {
    const { conversationType, targetId, isMuted } = JSON.parse(config.body)
    
    const conversationIndex = mockConversations.findIndex(
      conv => conv.type === conversationType && conv.targetId === targetId
    )
    
    if (conversationIndex !== -1) {
      mockConversations[conversationIndex].isMuted = isMuted
    }
    
    return {
      code: 200,
      data: null,
      message: 'success'
    }
  },
  
  // 删除会话
  'DELETE /api/im/conversations': (config) => {
    const { conversationType, targetId } = JSON.parse(config.body)
    
    const conversationIndex = mockConversations.findIndex(
      conv => conv.type === conversationType && conv.targetId === targetId
    )
    
    if (conversationIndex !== -1) {
      mockConversations.splice(conversationIndex, 1)
    }
    
    return {
      code: 200,
      data: null,
      message: 'success'
    }
  },
  
  // 用户在线状态
  'POST /api/im/users/online-status': (config) => {
    const { userIds } = JSON.parse(config.body)
    
    const result = {}
    userIds.forEach(id => {
      const user = mockUsers.find(user => user.id === id)
      result[id] = user ? user.status : 'offline'
    })
    
    return {
      code: 200,
      data: result,
      message: 'success'
    }
  }
} 