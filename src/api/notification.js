import request from '@/utils/request';
import { nanoid } from 'nanoid'; // 用于生成唯一ID

// Mock 数据存储
let mockNotifications = [
  {
    id: nanoid(8),
    type: 'interaction',
    subType: 'comment', // comment, like, follow, mention
    title: '张三 回复了你的评论',
    content: '我觉得你说的很有道理！我也遇到过类似情况...',
    sender: { id: 102, nickname: '张三', avatar: 'https://picsum.photos/id/102/100/100' },
    relatedId: 'article_123', // 关联的文章ID
    targetUrl: '/article/detail/123?commentId=c456', // 跳转目标
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2分钟前
  },
  {
    id: nanoid(8),
    type: 'interaction',
    subType: 'like',
    title: '李四 等 3 人 点赞了你的文章',
    content: '“关于校园二手交易的思考”',
    sender: null, // 聚合通知可能没有单一发送者
    relatedId: 'article_123',
    targetUrl: '/article/detail/123',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15分钟前
  },
  {
    id: nanoid(8),
    type: 'transaction',
    subType: 'order_shipped',
    title: '订单已发货',
    content: '您购买的“九成新MacBook Pro”已发货，快递单号 SF123456789。',
    sender: null,
    relatedId: 'order_789',
    targetUrl: '/user/order/order_789',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3小时前
  },
  {
    id: nanoid(8),
    type: 'lostfound',
    subType: 'status_update',
    title: '失物状态更新',
    content: '您发布的“丢失的AirPods Pro”状态已更新为“已找到”！请及时确认。',
    sender: null,
    relatedId: 'lf_50',
    targetUrl: '/lostfound/detail/lf_50',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1天前
  },
  {
    id: nanoid(8),
    type: 'system',
    subType: 'announcement',
    title: '平台维护公告',
    content: '为了提供更好的服务，平台将于明晚23:00至次日凌晨3:00进行系统维护...',
    sender: null,
    relatedId: 'sys_announce_001',
    targetUrl: '/announcement/sys_announce_001', // 假设有公告详情页
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2天前
  },
  // Add more mock data as needed
];

/**
 * 获取通知列表 (Mock)
 * @param {object} params
 * @param {string} params.type - 通知类型 ('all', 'interaction', 'transaction', 'system', 'lostfound')
 * @param {number} params.page - 页码 (暂未使用)
 * @param {number} params.limit - 每页数量 (暂未使用)
 * @returns {Promise<{code: number, message: string, data: {list: any[], total: number}}>}
 */
export function getNotifications(params = { type: 'all' }) {
  console.log('[API Mock] getNotifications called with params:', params);
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredList = mockNotifications;
      if (params.type && params.type !== 'all') {
        filteredList = mockNotifications.filter(n => n.type === params.type);
      }
      // 简单模拟，未实现分页
      const response = {
        code: 200,
        message: 'success',
        data: {
          list: JSON.parse(JSON.stringify(filteredList)),
          total: filteredList.length
        }
      };
      console.log('[API Mock] Returning notifications:', response.data.list);
      resolve(response);
    }, 400); // 模拟网络延迟
  });
}

/**
 * 获取未读通知总数 (Mock)
 * @returns {Promise<{code: number, message: string, data: {count: number, byType: {interaction: number, transaction: number, lostfound: number, system: number}}}>}
 */
export function getUnreadCount() {
  console.log('[API Mock] getUnreadCount called');
  return new Promise((resolve) => {
    setTimeout(() => {
      const unreadByType = {
        interaction: 0,
        transaction: 0,
        lostfound: 0,
        system: 0
      };
      let totalUnread = 0;

      mockNotifications.forEach(n => {
        if (!n.isRead) {
          totalUnread++;
          if (unreadByType[n.type] !== undefined) {
            unreadByType[n.type]++;
          }
        }
      });

      const responseData = {
        count: totalUnread, // 总未读数
        byType: unreadByType // 按类型分类的未读数
      };

      console.log('[API Mock] Returning unread counts:', responseData);
      resolve({ code: 200, message: 'success', data: responseData });
    }, 200);
  });
}

/**
 * 将指定通知标记为已读 (Mock)
 * @param {object} data
 * @param {string[]} data.ids - 要标记为已读的通知ID数组
 * @returns {Promise<{code: number, message: string}>}
 */
export function markNotificationsAsRead(data) {
  const ids = data.ids || [];
  console.log('[API Mock] markNotificationsAsRead called with IDs:', ids);
  return new Promise((resolve) => {
    setTimeout(() => {
      let markedCount = 0;
      mockNotifications = mockNotifications.map(n => {
        if (ids.includes(n.id) && !n.isRead) {
          n.isRead = true;
          markedCount++;
        }
        return n;
      });
      console.log(`[API Mock] Marked ${markedCount} notifications as read.`);
      resolve({ code: 200, message: '标记成功' });
    }, 150);
  });
}

/**
 * 将所有通知标记为已读 (Mock)
 * @param {object} params
 * @param {string} params.type - 要标记的类型 ('all', 'interaction', etc.)
 * @returns {Promise<{code: number, message: string}>}
 */
export function markAllNotificationsAsRead(params = { type: 'all' }) {
  const type = params.type;
  console.log(`[API Mock] markAllNotificationsAsRead called for type: ${type}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      let markedCount = 0;
      mockNotifications = mockNotifications.map(n => {
        if (!n.isRead && (type === 'all' || n.type === type)) {
          n.isRead = true;
          markedCount++;
        }
        return n;
      });
      console.log(`[API Mock] Marked all ${markedCount} notifications as read for type: ${type}.`);
      resolve({ code: 200, message: '全部标记成功' });
    }, 250);
  });
}
