<template>
  <div class="conversations-page ios-style">
    <!-- 头部导航 -->
    <header-nav title="会话列表">
      <template #right>
        <div class="header-actions">
          <van-icon name="search" size="1.5rem" @click="router.push('/search')" />
          <van-icon name="plus" size="1.5rem" @click="toggleNewChatOptions" />
        </div>
      </template>
    </header-nav>
    
    <!-- 新建聊天选项 -->
    <van-popup v-model:show="showNewChatOptions" position="bottom" round :style="{ height: '30%' }">
      <div class="new-chat-options">
        <div class="option-item" @click="navigateToContactList">
          <van-icon name="friends-o" size="24" />
          <span>选择联系人</span>
        </div>
        <div class="option-item" @click="navigateToGroups">
          <van-icon name="wechat" size="24" />
          <span>选择群聊</span>
        </div>
        <div class="option-item" @click="navigateToFriendRequests">
          <van-badge :content="newFriendRequestsCount || ''" :show-zero="false">
            <van-icon name="add-o" size="24" />
          </van-badge>
          <span>添加好友</span>
        </div>
      </div>
    </van-popup>

    <!-- 消息类型切换 -->
    <div class="message-tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'chat' }"
        @click="activeTab = 'chat'"
      >
        聊天消息
        <div v-if="unreadChatCount > 0" class="badge">{{ formatBadge(unreadChatCount) }}</div>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'notification' }"
        @click="activeTab = 'notification'"
      >
        通知
        <div v-if="unreadNotificationCount > 0" class="badge">{{ formatBadge(unreadNotificationCount) }}</div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="activeTab === 'chat'">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <!-- 加载中显示 -->
        <div v-if="loading" class="loading-container">
          <van-loading size="24px">加载中...</van-loading>
        </div>
        
        <!-- 空状态 -->
        <van-empty 
          v-else-if="conversations.length === 0"
          description="暂无会话记录"
          image="chat"
        >
          <template #bottom>
            <van-button round type="primary" size="small" @click="navigateToContactList">开始聊天</van-button>
          </template>
        </van-empty>
          
        <!-- 会话列表 -->
        <div v-else class="conversation-list-container">
          <div 
            v-for="(conversation, index) in conversations" 
            :key="conversation.id"
            class="conversation-item"
            :class="{ unread: conversation.unreadCount > 0 }"
            @click="navigateToChat(conversation)"
            @touchstart="touchStart($event, index)"
            @touchmove="touchMove($event, index)"
            @touchend="touchEnd(index)"
          >
            <!-- 侧滑操作区域 -->
            <div class="swipe-actions" :style="{ transform: `translateX(${swipeOffset[index] || 0}px)` }">
              <div 
                class="action mark-read" 
                @click.stop="markAsRead(conversation)"
                v-if="conversation.unreadCount > 0"
              >
                标为已读
              </div>
              <div 
                class="action delete" 
                @click.stop="deleteConversation(conversation)"
              >
                删除
              </div>
            </div>
            
            <!-- 会话内容 -->
            <div class="chat-content" :style="{ transform: `translateX(${swipeOffset[index] || 0}px)` }">
              <!-- 头像 -->
              <van-image
                round
                width="3rem"
                height="3rem"
                :src="conversation.targetInfo?.avatar"
                fit="cover"
              >
                <template #error>
                  <div class="avatar-fallback">{{ getInitials(conversation.targetInfo?.name) }}</div>
                </template>
              </van-image>
              
              <!-- 会话信息 -->
              <div class="chat-info">
                <div class="top-line">
                  <div class="nickname">{{ conversation.targetInfo?.name }}</div>
                  <div class="time">{{ formatTime(conversation.lastMessage?.timestamp) }}</div>
                </div>
                
                <div class="bottom-line">
                  <div class="last-message">
                    <span v-if="conversation.lastMessage">
                      <span v-if="conversation.lastMessage.type === 'text'">
                        {{ truncateText(conversation.lastMessage.content) }}
                      </span>
                      <span v-else-if="conversation.lastMessage.type === 'image'">
                        [图片]
                      </span>
                      <span v-else-if="conversation.lastMessage.type === 'voice'">
                        [语音消息 {{ conversation.lastMessage.duration }}″]
                      </span>
                      <span v-else-if="conversation.lastMessage.type === 'location'">
                        [位置共享]
                      </span>
                      <span v-else>
                        [未知类型消息]
                      </span>
                    </span>
                    <span v-else class="no-message">暂无消息</span>
                  </div>
                  
                  <div v-if="conversation.unreadCount > 0" class="unread-count">
                    {{ formatBadge(conversation.unreadCount) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 加载更多按钮 -->
          <div v-if="!finished" class="load-more" @click="loadMore">
            <span v-if="!loadingMore">加载更多</span>
            <van-loading v-else size="16px">加载中</van-loading>
          </div>
          <div v-else class="no-more">
            - 没有更多会话 -
          </div>
        </div>
      </van-pull-refresh>
    </div>

    <!-- 通知列表 -->
    <div v-if="activeTab === 'notification'" class="notification-list">
      <van-empty 
        v-if="notifications.length === 0" 
        description="暂无通知" 
        image="comment-o"
      />
      
      <div 
        v-else
        v-for="notification in notifications" 
        :key="notification.id" 
        class="notification-item"
        :class="{ unread: !notification.read }"
        @click="handleNotification(notification)"
      >
        <div class="notification-icon" :class="notification.type">
          <van-icon :name="getNotificationIcon(notification.type)" size="20" />
        </div>
        
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-text">{{ notification.content }}</div>
          <div class="notification-time">{{ formatTime(notification.time) }}</div>
        </div>
        
        <div v-if="!notification.read" class="unread-indicator"></div>
      </div>
    </div>
    
    <!-- 底部导航栏 -->
    <div class="tab-bar">
      <div class="tab-item active" @click="router.push('/im/conversations')">
        <van-icon name="chat-o" size="24" />
        <span class="tab-text">消息</span>
        <van-badge v-if="unreadChatCount > 0" :content="unreadChatCount" />
      </div>
      <div class="tab-item" @click="router.push('/im/friend-requests')">
        <van-icon name="friends-o" size="24" />
        <span class="tab-text">联系人</span>
        <van-badge v-if="newFriendRequestsCount > 0" :content="newFriendRequestsCount" />
      </div>
      <div class="tab-item" @click="router.push('/im/groups')">
        <van-icon name="cluster-o" size="24" />
        <span class="tab-text">群组</span>
      </div>
      <div class="tab-item" @click="router.push('/mine')">
        <van-icon name="user-o" size="24" />
        <span class="tab-text">我的</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { deleteSession, getConversations, getFriendRequests, getUserProfile, markMessageRead } from '@/api/im';
import HeaderNav from '@/components/HeaderNav.vue';
import { useIMStore } from '@/store/im';
import { useUserStore } from '@/store/user';
import { wsClient } from '@/utils/websocket'; // 导入WebSocket客户端
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { showDialog, showToast } from 'vant';
import { computed, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

// 路由和状态管理
const router = useRouter();
const userStore = useUserStore();
const imStore = useIMStore();
const { userInfo } = storeToRefs(userStore);

// 激活的标签页
const activeTab = ref('chat');

// 会话列表相关状态
const conversations = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = ref(20);
let dataFetchedOnce = false; // 标记是否已经成功获取过数据

// 新建聊天相关状态
const showNewChatOptions = ref(false);
const newFriendRequestsCount = ref(0);

// 通知列表
const notifications = ref([]);

// 侧滑相关状态
const swipeOffset = ref({});
const touchStartX = ref(0);
const currentSwipeIndex = ref(null);
const swipeThreshold = 80; // 触发操作的阈值
const maxSwipeOffset = 150; // 最大侧滑距离

// 用户资料临时缓存 
const userProfiles = {};

// 获取未读消息总数
const unreadChatCount = computed(() => {
  return conversations.value.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
});

// 未读通知数
const unreadNotificationCount = computed(() => {
  return notifications.value.filter(notification => !notification.read).length;
});

// 监听未读消息总数变化，更新标题栏
watch(unreadChatCount, (count) => {
  document.title = count > 0 ? 
    `(${count}) 消息 - ${import.meta.env.VITE_APP_TITLE || 'IM App'}` : 
    (import.meta.env.VITE_APP_TITLE || 'IM App');
}, { immediate: true });

// 切换新建聊天选项面板
const toggleNewChatOptions = () => {
  showNewChatOptions.value = !showNewChatOptions.value;
};

// 导航到联系人列表
const navigateToContactList = () => {
  showNewChatOptions.value = false;
  router.push('/im/contacts');
};

// 导航到群聊列表
const navigateToGroups = () => {
  showNewChatOptions.value = false;
  router.push('/im/groups');
};

// 导航到好友申请列表
const navigateToFriendRequests = () => {
  showNewChatOptions.value = false;
  router.push('/im/friend-requests');
};

// 导航到聊天界面
const navigateToChat = (conversation) => {
  console.log('点击会话导航:', conversation);
  
  // 确保targetId存在
  if (!conversation.targetId && !conversation.id) {
    showToast('会话信息不完整');
    return;
  }
  
  // 从会话ID中提取用户ID
  const targetId = String(conversation.targetId || conversation.targetInfo?.id);
  
  if (!targetId) {
    showToast('无法确定聊天对象');
    return;
  }
  
  // 修复URL格式，确保参数正确编码
  router.push({
    path: `/im/chat/${targetId}`,
    query: {
      name: conversation.targetInfo?.name || '聊天',
      conversationId: conversation.id
    }
  });
  
  // 如果有未读消息，标记为已读
  if (conversation.unreadCount > 0) {
    markMessageRead({ conversationId: conversation.id })
      .then(() => {
        // 更新本地未读计数
        const index = conversations.value.findIndex(c => c.id === conversation.id);
        if (index !== -1) {
          conversations.value[index].unreadCount = 0;
          
          // 同步更新到IM store
          imStore.markConversationAsRead(conversation.id);
        }
      })
      .catch(err => {
        console.error('标记会话已读失败:', err);
      });
  }
};

// 通过ID获取默认头像
const getDefaultAvatar = (userId) => {
  return `https://api.dicebear.com/6.x/avataaars/svg?seed=user${userId}`;
};

// 加载会话列表
const fetchConversations = async (isRefresh = false) => {
  // 先检查用户是否登录
  if (!userStore.isLoggedIn) {
    console.log('用户未登录，跳过获取会话列表');
    finished.value = true;
    loading.value = false;
    loadingMore.value = false;
    return;
  }
  
  if (isRefresh) {
    page.value = 1;
    finished.value = false;
  }
  
  try {
    loading.value = true;
    
    // 获取会话列表
    const response = await getConversations();
    
    console.log('获取会话列表响应:', response);
    dataFetchedOnce = true;
    
    // 检查响应
    if (!response.userId || !response.conversationList) {
      console.error('获取会话列表失败，响应异常:', response);
      showToast(response.message || '获取会话列表失败');
      finished.value = true;
      return;
    }
    
    const userId = response.userId;
    const conversationMap = response.conversationList || {};
    
    console.log('收到的会话数据:', conversationMap);
    
    // 转换会话数据为数组，并解析conversationId
    const conversationArray = await Promise.all(
      Object.entries(conversationMap).map(async ([conversationId, data]) => {
        // 从会话ID中提取对方用户ID
        const targetId = conversationId.split('_').find(id => id !== userId.toString()) || '';
        console.log(`解析会话ID: ${conversationId}, 目标用户ID: ${targetId}`);
        
        // 尝试获取目标用户信息
        let targetInfo = {
          id: targetId,
          name: `用户${targetId}`,
          avatar: getDefaultAvatar(targetId)
        };
        
        // 如果有目标ID，获取用户详情
        if (targetId) {
          try {
            // 检查缓存中是否有此用户数据
            if (userProfiles[targetId]) {
              const cachedUser = userProfiles[targetId];
              targetInfo = {
                id: targetId,
                name: cachedUser.nickname || cachedUser.username || `用户${targetId}`,
                avatar: cachedUser.avatar || getDefaultAvatar(targetId)
              };
              console.log(`使用缓存用户数据: 用户${targetId}`, targetInfo);
            } else {
              // 请求API获取用户信息
              console.log(`请求用户资料API: /api/user/profile/${targetId}`);
              const userResponse = await getUserProfile(targetId);
              console.log(`用户${targetId}资料响应:`, userResponse);
              
              // 判断响应是否成功
              if (userResponse && (userResponse.code === 200 || userResponse.userId)) {
                // 直接使用响应数据或响应中的data字段
                const userData = userResponse.data || userResponse;
                console.log(`用户${targetId}资料数据:`, userData);
                
                targetInfo = {
                  id: targetId,
                  name: userData.nickname || userData.username || `用户${targetId}`,
                  avatar: userData.avatar || getDefaultAvatar(targetId)
                };
                console.log(`处理后的目标用户信息:`, targetInfo);
                
                // 添加到临时缓存
                userProfiles[targetId] = userData;
                console.log(`已缓存用户${targetId}资料`);
              } else {
                console.warn(`获取用户${targetId}资料失败:`, userResponse.message || '未知错误');
              }
            }
          } catch (error) {
            console.error(`获取用户${targetId}信息失败:`, error);
          }
        }
        
        // 为缺失的字段提供默认值
        const defaultLastMessage = {
          content: '开始对话',
          type: 'text',
          timestamp: Date.now()
        };
        
        return {
          id: conversationId,
          targetId: targetId,
          type: data.ChatType === 1 ? 'group' : 'private',
          chatType: data.ChatType || 2, // 默认为单聊(2) 
          unreadCount: data.unread || 0,
          targetInfo,
          lastMessage: data.lastMessage || defaultLastMessage
        };
      })
    );
    
    // 过滤并排序会话
    const sortedConversations = conversationArray
      .filter(conv => conv.lastMessage)
      .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
    
    if (isRefresh || page.value === 1) {
      conversations.value = sortedConversations;
    } else {
      // 合并会话，避免重复
      const existingIds = new Set(conversations.value.map(c => c.id));
      const uniqueNewConversations = sortedConversations.filter(c => !existingIds.has(c.id));
      conversations.value = [...conversations.value, ...uniqueNewConversations];
    }
    
    // 同步到IM store
    imStore.setConversations(conversations.value);
    
    // 根据数据量判断是否还有更多
    finished.value = true; // 目前API不支持分页，所以一次性加载所有
    
  } catch (error) {
    console.error('获取会话列表失败:', error);
    showToast('网络错误，请重试');
    finished.value = true;
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
};

// 加载更多会话 (当前API不支持分页，但保留此函数以备将来扩展)
const loadMore = () => {
  // 如果已经完成或正在加载中，不再发出请求
  if (finished.value || loadingMore.value || loading.value) {
    return;
  }
  
  loadingMore.value = true;
  page.value += 1;
  fetchConversations();
};

// 刷新会话列表
const onRefresh = () => {
  refreshing.value = true;
  fetchConversations(true);
};

// 标记会话为已读
const markAsRead = async (conversation) => {
  try {
    await markMessageRead({ conversationId: conversation.id });
    
    // 更新本地状态
    const index = conversations.value.findIndex(c => c.id === conversation.id);
    if (index !== -1) {
      conversations.value[index].unreadCount = 0;
      
      // 同步更新到IM store
      imStore.markConversationAsRead(conversation.id);
    }
    
    // 关闭侧滑菜单
    swipeOffset.value[currentSwipeIndex.value] = 0;
    currentSwipeIndex.value = null;
  } catch (error) {
    console.error('标记已读失败:', error);
    showToast('操作失败，请重试');
  }
};

// 删除会话
const deleteConversation = (conversation) => {
  showDialog({
    title: '删除会话',
    message: `确定要删除与 ${conversation.targetInfo?.name || '对方'} 的会话吗？`,
    showCancelButton: true,
  }).then(async () => {
    try {
      await deleteSession({ conversationId: conversation.id });
      
      // 更新本地状态
      conversations.value = conversations.value.filter(c => c.id !== conversation.id);
      
      // 同步更新到IM store
      imStore.removeConversation(conversation.id);
      
      showToast('删除成功');
    } catch (error) {
      console.error('删除会话失败:', error);
      showToast('删除失败，请重试');
    }
  }).catch(() => {
    // 用户取消
    // 关闭侧滑菜单
    swipeOffset.value[currentSwipeIndex.value] = 0;
    currentSwipeIndex.value = null;
  });
};

// 处理触摸开始事件
const touchStart = (event, index) => {
  // 如果当前有其他项目处于侧滑状态，先重置
  if (currentSwipeIndex.value !== null && currentSwipeIndex.value !== index) {
    swipeOffset.value[currentSwipeIndex.value] = 0;
  }
  
  touchStartX.value = event.touches[0].clientX;
  currentSwipeIndex.value = index;
};

// 处理触摸移动事件
const touchMove = (event, index) => {
  if (currentSwipeIndex.value !== index) return;
  
  const currentX = event.touches[0].clientX;
  const diff = touchStartX.value - currentX;
  
  // 只允许向左滑动（diff > 0）
  if (diff > 0) {
    // 限制最大滑动距离
    swipeOffset.value[index] = Math.min(diff, maxSwipeOffset);
  } else {
    swipeOffset.value[index] = 0;
  }
};

// 处理触摸结束事件
const touchEnd = (index) => {
  if (currentSwipeIndex.value !== index) return;
  
  // 根据滑动距离判断是否显示操作按钮
  if (swipeOffset.value[index] >= swipeThreshold) {
    swipeOffset.value[index] = maxSwipeOffset;
  } else {
    swipeOffset.value[index] = 0;
  }
};

// 处理通知
const handleNotification = (notification) => {
  // 标记通知为已读
  notification.read = true;
  
  // 根据通知类型执行不同操作
  switch (notification.type) {
    case 'friend_request':
      router.push('/im/friend-requests');
      break;
    case 'group_invite':
      router.push('/im/groups');
      break;
    case 'system':
      // 处理系统通知
      break;
    default:
      break;
  }
};

// 获取通知图标
const getNotificationIcon = (type) => {
  switch (type) {
    case 'friend_request':
      return 'friends-o';
    case 'group_invite':
      return 'cluster-o';
    case 'system':
      return 'info-o';
    default:
      return 'bell';
  }
};

// 格式化徽标数字
const formatBadge = (count) => {
  return count > 99 ? '99+' : count;
};

// 截断文本
const truncateText = (text) => {
  if (!text) return '';
  return text.length > 20 ? text.substring(0, 20) + '...' : text;
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  
  const date = dayjs(time);
  const now = dayjs();
  
  if (date.isSame(now, 'day')) {
    // 今天，显示时间
    return date.format('HH:mm');
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    // 昨天
    return '昨天';
  } else if (date.isSame(now, 'year')) {
    // 今年，显示月日
    return date.format('MM-DD');
  } else {
    // 往年，显示年月日
    return date.format('YYYY-MM-DD');
  }
};

// 获取联系人名称首字母
const getInitials = (name) => {
  if (!name) return '';
  return name.charAt(0).toUpperCase();
};

// 加载好友申请数量
const loadFriendRequestsCount = async () => {
  try {
    const response = await getFriendRequests({ status: 'pending' });
    if (response.code === 200 && response.data) {
      newFriendRequestsCount.value = response.data.total || 0;
    }
  } catch (error) {
    console.error('获取好友申请数量失败:', error);
  }
};

// 初始化模拟通知数据
const initMockNotifications = () => {
  // 仅在mock环境下初始化模拟数据
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    notifications.value = [
      {
        id: 1,
        type: 'friend_request',
        title: '好友申请',
        content: '张三请求添加您为好友',
        time: '2023-04-18 14:30:00',
        read: false
      },
      {
        id: 2,
        type: 'group_invite',
        title: '群聊邀请',
        content: '李四邀请您加入群聊"校园活动"',
        time: '2023-04-17 10:20:00',
        read: false
      },
      {
        id: 3,
        type: 'system',
        title: '系统通知',
        content: '您的账号已完成实名认证',
        time: '2023-04-16 09:15:00',
        read: true
      }
    ];
  }
};

// 更新未读消息数
const updateUnreadCount = () => {
  // 从IM Store中获取未读消息总数
  const totalUnread = imStore.getTotalUnreadCount();
  
  // 更新文档标题
  document.title = totalUnread > 0 ? 
    `(${totalUnread}) 消息 - ${import.meta.env.VITE_APP_TITLE || 'IM App'}` : 
    (import.meta.env.VITE_APP_TITLE || 'IM App');
};

// 处理新消息更新会话列表
const updateConversationWithNewMessage = (messageData) => {
  console.log('处理新消息更新会话列表:', messageData);
  
  // 查找是否已有该会话
  const conversationId = messageData.conversationId;
  const conversationIndex = conversations.value.findIndex(c => c.id === conversationId);
  
  // 格式化消息类型
  const messageType = messageData.mType === 0 ? 'text' : 
                    messageData.mType === 1 ? 'image' : 
                    messageData.mType === 2 ? 'voice' : 
                    messageData.mType === 3 ? 'video' : 
                    messageData.mType === 5 ? 'file' : 'unknown';
  
  // 格式化消息内容
  let messageContent = messageData.content;
  // 针对不同类型的消息进行不同的格式化处理
  if (messageType !== 'text') {
    try {
      if (messageType === 'image') {
        messageContent = '[图片]';
      } else if (messageType === 'voice') {
        messageContent = '[语音]';
      } else if (messageType === 'video') {
        messageContent = '[视频]';
      } else if (messageType === 'file') {
        const fileData = JSON.parse(messageData.content);
        messageContent = `[文件] ${fileData.name || '文件'}`;
      } else {
        messageContent = `[${messageType}]`;
      }
    } catch (e) {
      console.error('解析消息内容出错:', e);
      messageContent = `[${messageType}]`;
    }
  }
  
  if (conversationIndex !== -1) {
    // 更新现有会话
    const conversation = {...conversations.value[conversationIndex]};
    
    // 更新最后消息
    conversation.lastMessage = {
      type: messageType,
      content: messageContent,
      timestamp: messageData.sendTime || Date.now()
    };
    
    // 如果发送者不是当前用户，增加未读计数
    if (messageData.sendId !== userStore.userInfo.id.toString()) {
      conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    }
    
    // 将此会话移到顶部
    conversations.value.splice(conversationIndex, 1);
    conversations.value.unshift(conversation);
    
    // 播放通知声音（如果不是自己发送的消息且不是当前活跃会话）
    if (messageData.sendId !== userStore.userInfo.id.toString() && 
        router.currentRoute.value.path !== `/im/chat/${conversation.targetId}`) {
      playNotificationSound();
    }
  } else {
    // 会话不存在，刷新会话列表
    fetchConversations(true);
  }
};

// 播放消息通知声音
const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/message.mp3');
    audio.volume = 0.5; // 设置音量为50%
    audio.play().catch(e => console.log('播放通知声音失败:', e));
  } catch (e) {
    console.log('播放通知声音出错:', e);
  }
};

// 组件挂载时
onMounted(() => {
  console.log('Conversations组件已挂载');
  
  // 连接WebSocket
  if (wsClient && userStore.isLoggedIn) {
    if (!wsClient.isConnected()) {
      wsClient.connect();
    }
    
    // 设置WebSocket监听器
    const removeWSListener = wsClient.addListener({
      onMessage: (message) => {
        console.log('会话列表收到WebSocket消息:', message);
        
        // 只处理push消息
        if (message.method === 'push' && message.data) {
          const data = message.data;
          
          // 处理新消息通知
          if (data.contentType === 0) { // 聊天消息
            updateConversationWithNewMessage(data);
            
            // 更新全局未读消息数
            updateUnreadCount();
          } else if (data.contentType === 1) { // 已读回执
            // 处理已读回执更新
            if (data.conversationId) {
              const conversationIndex = conversations.value.findIndex(c => c.id === data.conversationId);
              if (conversationIndex !== -1 && data.sendId === userStore.userInfo.id) {
                // 对方已读我们的消息，可以更新UI显示
                console.log('收到已读回执:', data);
              }
            }
          } else if (data.contentType === 2) { // 用户状态
            // 更新用户在线状态
            console.log('用户状态更新:', data);
            if (data.status === 'online' && data.userId) {
              imStore.addOnlineUser(data.userId);
            } else if (data.status === 'offline' && data.userId) {
              imStore.removeOnlineUser(data.userId);
            }
          }
        }
      },
      onError: (error) => {
        console.error('WebSocket错误:', error);
        showToast('连接错误，请检查网络');
      },
      onStateChange: (state) => {
        console.log('WebSocket状态变更:', state);
        
        // 如果断开连接，尝试重连
        if (state === 'disconnected' && userStore.isLoggedIn) {
          setTimeout(() => {
            if (userStore.isLoggedIn && !wsClient.isConnected()) {
              console.log('尝试重新连接WebSocket...');
              wsClient.connect();
            }
          }, 3000); // 3秒后尝试重连
        }
      }
    });
    
    // 组件卸载时移除监听器
    onBeforeUnmount(() => {
      if (removeWSListener) removeWSListener();
    });
  }
  
  // 加载会话列表
  fetchConversations();
  
  // 加载好友申请数量
  loadFriendRequestsCount();
  
  // 初始化模拟通知数据
  initMockNotifications();
  
  // 监听IM Store中未读消息变化
  const unsubscribe = imStore.$subscribe((mutation, state) => {
    updateUnreadCount();
  });
  
  // 组件卸载时移除监听
  onBeforeUnmount(() => {
    unsubscribe();
  });
});

// 组件激活时
onActivated(() => {
  // 每次组件激活时刷新会话列表
  if (dataFetchedOnce) {
    fetchConversations(true);
  }
  
  // 更新未读消息数
  updateUnreadCount();
  
  // 确保WebSocket已连接
  if (wsClient && userStore.isLoggedIn && !wsClient.isConnected()) {
    wsClient.connect();
  }
});
</script>

<style scoped>
.conversations-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--van-background);
  padding-bottom: 50px; /* 为底部导航栏留出空间 */
}

.ios-style {
  --van-radius-md: 8px;
  --item-active-color: #f0f9ff;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.message-tabs {
  display: flex;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
  position: sticky;
  top: 46px;
  z-index: 10;
}

.tab-item {
  flex: 1;
  padding: 12px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  color: var(--van-gray-6);
}

.tab-item.active {
  color: var(--van-primary-color);
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: var(--van-primary-color);
  border-radius: 2px;
}

.badge {
  position: absolute;
  top: 5px;
  right: 25%;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  color: #fff;
  background-color: var(--van-danger-color);
  border-radius: 8px;
}

.new-chat-options {
  padding: 20px 16px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  font-size: 16px;
}

.option-item span {
  margin-left: 12px;
}

.conversation-list-container {
  padding: 0 16px;
}

.conversation-item {
  position: relative;
  overflow: hidden;
}

.chat-content {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid var(--van-border-color);
  background-color: #fff;
  transition: transform 0.3s ease;
}

.swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  transform: translateX(0);
}

.action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 100%;
  color: #fff;
  font-size: 14px;
}

.action.mark-read {
  background-color: var(--van-blue);
}

.action.delete {
  background-color: var(--van-danger-color);
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--van-primary-color);
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.chat-info {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.top-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.nickname {
  font-size: 16px;
  font-weight: 500;
  color: var(--van-text-color);
}

.time {
  font-size: 12px;
  color: var(--van-gray-5);
}

.bottom-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  flex: 1;
  font-size: 14px;
  color: var(--van-gray-6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-message {
  font-style: italic;
  color: var(--van-gray-5);
}

.unread-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  color: #fff;
  background-color: var(--van-danger-color);
  border-radius: 9px;
}

.unread {
  background-color: var(--item-active-color);
}

/* 通知样式 */
.notification-list {
  flex: 1;
  padding: 0 16px;
  overflow-y: auto;
  padding-bottom: 50px;
}

.notification-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid var(--van-border-color);
  background-color: #fff;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.notification-icon.like {
  background-color: #ffebee;
  color: #f44336;
}

.notification-icon.comment {
  background-color: #e3f2fd;
  color: #2196f3;
}

.notification-icon.follow {
  background-color: #e8f5e9;
  color: #4caf50;
}

.notification-icon.system {
  background-color: #fffde7;
  color: #ffc107;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--van-text-color);
}

.notification-text {
  font-size: 14px;
  margin-bottom: 4px;
  color: var(--van-gray-7);
}

.notification-time {
  font-size: 12px;
  color: var(--van-gray-5);
}

.unread-indicator {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: var(--van-danger-color);
  margin-left: 8px;
  align-self: flex-start;
  margin-top: 8px;
}

/* 新增样式 */
.loading-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.load-more {
  text-align: center;
  padding: 15px 0;
  color: var(--van-gray-6);
  font-size: 14px;
  cursor: pointer;
}

.no-more {
  text-align: center;
  padding: 15px 0;
  color: var(--van-gray-5);
  font-size: 14px;
}

/* 底部导航栏样式 */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.5rem 0;
  border-top: 1px solid #f5f5f5;
  height: 50px;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #1989fa;
}

.tab-text {
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Badge样式 */
:deep(.van-badge) {
  position: absolute;
  top: -8px;
  right: -12px;
}

/* 为页面内容添加底部padding，防止被导航栏遮挡 */
.page-container {
  padding-bottom: 60px;
}
</style>