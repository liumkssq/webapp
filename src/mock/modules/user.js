import Mock from 'mockjs'
import { getQueryParams } from '@/utils/index'

// 模拟数据
const tokens = {
  admin: 'admin-token',
  user: 'user-token'
}

// 模拟用户数据
const users = {
  'admin-token': {
    id: '1',
    username: 'admin',
    nickname: '管理员',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61',
    email: 'admin@example.com',
    phone: '13800138000',
    role: 'admin',
    createTime: Mock.Random.datetime(),
    status: 1,
    bio: '系统管理员',
    followers: 188,
    following: 86,
    posts: 34
  },
  'user-token': {
    id: '2',
    username: 'user',
    nickname: '测试用户',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    email: 'user@example.com',
    phone: '13900139000',
    role: 'user',
    createTime: Mock.Random.datetime(),
    status: 1,
    bio: '普通用户',
    followers: 32,
    following: 12,
    posts: 8
  }
}

// 定义接口对象
const user = {
  // 模拟用户登录
  'POST /api/user/login': (options) => {
    const { username, password } = JSON.parse(options.body)
    
    if (username === 'admin' && password === '123456') {
      return {
        code: 200,
        data: {
          token: tokens.admin,
          userInfo: users['admin-token']
        },
        message: '登录成功'
      }
    } else if (username === 'user' && password === '123456') {
      return {
        code: 200,
        data: {
          token: tokens.user,
          userInfo: users['user-token']
        },
        message: '登录成功'
      }
    } else {
      return {
        code: 400,
        message: '用户名或密码错误'
      }
    }
  },

  // 模拟用户注册
  'POST /api/user/register': (options) => {
    const data = JSON.parse(options.body)
    
    if (!data.username || !data.password || !data.phone) {
      return {
        code: 400,
        message: '注册信息不完整'
      }
    }
    
    // 模拟用户名已存在
    if (data.username === 'admin' || data.username === 'user') {
      return {
        code: 400,
        message: '用户名已存在'
      }
    }
    
    // 模拟手机号已存在
    if (data.phone === '13800138000' || data.phone === '13900139000') {
      return {
        code: 400,
        message: '手机号已注册'
      }
    }
    
    return {
      code: 200,
      data: {
        token: 'new-user-token',
        userInfo: {
          id: Mock.Random.id(),
          username: data.username,
          nickname: data.username,
          avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
          email: data.email || '',
          phone: data.phone,
          role: 'user',
          createTime: Mock.Random.datetime(),
          status: 1,
          bio: '',
          followers: 0,
          following: 0,
          posts: 0
        }
      },
      message: '注册成功'
    }
  },

  // 发送验证码
  'POST /api/user/send-verify-code': (options) => {
    const { phone } = JSON.parse(options.body)
    
    if (!phone) {
      return {
        code: 400,
        message: '手机号不能为空'
      }
    }
    
    return {
      code: 200,
      data: {
        code: '123456' // 测试环境直接返回验证码
      },
      message: '验证码已发送'
    }
  },

  // 重置密码
  'POST /api/user/reset-password': (options) => {
    const { phone, code, newPassword } = JSON.parse(options.body)
    
    if (!phone || !code || !newPassword) {
      return {
        code: 400,
        message: '参数不完整'
      }
    }
    
    if (code !== '123456') {
      return {
        code: 400,
        message: '验证码错误'
      }
    }
    
    return {
      code: 200,
      message: '密码重置成功'
    }
  },

  // 获取用户信息
  'GET /api/user/info': (options) => {
    const token = options.headers.Authorization.split(' ')[1]
    
    if (!token) {
      return {
        code: 401,
        message: '未登录或登录已过期'
      }
    }
    
    const userInfo = users[token]
    
    if (!userInfo) {
      return {
        code: 401,
        message: '未登录或登录已过期'
      }
    }
    
    return {
      code: 200,
      data: userInfo,
      message: '获取用户信息成功'
    }
  },

  // 获取用户主页信息
  'GET /api/user/profile/\\d+': (options) => {
    const userId = options.url.split('/').pop()
    
    // 模拟不同的用户数据
    const userProfile = {
      id: userId,
      username: Mock.Random.name(),
      nickname: Mock.Random.cname(),
      avatar: Mock.Random.image('100x100', Mock.Random.color(), '#FFF', 'Avatar'),
      bio: Mock.Random.paragraph(1),
      followers: Mock.Random.integer(0, 1000),
      following: Mock.Random.integer(0, 500),
      posts: Mock.Random.integer(0, 100),
      isFollowing: Mock.Random.boolean(),
      createTime: Mock.Random.datetime(),
      lastActiveTime: Mock.Random.datetime()
    }
    
    return {
      code: 200,
      data: userProfile,
      message: '获取用户主页信息成功'
    }
  },

  // 更新用户信息
  'POST /api/user/update': (options) => {
    const updateData = JSON.parse(options.body)
    
    if (!options.headers.Authorization) {
      return {
        code: 401,
        message: '未登录或登录已过期'
      }
    }
    
    return {
      code: 200,
      data: {
        ...updateData,
        updateTime: Mock.Random.datetime()
      },
      message: '用户信息更新成功'
    }
  },

  // 上传头像
  'POST /api/user/upload-avatar': (options) => {
    if (!options.headers.Authorization) {
      return {
        code: 401,
        message: '未登录或登录已过期'
      }
    }
    
    return {
      code: 200,
      data: {
        avatar: Mock.Random.image('200x200', Mock.Random.color(), '#FFF', 'Avatar')
      },
      message: '头像上传成功'
    }
  },

  // 修改密码
  'POST /api/user/change-password': (options) => {
    const { oldPassword, newPassword } = JSON.parse(options.body)
    
    if (!options.headers.Authorization) {
      return {
        code: 401,
        message: '未登录或登录已过期'
      }
    }
    
    if (!oldPassword || !newPassword) {
      return {
        code: 400,
        message: '参数不完整'
      }
    }
    
    if (oldPassword === newPassword) {
      return {
        code: 400,
        message: '新密码不能与旧密码相同'
      }
    }
    
    return {
      code: 200,
      message: '密码修改成功'
    }
  },

  // 退出登录
  'POST /api/user/logout': (options) => {
    return {
      code: 200,
      message: '退出登录成功'
    }
  },

  // 关注用户
  'POST /api/user/follow/\\d+': (options) => {
    const userId = options.url.split('/').pop()
    
    return {
      code: 200,
      data: {
        userId,
        isFollowing: true
      },
      message: '关注成功'
    }
  },

  // 取消关注
  'POST /api/user/unfollow/\\d+': (options) => {
    const userId = options.url.split('/').pop()
    
    return {
      code: 200,
      data: {
        userId,
        isFollowing: false
      },
      message: '取消关注成功'
    }
  },

  // 获取关注列表
  'GET /api/user/following/\\d+': (options) => {
    const userId = options.url.match(/\/api\/user\/following\/(\d+)/)[1]
    const params = getQueryParams(options.url)
    const page = parseInt(params.page) || 1
    const size = parseInt(params.size) || 10
    
    const followingList = []
    for (let i = 0; i < 20; i++) {
      followingList.push(Mock.mock({
        id: '@id',
        username: '@name',
        nickname: '@cname',
        avatar: '@image("100x100", "#4A7BF7", "#fff", "Avatar")',
        bio: '@cparagraph(1)',
        isFollowing: '@boolean'
      }))
    }
    
    const start = (page - 1) * size
    const end = start + size
    
    return {
      code: 200,
      data: {
        list: followingList.slice(start, end),
        total: followingList.length,
        page,
        size
      },
      message: '获取关注列表成功'
    }
  },

  // 获取粉丝列表
  'GET /api/user/followers/\\d+': (options) => {
    const userId = options.url.match(/\/api\/user\/followers\/(\d+)/)[1]
    const params = getQueryParams(options.url)
    const page = parseInt(params.page) || 1
    const size = parseInt(params.size) || 10
    
    const followersList = []
    for (let i = 0; i < 30; i++) {
      followersList.push(Mock.mock({
        id: '@id',
        username: '@name',
        nickname: '@cname',
        avatar: '@image("100x100", "#4A7BF7", "#fff", "Avatar")',
        bio: '@cparagraph(1)',
        isFollowing: '@boolean'
      }))
    }
    
    const start = (page - 1) * size
    const end = start + size
    
    return {
      code: 200,
      data: {
        list: followersList.slice(start, end),
        total: followersList.length,
        page,
        size
      },
      message: '获取粉丝列表成功'
    }
  }
}

export default user