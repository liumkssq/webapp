import Mock from 'mockjs'
import { getUrlParams } from '../utils'

// 生成随机用户数据
const users = Mock.mock({
  'list|20': [{
    'id|+1': 1,
    'username': '@word(5, 10)',
    'nickname': '@cname',
    'phone': /^1[3-9]\d{9}$/,
    'email': '@email',
    'avatar': 'https://api.dicebear.com/6.x/avataaars/svg?seed=@word',
    'gender|1': ['male', 'female', 'other'],
    'bio': '@sentence(5, 20)',
    'school': '@ctitle(5, 10)大学',
    'createTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
    'lastLogin': '@datetime("yyyy-MM-dd HH:mm:ss")',
    'online|1': [true, false],
    'verified|1': [true, false]
  }]
}).list

// 模拟token
const tokens = {}

// 用户相关mock接口
export default {
  // 登录
  'POST /api/user/login': (options) => {
    try {
      // 确保请求体存在且不为空
      if (!options.body) {
        return {
          code: 400,
          message: '请求体不能为空',
          data: null
        }
      }
      
      const requestData = JSON.parse(options.body)
      const { username, password, phone, verificationCode } = requestData
      
      // 密码登录
      if (username && password) {
        const user = users.find(u => u.username === username || u.phone === username || u.email === username)
        
        if (user && password === '123456') {
          const token = 'token_' + Mock.Random.guid()
          tokens[token] = user.id
          
          return {
            code: 200,
            message: '登录成功',
            data: {
              token,
              userInfo: user
            }
          }
        }
      }
      
      // 验证码登录
      if (phone && verificationCode) {
        const user = users.find(u => u.phone === phone)
        
        if (user && verificationCode === '1234') {
          const token = 'token_' + Mock.Random.guid()
          tokens[token] = user.id
          
          return {
            code: 200,
            message: '登录成功',
            data: {
              token,
              userInfo: user
            }
          }
        }
      }
      
      return {
        code: 401,
        message: '用户名或密码错误',
        data: null
      }
    } catch (error) {
      console.error('登录处理错误:', error)
      return {
        code: 500,
        message: '服务器内部错误',
        data: null
      }
    }
  },
  
  // 注册
  'POST /api/user/register': (options) => {
    const { username, password, phone, verificationCode } = JSON.parse(options.body)
    
    if (!username || !password || !phone || !verificationCode) {
      return {
        code: 400,
        message: '缺少必要参数',
        data: null
      }
    }
    
    if (verificationCode !== '1234') {
      return {
        code: 400,
        message: '验证码错误',
        data: null
      }
    }
    
    if (users.some(u => u.username === username)) {
      return {
        code: 400,
        message: '用户名已存在',
        data: null
      }
    }
    
    if (users.some(u => u.phone === phone)) {
      return {
        code: 400,
        message: '手机号已注册',
        data: null
      }
    }
    
    const newUser = {
      id: users.length + 1,
      username,
      nickname: username,
      phone,
      email: '',
      avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${username}`,
      gender: 'other',
      bio: '',
      school: '',
      createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      lastLogin: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      online: true,
      verified: false
    }
    
    users.push(newUser)
    
    const token = 'token_' + Mock.Random.guid()
    tokens[token] = newUser.id
    
    return {
      code: 200,
      message: '注册成功',
      data: {
        token,
        userInfo: newUser
      }
    }
  },
  
  // 获取当前用户信息
  'GET /api/user/info': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token || !tokens[token]) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    const userId = tokens[token]
    const user = users.find(u => u.id === userId)
    
    if (!user) {
      return {
        code: 404,
        message: '用户不存在',
        data: null
      }
    }
    
    return {
      code: 200,
      message: '获取成功',
      data: user
    }
  },
  
  // 获取用户详细资料
  'GET /api/user/profile/:id': (options) => {
    const userId = parseInt(options.url.match(/\/profile\/(\d+)/)[1])
    const user = users.find(u => u.id === userId)
    
    if (!user) {
      return {
        code: 404,
        message: '用户不存在',
        data: null
      }
    }
    
    return {
      code: 200,
      message: '获取成功',
      data: user
    }
  },
  
  // 更新用户信息
  'PUT /api/user/info': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token || !tokens[token]) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    const userId = tokens[token]
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      return {
        code: 404,
        message: '用户不存在',
        data: null
      }
    }
    
    const userData = JSON.parse(options.body)
    
    // 更新用户信息
    users[userIndex] = {
      ...users[userIndex],
      ...userData
    }
    
    return {
      code: 200,
      message: '更新成功',
      data: users[userIndex]
    }
  },
  
  // 修改密码
  'PUT /api/user/password': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token || !tokens[token]) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    const { oldPassword, newPassword } = JSON.parse(options.body)
    
    if (oldPassword !== '123456') {
      return {
        code: 400,
        message: '原密码错误',
        data: null
      }
    }
    
    return {
      code: 200,
      message: '密码修改成功',
      data: null
    }
  },
  
  // 发送验证码
  'POST /api/user/verification-code': (options) => {
    const { phone } = JSON.parse(options.body)
    
    if (!phone) {
      return {
        code: 400,
        message: '手机号不能为空',
        data: null
      }
    }
    
    return {
      code: 200,
      message: '验证码发送成功',
      data: {
        code: '1234' // 模拟验证码，实际应用中不应返回
      }
    }
  },
  
  // 退出登录
  'POST /api/user/logout': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (token && tokens[token]) {
      delete tokens[token]
    }
    
    return {
      code: 200,
      message: '退出成功',
      data: null
    }
  },
  
  // 上传头像
  'POST /api/user/avatar': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token || !tokens[token]) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    // 生成随机头像URL
    const avatarUrl = `https://api.dicebear.com/6.x/avataaars/svg?seed=${Mock.Random.word(8)}`
    
    // 更新用户头像
    const userId = tokens[token]
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex !== -1) {
      users[userIndex].avatar = avatarUrl
    }
    
    return {
      code: 200,
      message: '上传成功',
      data: {
        url: avatarUrl
      }
    }
  },
  
  // 获取用户通知
  'GET /api/user/notifications': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token || !tokens[token]) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    // 生成随机通知
    const notifications = Mock.mock({
      'list|5-15': [{
        'id|+1': 1,
        'title': '@sentence(5, 10)',
        'content': '@sentence(10, 20)',
        'type|1': ['like', 'comment', 'follow', 'system'],
        'targetType|1': ['article', 'product', 'lostFound', ''],
        'targetId|1-100': 1,
        'fromUser': () => {
          const randomUser = users[Mock.Random.integer(0, users.length - 1)]
          return {
            id: randomUser.id,
            nickname: randomUser.nickname,
            avatar: randomUser.avatar
          }
        },
        'time': '@datetime("yyyy-MM-dd HH:mm:ss")',
        'read|1': [true, false]
      }]
    }).list
    
    // 按时间排序
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time))
    
    return {
      code: 200,
      message: '获取成功',
      data: notifications
    }
  },
  
  // 标记通知为已读
  'PUT /api/user/notification/read/:id': (options) => {
    const token = options.headers.Authorization?.split(' ')[1]
    
    if (!token || !tokens[token]) {
      return {
        code: 401,
        message: '未登录或登录已过期',
        data: null
      }
    }
    
    return {
      code: 200,
      message: '标记成功',
      data: null
    }
  }
}