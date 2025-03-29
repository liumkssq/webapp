import Mock from 'mockjs'
import { getUrlParams } from '../utils'

// 添加默认管理员账号
const admin = {
  id: 1,
  username: 'admin',
  nickname: '管理员',
  phone: '13800138000',
  email: 'admin@example.com',
  avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=admin',
  gender: 'male',
  bio: '系统管理员',
  school: '管理学院',
  createTime: '2023-01-01 00:00:00',
  lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
  online: true,
  verified: true,
  role: 'admin'
};

// 先生成随机用户数据
const randomUsers = Mock.mock({
  'list|20': [{
    'id|+1': 2, // 从2开始，因为ID为1是管理员
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
}).list;

// 组合完整的用户列表
const users = [admin, ...randomUsers];

console.log('【Mock系统】已加载用户数据，admin用户:', admin, '总用户数:', users.length);

// 模拟token
const tokens = {}

// 用户相关mock接口
export default {
  // 登录
  'POST /api/user/login': (config) => {
    try {
      console.log('【Mock登录】接收到登录请求:', config);
      
      // 正确处理axios-mock-adapter传入的参数
      let requestData;
      
      if (config.data) {
        try {
          // 如果data是JSON字符串，尝试解析
          if (typeof config.data === 'string') {
            requestData = JSON.parse(config.data);
          } else {
            // 如果已经是对象，直接使用
            requestData = config.data;
          }
        } catch (e) {
          console.error('【Mock登录】解析请求数据失败:', e);
        }
      }
      
      console.log('【Mock登录】解析后的请求数据:', requestData);
      
      // 兼容旧的处理方式
      if (!requestData && config.body) {
        try {
          if (typeof config.body === 'string') {
            requestData = JSON.parse(config.body);
          } else {
            requestData = config.body;
          }
        } catch (e) {
          console.error('【Mock登录】解析请求体失败:', e);
        }
      }
      
      // 如果仍然无法获取数据，检查是否是测试登录
      if (!requestData && config.url && config.url.includes('admin_test=true')) {
        console.log('【Mock登录】使用测试登录路径，自动以管理员身份登录');
        // 特殊的测试路径，直接使用管理员账号
        const admin = users.find(u => u.username === 'admin');
        const token = 'token_admin_' + Mock.Random.guid();
        tokens[token] = admin.id;
        
        return {
          code: 200,
          message: '管理员测试登录成功',
          data: {
            token,
            userInfo: admin
          }
        };
      }
      
      // 如果无法获取数据，设置默认admin账号
      if (!requestData) {
        console.log('【Mock登录】无法从请求中获取数据，使用默认Admin登录');
        // 由于mock服务的特殊性，这里使用admin账号
        const admin = users.find(u => u.username === 'admin');
        const token = 'token_admin_' + Mock.Random.guid();
        tokens[token] = admin.id;
        
        return {
          code: 200,
          message: '自动登录成功(admin)',
          data: {
            token,
            userInfo: admin
          }
        };
      }
      
      // 提取登录信息
      const { username, password, phone, verificationCode } = requestData;
      console.log('【Mock登录】提取的登录信息:', { username, password: password ? '已提供' : '未提供', phone, verificationCode: verificationCode ? '已提供' : '未提供' });
      
      // 固定的admin账号特殊处理
      if (username === 'admin') {
        console.log('【Mock登录】检测到admin账号登录请求');
        
        // 强制使admin登录成功，不检查密码
        const admin = users.find(u => u.username === 'admin');
        if (admin) {
          console.log('【Mock登录】admin账号成功登录');
          const token = 'token_admin_' + Mock.Random.guid();
          tokens[token] = admin.id;
          
          return {
            code: 200,
            message: '管理员登录成功',
            data: {
              token,
              userInfo: admin
            }
          };
        } else {
          console.error('【Mock登录】未找到admin账号!');
        }
      }
      
      // 普通密码登录
      if (username && password) {
        console.log('【Mock登录】尝试普通密码登录');
        // 打印所有用户的用户名，便于调试
        console.log('【Mock登录】系统中的用户:', users.map(u => u.username));
        
        const user = users.find(u => u.username === username || u.phone === username || u.email === username);
        
        if (user) {
          console.log('【Mock登录】找到匹配的用户:', user.username);
          
          // 开发环境下任何密码都能登录成功
          const token = 'token_' + Mock.Random.guid();
          tokens[token] = user.id;
          
          return {
            code: 200,
            message: '登录成功',
            data: {
              token,
              userInfo: user
            }
          };
        } else {
          console.log('【Mock登录】未找到匹配的用户:', username);
        }
      }
      
      // 验证码登录
      if (phone && verificationCode) {
        console.log('【Mock登录】尝试验证码登录');
        const user = users.find(u => u.phone === phone);
        
        if (user && verificationCode === '1234') {
          console.log('【Mock登录】验证码登录成功');
          const token = 'token_' + Mock.Random.guid();
          tokens[token] = user.id;
          
          return {
            code: 200,
            message: '登录成功',
            data: {
              token,
              userInfo: user
            }
          };
        } else {
          console.log('【Mock登录】验证码登录失败，用户或验证码不匹配');
        }
      }
      
      console.log('【Mock登录】所有登录方式都失败，返回401错误');
      return {
        code: 401,
        message: '用户名或密码错误',
        data: null
      };
    } catch (error) {
      console.error('【Mock登录】登录处理发生错误:', error);
      return {
        code: 500,
        message: '服务器内部错误',
        data: null
      };
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
  },
  
  // 重置密码
  'POST /api/user/reset-password': (options) => {
    try {
      let requestData;
      
      // 处理不同格式的请求数据
      if (options.data) {
        if (typeof options.data === 'string') {
          requestData = JSON.parse(options.data);
        } else {
          requestData = options.data;
        }
      } else if (options.body) {
        if (typeof options.body === 'string') {
          requestData = JSON.parse(options.body);
        } else {
          requestData = options.body;
        }
      }
      
      const { phone, verificationCode, newPassword } = requestData || {};
      
      // 验证参数完整性
      if (!phone || !verificationCode || !newPassword) {
        return {
          code: 400,
          message: '缺少必要参数',
          data: null
        };
      }
      
      // 验证验证码
      if (verificationCode !== '1234') {
        return {
          code: 400,
          message: '验证码错误',
          data: null
        };
      }
      
      // 查找用户
      const user = users.find(u => u.phone === phone);
      if (!user) {
        return {
          code: 404,
          message: '未找到该手机号关联的账号',
          data: null
        };
      }
      
      // 更新用户密码（模拟操作，实际不需要保存）
      // 在真实环境中应该保存密码哈希
      
      return {
        code: 200,
        message: '密码重置成功',
        data: null
      };
    } catch (error) {
      console.error('【Mock重置密码】处理错误:', error);
      return {
        code: 500,
        message: '服务器内部错误',
        data: null
      };
    }
  },
  
  // 关注用户
  'POST /api/user/follow/:id': (config) => {
    try {
      // 获取被关注用户的ID
      const targetId = config.url.match(/\/api\/user\/follow\/(\d+)/)[1];
      
      // 假设登录用户的ID是从token中获取的
      // 这里简化处理，假设当前用户是管理员
      const currentUserId = 1;
      
      // 查找被关注的用户
      const targetUser = users.find(u => u.id == targetId);
      if (!targetUser) {
        return {
          code: 404,
          message: '用户不存在'
        };
      }
      
      // 更新用户的关注状态
      // 在实际情况中，这里应该修改数据库中的关注关系
      // 在mock中，我们只需要返回成功响应即可
      
      return {
        code: 200,
        message: '关注成功',
        data: {
          isFollowing: true
        }
      };
    } catch (error) {
      console.error('关注用户模拟接口错误:', error);
      return {
        code: 500,
        message: '服务器内部错误'
      };
    }
  },
  
  // 取消关注用户
  'POST /api/user/unfollow/:id': (config) => {
    try {
      // 获取被取消关注用户的ID
      const targetId = config.url.match(/\/api\/user\/unfollow\/(\d+)/)[1];
      
      // 假设登录用户的ID是从token中获取的
      // 这里简化处理，假设当前用户是管理员
      const currentUserId = 1;
      
      // 查找被取消关注的用户
      const targetUser = users.find(u => u.id == targetId);
      if (!targetUser) {
        return {
          code: 404,
          message: '用户不存在'
        };
      }
      
      // 更新用户的关注状态
      // 在实际情况中，这里应该修改数据库中的关注关系
      // 在mock中，我们只需要返回成功响应即可
      
      return {
        code: 200,
        message: '取消关注成功',
        data: {
          isFollowing: false
        }
      };
    } catch (error) {
      console.error('取消关注用户模拟接口错误:', error);
      return {
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}