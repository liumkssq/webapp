import Mock from 'mockjs'
import { getUrlParams, getRequestBody, delay } from '../utils'

// 生成通知数据
const generateNotifications = (count = 50) => {
  return Mock.mock({
    [`list|${count}`]: [{
      'id|+1': 1,
      'title': '@ctitle(10, 20)',
      'content': '@cparagraph(1, 3)',
      'type|1': ['system', 'activity', 'message', 'follow', 'like', 'comment', 'reply'],
      'status|1': ['read', 'unread'],
      'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'isImportant|1-5': false, // 20%概率为重要通知
      'sourceId|1-1000': 1,
      'sourceType|1': ['article', 'product', 'user', 'system'],
      'sender': function() {
        // 系统通知没有发送者
        if (this.type === 'system') return null;
        
        return {
          'id|1-100': 1,
          'username': '@word(5, 10)',
          'nickname': '@cname',
          'avatar': '@image("60x60", "#4A7BF7", "#FFF", "Avatar")'
        };
      }
    }]
  }).list;
};

// 生成系统配置
const systemConfig = {
  app: {
    name: '校园社区',
    logo: Mock.Random.image('200x60', '#4A7BF7', '#FFF', 'Logo'),
    description: '专为大学生打造的校园社区平台',
    keywords: '校园,社区,大学生,交流,二手,失物招领',
    version: '1.0.0',
    icp: '粤ICP备12345678号',
    copyright: '© 2023 校园社区 All Rights Reserved',
    contactEmail: 'support@example.com',
    contactPhone: '400-123-4567'
  },
  user: {
    defaultAvatar: Mock.Random.image('100x100', '#ffcc33', '#FFF', 'Avatar'),
    allowedRegisterDomains: ['edu.cn'],
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    passwordRequireNumber: true,
    passwordRequireUpperCase: true,
    usernameMinLength: 4,
    usernameMaxLength: 20
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'],
    maxImageWidth: 1920,
    maxImageHeight: 1080,
    maxImagesPerPost: 9,
    maxFilesPerMessage: 5
  },
  content: {
    articleMaxLength: 10000,
    commentMaxLength: 500,
    messageMaxLength: 500,
    sensitiveWords: ['敏感词1', '敏感词2', '敏感词3']
  },
  payment: {
    enabled: true,
    supportedMethods: ['alipay', 'wechat', 'creditcard'],
    minAmount: 0.1,
    maxAmount: 10000
  },
  features: {
    enableArticle: true,
    enableProduct: true,
    enableChat: true,
    enableLostFound: true,
    enableMap: true,
    enableGroup: true
  }
};

// 生成常见问题
const generateFaqs = (count = 20) => {
  return Mock.mock({
    [`list|${count}`]: [{
      'id|+1': 1,
      'question': '@ctitle(10, 30)',
      'answer': '@cparagraph(3, 6)',
      'category|1': ['账号相关', '功能使用', '支付相关', '安全隐私', '其他'],
      'viewCount|100-5000': 1000,
      'isHelpful|1-100': 80, // 有用率
      'createdAt': '@datetime("yyyy-MM-dd")',
      'updatedAt': '@datetime("yyyy-MM-dd")'
    }]
  }).list;
};

// 生成反馈数据
const generateFeedback = (count = 30) => {
  return Mock.mock({
    [`list|${count}`]: [{
      'id|+1': 1,
      'title': '@ctitle(5, 20)',
      'content': '@cparagraph(2, 5)',
      'type|1': ['bug', 'suggestion', 'complaint', 'question', 'other'],
      'status|1': ['pending', 'processing', 'resolved', 'rejected'],
      'priority|1': ['low', 'medium', 'high', 'urgent'],
      'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'updatedAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'contactInfo': function() {
        return Mock.Random.boolean(0.8) ? Mock.Random.email() : Mock.Random.string('number', 11);
      },
      'images': function() {
        const hasImages = Mock.Random.boolean(0.6);
        if (!hasImages) return [];
        
        const count = Mock.Random.integer(1, 4);
        const images = [];
        for (let i = 0; i < count; i++) {
          images.push(Mock.Random.image('800x600', Mock.Random.color(), '#FFF', 'Feedback'));
        }
        return images;
      },
      'reply': function() {
        if (this.status === 'pending') return null;
        
        return this.status === 'rejected' 
          ? '很抱歉，您的反馈我们无法处理，请提供更多信息。'
          : '感谢您的反馈，我们已经' + (this.status === 'resolved' ? '解决了该问题' : '正在处理中');
      },
      'replyTime': function() {
        return this.reply ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null;
      },
      'user': {
        'id|1-100': 1,
        'username': '@word(5, 10)',
        'nickname': '@cname',
        'avatar': '@image("60x60", "#ffcc33", "#FFF", "Avatar")'
      }
    }]
  }).list;
};

// 生成系统公告
const generateAnnouncements = (count = 10) => {
  return Mock.mock({
    [`list|${count}`]: [{
      'id|+1': 1,
      'title': '@ctitle(10, 30)',
      'content': '@cparagraph(3, 8)',
      'type|1': ['normal', 'important', 'urgent', 'maintenance'],
      'status|1': ['draft', 'published', 'expired'],
      'publishTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'expireTime': function() {
        const date = new Date(this.publishTime);
        date.setDate(date.getDate() + Mock.Random.integer(7, 30));
        return date.toISOString().slice(0, 19).replace('T', ' ');
      },
      'isSticky|1-5': false, // 20%概率为置顶公告
      'viewCount|100-10000': 1000
    }]
  }).list;
};

// 数据准备
const allNotifications = generateNotifications();
const faqs = generateFaqs();
const feedbackList = generateFeedback();
const announcements = generateAnnouncements();

// 增加获取未读通知数量的计算
const getUnreadCount = () => {
  return allNotifications.filter(item => item.status === 'unread').length;
};

// Mock 获取通知列表接口
Mock.mock(/\/api\/notification\/list/, 'get', (options) => {
  const params = getUrlParams(options.url);
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const type = params.type; // 可选过滤类型
  const status = params.status; // 可选状态筛选
  
  let filteredNotifications = [...allNotifications];
  
  // 根据类型过滤
  if (type) {
    filteredNotifications = filteredNotifications.filter(item => item.type === type);
  }
  
  // 根据状态过滤
  if (status) {
    filteredNotifications = filteredNotifications.filter(item => item.status === status);
  }
  
  // 按时间降序排序
  filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // 分页
  const start = (page - 1) * limit;
  const end = start + limit;
  const pagedNotifications = filteredNotifications.slice(start, end);
  
  delay(200);
  
  return {
    code: 200,
    message: '获取通知列表成功',
    data: {
      list: pagedNotifications,
      total: filteredNotifications.length,
      page,
      limit,
      unreadCount: getUnreadCount()
    }
  };
});

// Mock 获取通知详情接口
Mock.mock(/\/api\/notification\/detail\/\d+/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/detail\/(\d+)/)[1]);
  const notification = allNotifications.find(item => item.id === id);
  
  if (!notification) {
    return {
      code: 404,
      message: '通知不存在'
    };
  }
  
  // 如果是未读，则标记为已读
  if (notification.status === 'unread') {
    notification.status = 'read';
  }
  
  delay(100);
  
  return {
    code: 200,
    message: '获取通知详情成功',
    data: notification
  };
});

// Mock 标记通知为已读接口
Mock.mock(/\/api\/notification\/read/, 'post', (options) => {
  const body = getRequestBody(options);
  const ids = body.ids;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return {
      code: 400,
      message: '请指定要标记的通知ID'
    };
  }
  
  let updatedCount = 0;
  
  // 批量标记为已读
  for (const id of ids) {
    const notification = allNotifications.find(item => item.id === parseInt(id));
    if (notification && notification.status === 'unread') {
      notification.status = 'read';
      updatedCount++;
    }
  }
  
  delay(100);
  
  return {
    code: 200,
    message: `已将${updatedCount}条通知标记为已读`,
    data: {
      updatedCount,
      unreadCount: getUnreadCount()
    }
  };
});

// Mock 获取未读通知数量接口
Mock.mock(/\/api\/notification\/unread\/count/, 'get', () => {
  delay(50);
  
  return {
    code: 200,
    message: '获取未读通知数量成功',
    data: {
      count: getUnreadCount()
    }
  };
});

// Mock 删除通知接口
Mock.mock(/\/api\/notification\/delete/, 'post', (options) => {
  const body = getRequestBody(options);
  const ids = body.ids;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return {
      code: 400,
      message: '请指定要删除的通知ID'
    };
  }
  
  let deletedCount = 0;
  
  // 批量删除
  for (const id of ids) {
    const index = allNotifications.findIndex(item => item.id === parseInt(id));
    if (index !== -1) {
      allNotifications.splice(index, 1);
      deletedCount++;
    }
  }
  
  delay(100);
  
  return {
    code: 200,
    message: `已删除${deletedCount}条通知`,
    data: {
      deletedCount
    }
  };
});

// Mock 清空所有通知接口
Mock.mock(/\/api\/notification\/clear/, 'post', () => {
  const count = allNotifications.length;
  allNotifications.length = 0;
  
  delay(200);
  
  return {
    code: 200,
    message: '已清空所有通知',
    data: {
      clearedCount: count
    }
  };
});

// Mock 获取系统配置接口
Mock.mock(/\/api\/config/, 'get', () => {
  delay(100);
  
  return {
    code: 200,
    message: '获取系统配置成功',
    data: systemConfig
  };
});

// Mock 获取常见问题列表接口
Mock.mock(/\/api\/faq\/list/, 'get', (options) => {
  const params = getUrlParams(options.url);
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const category = params.category;
  
  let filteredFaqs = [...faqs];
  
  // 根据分类过滤
  if (category) {
    filteredFaqs = filteredFaqs.filter(item => item.category === category);
  }
  
  // 分页
  const start = (page - 1) * limit;
  const end = start + limit;
  const pagedFaqs = filteredFaqs.slice(start, end);
  
  delay(200);
  
  return {
    code: 200,
    message: '获取常见问题列表成功',
    data: {
      list: pagedFaqs,
      total: filteredFaqs.length,
      page,
      limit
    }
  };
});

// Mock 获取常见问题详情接口
Mock.mock(/\/api\/faq\/detail\/\d+/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/detail\/(\d+)/)[1]);
  const faq = faqs.find(item => item.id === id);
  
  if (!faq) {
    return {
      code: 404,
      message: '问题不存在'
    };
  }
  
  // 增加查看次数
  faq.viewCount += 1;
  
  delay(100);
  
  return {
    code: 200,
    message: '获取问题详情成功',
    data: faq
  };
});

// Mock 提交反馈接口
Mock.mock(/\/api\/feedback\/submit/, 'post', (options) => {
  const body = getRequestBody(options);
  
  if (!body.title || !body.content || !body.type) {
    return {
      code: 400,
      message: '请完善反馈信息'
    };
  }
  
  // 创建新反馈
  const newFeedback = {
    id: feedbackList.length + 1,
    title: body.title,
    content: body.content,
    type: body.type,
    status: 'pending',
    priority: body.priority || 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactInfo: body.contactInfo || '',
    images: body.images || [],
    reply: null,
    replyTime: null,
    user: {
      id: 1, // 当前登录用户
      username: 'current_user',
      nickname: '当前用户',
      avatar: Mock.Random.image('60x60', '#ffcc33', '#FFF', 'Avatar')
    }
  };
  
  // 添加到反馈列表
  feedbackList.unshift(newFeedback);
  
  delay(300);
  
  return {
    code: 200,
    message: '反馈提交成功，感谢您的宝贵意见！',
    data: {
      id: newFeedback.id
    }
  };
});

// Mock 获取反馈列表接口
Mock.mock(/\/api\/feedback\/list/, 'get', (options) => {
  const params = getUrlParams(options.url);
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const status = params.status;
  const type = params.type;
  
  let filteredFeedback = [...feedbackList];
  
  // 根据状态过滤
  if (status) {
    filteredFeedback = filteredFeedback.filter(item => item.status === status);
  }
  
  // 根据类型过滤
  if (type) {
    filteredFeedback = filteredFeedback.filter(item => item.type === type);
  }
  
  // 只能查看自己的反馈
  filteredFeedback = filteredFeedback.filter(item => item.user.id === 1);
  
  // 按时间降序排序
  filteredFeedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // 分页
  const start = (page - 1) * limit;
  const end = start + limit;
  const pagedFeedback = filteredFeedback.slice(start, end);
  
  delay(200);
  
  return {
    code: 200,
    message: '获取反馈列表成功',
    data: {
      list: pagedFeedback,
      total: filteredFeedback.length,
      page,
      limit
    }
  };
});

// Mock 获取反馈详情接口
Mock.mock(/\/api\/feedback\/detail\/\d+/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/detail\/(\d+)/)[1]);
  const feedback = feedbackList.find(item => item.id === id);
  
  if (!feedback) {
    return {
      code: 404,
      message: '反馈不存在'
    };
  }
  
  // 只能查看自己的反馈
  if (feedback.user.id !== 1) {
    return {
      code: 403,
      message: '无权查看该反馈'
    };
  }
  
  delay(100);
  
  return {
    code: 200,
    message: '获取反馈详情成功',
    data: feedback
  };
});

// Mock 获取系统公告列表接口
Mock.mock(/\/api\/announcement\/list/, 'get', (options) => {
  const params = getUrlParams(options.url);
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const type = params.type;
  
  // 只获取已发布的公告
  let filteredAnnouncements = announcements.filter(item => item.status === 'published');
  
  // 根据类型过滤
  if (type) {
    filteredAnnouncements = filteredAnnouncements.filter(item => item.type === type);
  }
  
  // 置顶公告优先，然后按发布时间降序排序
  filteredAnnouncements.sort((a, b) => {
    if (a.isSticky !== b.isSticky) {
      return a.isSticky ? -1 : 1;
    }
    return new Date(b.publishTime) - new Date(a.publishTime);
  });
  
  // 分页
  const start = (page - 1) * limit;
  const end = start + limit;
  const pagedAnnouncements = filteredAnnouncements.slice(start, end);
  
  delay(200);
  
  return {
    code: 200,
    message: '获取系统公告列表成功',
    data: {
      list: pagedAnnouncements,
      total: filteredAnnouncements.length,
      page,
      limit
    }
  };
});

// Mock 获取系统公告详情接口
Mock.mock(/\/api\/announcement\/detail\/\d+/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/detail\/(\d+)/)[1]);
  const announcement = announcements.find(item => item.id === id);
  
  if (!announcement) {
    return {
      code: 404,
      message: '公告不存在'
    };
  }
  
  if (announcement.status !== 'published') {
    return {
      code: 403,
      message: '该公告未发布或已过期'
    };
  }
  
  // 增加查看次数
  announcement.viewCount += 1;
  
  delay(100);
  
  return {
    code: 200,
    message: '获取公告详情成功',
    data: announcement
  };
});

// 获取系统统计数据
Mock.mock(/\/api\/statistics/, 'get', () => {
  delay(300);
  
  return {
    code: 200,
    message: '获取统计数据成功',
    data: {
      userCount: 12568,
      articleCount: 8742,
      productCount: 5431,
      messageCount: 89562,
      dailyActiveUser: 3254,
      onlineUserCount: 521,
      newUserToday: 157,
      newArticleToday: 68,
      newProductToday: 42
    }
  };
});

export default {
  allNotifications,
  faqs,
  feedbackList,
  announcements,
  systemConfig,
  getUnreadCount
}; 