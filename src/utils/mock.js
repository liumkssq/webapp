// 生成模拟数据
export function generateMockData(type, params = {}) {
  switch (type) {
    // IM功能的模拟数据
    case 'contactList':
      return generateContactList()
    case 'friendRequests':
      return generateFriendRequests(params)
    case 'userInfo':
      return generateUserInfo(params.id)
    case 'userDetail':
      return generateUserDetail(params.id)
    case 'groupList':
      return generateGroupList()
    case 'groupInfo':
      return generateGroupInfo(params.id)
    case 'conversationList':
      return generateConversationList()
    case 'chatMessages':
      return generateChatMessages(params)
    case 'searchContacts':
      return generateSearchContacts(params.keyword)
    case 'conversationDetail':
      return generateConversationDetail(params.id)
    
    default:
      return {}
  }
}

// 生成联系人列表（按字母分组）
function generateContactList() {
  // 生成26个字母
  const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
  
  // 随机选择10个字母作为有联系人的分组
  const activeLetters = letters
    .sort(() => Math.random() - 0.5)
    .slice(0, 10)
    .sort()
  
  // 创建分组结构
  const groups = activeLetters.map(letter => {
    // 每组1-5个联系人
    const count = Math.floor(Math.random() * 5) + 1
    
    return {
      letter,
      contacts: Array.from({ length: count }, (_, i) => {
        const id = Math.floor(Math.random() * 1000) + 1
        const name = getRandomName()
        return {
          id,
          userId: id,
          name,
          avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${id % 99}.jpg`,
          note: Math.random() > 0.7 ? `我的${getRandomRole()}` : '',
          onlineStatus: Math.random() > 0.3 ? 'online' : 'offline',
          lastActiveTime: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        }
      })
    }
  })
  
  return {
    groups,
    total: groups.reduce((sum, group) => sum + group.contacts.length, 0)
  }
}

// 生成好友申请列表
function generateFriendRequests(params) {
  const { status = 'all' } = params
  const count = Math.floor(Math.random() * 5) + (status === 'pending' ? 1 : 3)
  
  let requests = Array.from({ length: count }, (_, i) => {
    const id = Math.floor(Math.random() * 1000) + 1
    const requestStatus = ['pending', 'accepted', 'rejected'][Math.floor(Math.random() * 3)]
    
    return {
      id: Math.floor(Math.random() * 10000),
      userId: id,
      name: getRandomName(),
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${id % 99}.jpg`,
      message: ['想加你为好友', '我是你的同学', '我是你的校友', '我在二手市场看到你的商品'][Math.floor(Math.random() * 4)],
      time: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
      status: requestStatus
    }
  })
  
  // 根据状态筛选
  if (status !== 'all') {
    requests = requests.filter(req => req.status === status)
    
    // 确保至少有一条待处理请求
    if (status === 'pending' && requests.length === 0) {
      const id = Math.floor(Math.random() * 1000) + 1
      requests.push({
        id: Math.floor(Math.random() * 10000),
        userId: id,
        name: getRandomName(),
        avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${id % 99}.jpg`,
        message: ['想加你为好友', '我是你的同学', '我是你的校友', '我在二手市场看到你的商品'][Math.floor(Math.random() * 4)],
        time: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
        status: 'pending'
      })
    }
  }
  
  return {
    list: requests,
    total: requests.length
  }
}

// 生成用户信息
function generateUserInfo(id) {
  const gender = Math.random() > 0.5 ? 'male' : 'female'
  
  return {
    id: Number(id) || Math.floor(Math.random() * 1000) + 1,
    name: getRandomName(),
    avatar: `https://randomuser.me/api/portraits/${gender === 'male' ? 'men' : 'women'}/${id % 99 || Math.floor(Math.random() * 99)}.jpg`,
    gender,
    school: ['清华大学', '北京大学', '复旦大学', '上海交通大学', '南京大学'][Math.floor(Math.random() * 5)],
    department: ['计算机科学与技术', '软件工程', '电子信息工程', '经济学', '工商管理'][Math.floor(Math.random() * 5)],
    bio: Math.random() > 0.5 ? ['热爱生活', '学习使我快乐', '探索未知的世界', '做一个善良的人', '永远年轻,永远热泪盈眶'][Math.floor(Math.random() * 5)] : '',
    isFriend: Math.random() > 0.3
  }
}

// 生成详细用户信息
function generateUserDetail(id) {
  const basic = generateUserInfo(id)
  const isFriend = basic.isFriend
  
  return {
    ...basic,
    onlineStatus: Math.random() > 0.3 ? 'online' : 'offline',
    lastActiveTime: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    note: isFriend && Math.random() > 0.7 ? `我的${getRandomRole()}` : '',
    friendStatus: isFriend ? 'friend' : (Math.random() > 0.5 ? 'none' : 'pending'),
    mutualFriends: isFriend ? Math.floor(Math.random() * 10) : 0,
    addSource: isFriend ? ['搜索添加', '群聊中添加', '扫码添加', '附近的人'][Math.floor(Math.random() * 4)] : null,
    addTime: isFriend ? new Date(Date.now() - Math.random() * 86400000 * 30).toISOString() : null
  }
}

// 生成群聊列表
function generateGroupList() {
  const count = Math.floor(Math.random() * 5) + 3
  
  const groups = Array.from({ length: count }, (_, i) => {
    const id = Math.floor(Math.random() * 10000) + 1
    const memberCount = Math.floor(Math.random() * 100) + 3
    
    return {
      id,
      name: getRandomGroupName(),
      avatar: `https://picsum.photos/200?random=${id}`,
      memberCount,
      isOwner: Math.random() > 0.8,
      lastActiveTime: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
      notice: Math.random() > 0.5 ? getRandomGroupNotice() : ''
    }
  })
  
  return {
    list: groups,
    total: groups.length
  }
}

// 生成群聊详情
function generateGroupInfo(id) {
  const memberCount = Math.floor(Math.random() * 100) + 3
  const isOwner = Math.random() > 0.8
  
  return {
    id: Number(id) || Math.floor(Math.random() * 10000) + 1,
    name: getRandomGroupName(),
    avatar: `https://picsum.photos/200?random=${id}`,
    memberCount,
    isOwner,
    lastActiveTime: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    notice: Math.random() > 0.3 ? getRandomGroupNotice() : '',
    createTime: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    owner: {
      id: Math.floor(Math.random() * 1000) + 1,
      name: getRandomName(),
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`,
    },
    members: Array.from({ length: Math.min(memberCount, 20) }, () => {
      const memberId = Math.floor(Math.random() * 1000) + 1
      return {
        id: memberId,
        name: getRandomName(),
        avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${memberId % 99}.jpg`,
        role: Math.random() > 0.9 ? 'admin' : 'member',
        joinTime: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
      }
    })
  }
}

// 生成会话列表
function generateConversationList() {
  const count = Math.floor(Math.random() * 10) + 5
  
  return Array.from({ length: count }, (_, i) => {
    const id = Math.floor(Math.random() * 1000) + 1
    const isGroup = Math.random() > 0.7
    const unreadCount = Math.random() > 0.6 ? Math.floor(Math.random() * 20) + 1 : 0
    const lastMessageTime = new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
    
    // 生成最后一条消息
    const messageTypes = ['text', 'image', 'voice']
    const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)]
    let messageContent
    let duration
    
    if (messageType === 'text') {
      messageContent = getRandomMessage()
    } else if (messageType === 'image') {
      messageContent = 'https://picsum.photos/300/200'
    } else if (messageType === 'voice') {
      messageContent = 'audio_url'
      duration = Math.floor(Math.random() * 60) + 1
    }
    
    const lastMessage = Math.random() > 0.1 ? {
      type: messageType,
      content: messageContent,
      duration,
      timestamp: lastMessageTime,
      senderId: Math.random() > 0.5 ? id : 0 // 0表示自己发送的
    } : null
    
    if (isGroup) {
      // 群聊
      return {
        id,
        type: 'group',
        targetId: id,
        targetInfo: {
          id,
          name: getRandomGroupName(),
          avatar: `https://picsum.photos/200?random=${id}`,
          memberCount: Math.floor(Math.random() * 100) + 3
        },
        lastMessage,
        unreadCount,
        isPinned: Math.random() > 0.8,
        isMuted: Math.random() > 0.8,
        updateTime: lastMessageTime
      }
    } else {
      // 私聊
      return {
        id,
        type: 'private',
        targetId: id,
        targetInfo: {
          id,
          name: getRandomName(),
          avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${id % 99}.jpg`,
          onlineStatus: Math.random() > 0.3 ? 'online' : 'offline'
        },
        lastMessage,
        unreadCount,
        isPinned: Math.random() > 0.8,
        isMuted: Math.random() > 0.8,
        updateTime: lastMessageTime
      }
    }
  })
}

// 生成聊天消息
function generateChatMessages(params) {
  const { conversationId, page = 1, limit = 20 } = params
  const count = Math.min(Math.floor(Math.random() * 10) + 10, limit)
  const total = page === 1 ? Math.floor(Math.random() * 100) + count : 100
  
  const isGroup = Math.random() > 0.7
  const targetId = Number(conversationId) || Math.floor(Math.random() * 1000) + 1
  
  // 可能的消息发送者
  let possibleSenders
  if (isGroup) {
    // 群聊中可能有多个发送者
    const senderCount = Math.floor(Math.random() * 5) + 2
    possibleSenders = Array.from({ length: senderCount }, (_, i) => {
      const senderId = Math.floor(Math.random() * 1000) + 1
      return {
        id: senderId,
        name: getRandomName(),
        avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${senderId % 99}.jpg`,
      }
    })
  } else {
    // 私聊只有两个人
    possibleSenders = [
      { id: 0, name: '我', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' }, // 自己
      { 
        id: targetId, 
        name: getRandomName(), 
        avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${targetId % 99}.jpg` 
      } // 对方
    ]
  }
  
  // 生成消息
  const messages = []
  let currentTime = new Date()
  
  for (let i = 0; i < count; i++) {
    const sender = possibleSenders[Math.floor(Math.random() * possibleSenders.length)]
    const isSelf = sender.id === 0
    
    // 消息时间递减
    currentTime = new Date(currentTime.getTime() - Math.floor(Math.random() * 1000000))
    
    // 消息类型
    const messageTypes = ['text', 'image', 'voice']
    const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)]
    let content, duration
    
    if (messageType === 'text') {
      content = getRandomMessage()
    } else if (messageType === 'image') {
      content = `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 1000)}`
    } else if (messageType === 'voice') {
      content = 'audio_url'
      duration = Math.floor(Math.random() * 60) + 1
    }
    
    // 消息状态（只有自己发送的消息才有状态）
    let status
    if (isSelf) {
      const statuses = ['sending', 'sent', 'delivered', 'read', 'failed']
      const weights = [0.05, 0.1, 0.2, 0.6, 0.05] // 权重，大部分是已读状态
      
      let random = Math.random()
      for (let j = 0; j < weights.length; j++) {
        if (random < weights[j]) {
          status = statuses[j]
          break
        }
        random -= weights[j]
      }
    }
    
    messages.push({
      id: Math.floor(Math.random() * 100000),
      conversationId: targetId,
      senderId: sender.id,
      senderInfo: sender,
      type: messageType,
      content,
      duration,
      timestamp: currentTime.toISOString(),
      status,
      isRecalled: Math.random() > 0.95 // 5%概率是撤回的消息
    })
  }
  
  // 按照时间倒序排序（新消息在前）
  messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  
  return {
    list: messages,
    page,
    limit,
    total,
    hasMore: page * limit < total
  }
}

// 生成联系人搜索结果
function generateSearchContacts(keyword) {
  if (!keyword) return { list: [], total: 0 }
  
  const count = Math.floor(Math.random() * 5) + 1
  
  const results = Array.from({ length: count }, (_, i) => {
    const id = Math.floor(Math.random() * 1000) + 1
    const name = getRandomName()
    const isFriend = Math.random() > 0.5
    
    return {
      id,
      name,
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${id % 99}.jpg`,
      school: ['清华大学', '北京大学', '复旦大学', '上海交通大学', '南京大学'][Math.floor(Math.random() * 5)],
      department: ['计算机科学与技术', '软件工程', '电子信息工程', '经济学', '工商管理'][Math.floor(Math.random() * 5)],
      isFriend,
      matchField: Math.random() > 0.5 ? 'name' : 'school' // 匹配到的字段
    }
  })
  
  return {
    list: results,
    total: results.length
  }
}

// 生成会话详情
function generateConversationDetail(id) {
  const isGroup = Math.random() > 0.7
  const targetId = Number(id) || Math.floor(Math.random() * 1000) + 1
  
  if (isGroup) {
    // 群聊详情
    return {
      id: targetId,
      type: 'group',
      targetId,
      targetInfo: {
        id: targetId,
        name: getRandomGroupName(),
        avatar: `https://picsum.photos/200?random=${targetId}`,
        memberCount: Math.floor(Math.random() * 100) + 3,
        notice: Math.random() > 0.5 ? getRandomGroupNotice() : '',
        isOwner: Math.random() > 0.8
      },
      isPinned: Math.random() > 0.8,
      isMuted: Math.random() > 0.8,
      createTime: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      updateTime: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
    }
  } else {
    // 私聊详情
    return {
      id: targetId,
      type: 'private',
      targetId,
      targetInfo: {
        id: targetId,
        name: getRandomName(),
        avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${targetId % 99}.jpg`,
        onlineStatus: Math.random() > 0.3 ? 'online' : 'offline',
        lastActiveTime: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
      },
      isPinned: Math.random() > 0.8,
      isMuted: Math.random() > 0.8,
      createTime: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      updateTime: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
    }
  }
}

// 随机生成姓名
function getRandomName() {
  const firstNames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗']
  const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '秀兰', '霞']
  
  return firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)]
}

// 随机生成角色
function getRandomRole() {
  const roles = ['同学', '室友', '老乡', '同事', '朋友', '学长', '学弟', '师兄', '师妹']
  return roles[Math.floor(Math.random() * roles.length)]
}

// 随机生成群名称
function getRandomGroupName() {
  const prefixes = ['快乐', '阳光', '星辰', '梦想', '未来', '青春', '活力', '智慧', '创新', '友谊']
  const types = ['学习小组', '兴趣小组', '交流群', '同学群', '社团群', '项目组', '志愿者', '课题组', '班级群', '宿舍群']
  
  return prefixes[Math.floor(Math.random() * prefixes.length)] + types[Math.floor(Math.random() * types.length)]
}

// 随机生成群公告
function getRandomGroupNotice() {
  const notices = [
    '欢迎加入本群，请大家自觉遵守群规则',
    '群内禁止发广告，违者踢出',
    '本周日下午3点在图书馆集合，讨论期末项目',
    '有问题请@管理员，不要私聊打扰',
    '分享有关学习的资源，一起进步',
    '群公告更新：本月25日为截止日期，请大家按时提交作业',
    '本群为学习交流群，请勿闲聊',
    '欢迎新成员介绍自己，增进了解',
    '下周一开始，每晚8点在线答疑',
    '重要通知：明天上午10点有线上讲座，链接稍后发布'
  ]
  
  return notices[Math.floor(Math.random() * notices.length)]
}

// 随机生成聊天消息
function getRandomMessage() {
  const messages = [
    '你好啊，最近怎么样？',
    '今天天气真不错',
    '你看到那个通知了吗？',
    '周末有什么计划？',
    '我刚买了一本很不错的书，推荐给你',
    '作业做完了吗？我有几道题不太懂',
    '明天下午有空吗？一起去图书馆',
    '谢谢你的帮助！',
    '考试加油！',
    '我这边刚忙完，现在可以聊了',
    '你知道最近食堂有什么活动吗？',
    '新学期开始了，你选了哪些课？',
    '我在二手市场看到一个很适合你的东西',
    '有一个课题想和你讨论一下',
    '听说你最近在做义工？感觉怎么样？',
    '这个周末有个讲座，你要一起去吗？',
    '你的那个失物招领帖有人回复了吗？',
    '我觉得这次考试难度还可以',
    '你的宿舍条件怎么样？',
    '我们系下周有个活动，你来吗？'
  ]
  
  return messages[Math.floor(Math.random() * messages.length)]
}