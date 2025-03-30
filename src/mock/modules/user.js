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

// 为了让search.js可以导入这些用户数据
const allUsers = users;

console.log('【Mock系统】已加载用户数据，admin用户:', admin, '总用户数:', users.length);

// 模拟token
const tokens = {}

// 获取通知列表
const getNotifications = () => {
  const notifications = []
  
  // 生成模拟通知数据
  for (let i = 1; i <= 10; i++) {
    const types = ['like', 'comment', 'follow', 'system']
    const type = types[Math.floor(Math.random() * types.length)]
    
    const targetTypes = ['article', 'product', 'lostFound']
    const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)]
    
    notifications.push({
      id: i,
      type,
      title: type === 'like' ? '收到一个赞' :
             type === 'comment' ? '收到一条评论' :
             type === 'follow' ? '有人关注了你' : '系统通知',
      content: type === 'like' ? '用户小明赞了你的' + targetType :
               type === 'comment' ? '用户小红评论了你的' + targetType :
               type === 'follow' ? '用户小张关注了你' : '您的账号已完成实名认证',
      time: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      read: Math.random() > 0.3,
      targetType: type === 'system' ? null : targetType,
      targetId: type === 'system' ? null : Math.floor(Math.random() * 100) + 1,
      fromUser: type === 'system' ? null : {
        id: Math.floor(Math.random() * 100) + 1,
        nickname: ['小明', '小红', '小张', '小李', '小王'][Math.floor(Math.random() * 5)]
      }
    })
  }
  
  // 按时间排序
  notifications.sort((a, b) => new Date(b.time) - new Date(a.time))
  
  return {
    code: 200,
    data: notifications,
    message: '获取成功'
  }
}

// 标记通知为已读
const markNotificationAsRead = (config) => {
  const id = parseInt(config.url.split('/').pop())
  
  return {
    code: 200,
    message: '标记成功'
  }
}

// 注册Mock拦截器
// 登录请求
Mock.mock(/\/api\/user\/login(\?.*)?$/, 'post', (options) => {
  console.log('【Mock登录】接收到登录请求:', options);
  
  try {
    // 简化的登录处理逻辑 - 永远返回管理员登录成功
    const token = 'token_admin_' + Mock.Random.guid();
    tokens[token] = admin.id;
    
    return {
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: admin
      }
    };
  } catch (error) {
    console.error('【Mock登录】处理错误:', error);
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    };
  }
});

// 用户信息请求
Mock.mock(/\/api\/user\/info(\?.*)?$/, 'get', (options) => {
  const token = options.headers?.Authorization?.split(' ')[1] || '';
  
  if (!token) {
    return {
      code: 401,
      message: '未登录或登录已过期',
      data: null
    };
  }
  
  // 简化逻辑，直接返回管理员信息
  return {
    code: 200,
    message: '获取成功',
    data: admin
  };
});

// 用户资料请求
Mock.mock(/\/api\/user\/profile\/\d+(\?.*)?$/, 'get', (options) => {
  const userId = parseInt(options.url.match(/\/profile\/(\d+)/)[1]);
  const user = users.find(u => u.id === userId) || admin;
  
  return {
    code: 200,
    message: '获取成功',
    data: user
  };
});

// 验证码请求
Mock.mock(/\/api\/user\/verification-code(\?.*)?$/, 'post', () => {
  return {
    code: 200,
    message: '验证码发送成功',
    data: {
      code: '1234' // 模拟验证码
    }
  };
});

// 退出登录
Mock.mock(/\/api\/user\/logout(\?.*)?$/, 'post', () => {
  return {
    code: 200,
    message: '退出成功',
    data: null
  };
});

console.log('【Mock系统】已注册用户相关接口');

// 添加默认导出，供其他模块引用
export default {
  allUsers
};