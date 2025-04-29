<!-- 聊天页面 -->
<template>
  <div class="chat-page">
    <!-- 头部导航 -->
    <header class="chat-header">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
        </div>
      <div class="title">
        <h1>{{ chatTitle }}</h1>
        <div class="subtitle" v-if="showSubtitle">
          {{ isOnline ? '在线' : lastActiveText }}
        </div>
          </div>
      <div class="more-btn" @click="showChatOptions">
        <i class="icon-more-vertical"></i>
        </div>
    </header>
    
    <!-- 消息列表 -->
    <div 
      class="message-list" 
      ref="messageListEl"
      @scroll="handleScroll"
    >
      <!-- 加载更多提示 -->
      <div class="loading-more" v-if="loading.more">
        <div class="loading-spinner"></div>
        <span>加载更多消息...</span>
      </div>
      
      <!-- 没有更多消息提示 -->
      <div class="no-more-messages" v-if="!hasMoreMessages && messages.length > 0">
        没有更多消息了
      </div>
      
      <!-- 消息为空提示 -->
      <div class="empty-message" v-if="!loading.messages && messages.length === 0">
        <div class="empty-icon">
          <i class="icon-chat-empty"></i>
        </div>
        <div class="empty-text">暂无消息，开始聊天吧</div>
      </div>
      
      <!-- 添加调试信息，方便排查问题 -->
      <div v-if="!loading.messages && messages.length > 0" class="debug-info" style="color: grey; font-size: 10px; text-align: center;">
        已加载 {{ messages.length }} 条消息
      </div>
      
      <!-- 消息列表 -->
      <template v-for="(message, index) in messages" :key="message.id">
        <!-- 时间分割线 -->
        <div 
          class="time-divider" 
          v-if="shouldShowTime(message, messages[index - 1])"
        >
          {{ formatTime(message.timestamp) }}
        </div>
        
        <!-- 消息气泡 -->
        <ChatBubble
          :message="message"
          :show-avatar="true"
          :show-name="conversation?.type === 'group'"
          :read-status="message.readStatus"
          :show-read-status="message.isSelf"
          :delivery-status="message.status"
          @avatar-click="viewUserProfile"
          @image-preview="previewImage"
          @file-preview="previewFile"
          @location-view="viewLocation"
          @retry="retryMessage"
          @forward="forwardMessage"
          @delete="deleteMessage"
          @recall="recallMessage"
        />
      </template>
      
      <!-- 发送状态指示器 -->
      <div class="sending-indicator" v-if="loading.sending">
        <div class="sending-spinner"></div>
        <span>发送中...</span>
      </div>
      
      <!-- 对方正在输入提示 -->
      <div class="typing-indicator" v-if="isTyping">
        {{ typingName }} 正在输入...
      </div>
      
      <!-- 底部空白填充，确保内容不被输入框遮挡 -->
      <div class="bottom-spacer"></div>
    </div>
    
    <!-- 聊天输入框 -->
    <ChatInput
      ref="chatInputEl"
      :conversation-id="conversationId"
      :placeholder="inputPlaceholder"
      :disabled="inputDisabled"
      @send="onMessageSent"
      @focus="onInputFocus"
      @blur="onInputBlur"
      @panel-change="onPanelChange"
      @send-image="onImageSent"
      @send-file="onFileSent"
      @send-location="selectLocation"
      @input="onInputChange"
    />
    
    <!-- 图片预览 -->
    <div class="image-preview" v-if="showImagePreview" @click="closeImagePreview">
      <div class="preview-image">
        <img :src="previewImageUrl" alt="图片预览">
      </div>
      <div class="preview-close">
        <i class="icon-close"></i>
      </div>
    </div>
    
    <!-- 聊天选项菜单 -->
    <div class="chat-options" v-if="showOptions">
      <div class="options-overlay" @click="showOptions = false"></div>
      <div class="options-panel">
        <div 
          v-for="option in chatOptions" 
          :key="option.id" 
          class="option-item"
          @click="handleOptionClick(option.id)"
        >
          {{ option.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  CHAT_TYPE,
  clearMessages,
  getChatLog,
  getChatLogReadRecords,
  getConversationDetail,
  getUserProfile,
  MESSAGE_TYPE,
  parseImageContent,
  recallMessageById,
  setUpUserConversation,
  uploadChatFile,
  uploadChatImage,
  wsActions
} from '@/api/im'
import ChatBubble from '@/components/chat/ChatBubble.vue'
import ChatInput from '@/components/im/ChatInput.vue'
import { useIMStore } from '@/store/im'
import { useUserStore } from '@/store/user'
import { formatMessageTime, shouldShowTimeDivider } from '@/utils/messageFormatter'
import { wsClient } from '@/utils/websocket'
import { showToast } from 'vant'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 路由
const route = useRoute()
const router = useRouter()

// Store
const userStore = useUserStore()
const imStore = useIMStore()

// Props
const props = defineProps({
  conversationType: {
    type: String,
    default: 'private'
  },
  targetId: {
    type: [Number, String],
    required: true
  }
})

// 引用元素
const messageListEl = ref(null)
const chatInputEl = ref(null)

// 状态变量
// 会话ID格式：userId_userId 或 1_2, 1_3等
const conversationId = computed(() => {
  const queryConvId = route.query.conversationId;
  
  if (queryConvId) {
    console.log('使用查询参数中的conversationId:', queryConvId);
    return queryConvId.toString();
  }
  
  if (!props.conversationType || !props.targetId) {
    // 尝试从路由参数获取
    const routeId = route.params.id;
    
    if (routeId) {
      console.log('从路由参数构建conversationId');
      // 构建格式为 userId_targetId 的会话ID
      const currentUserId = userStore.userInfo.id;
      const targetUserId = routeId;
      
      // 确保小ID在前
      const ids = [currentUserId.toString(), targetUserId.toString()].sort((a, b) => parseInt(a) - parseInt(b));
      const constructedId = ids.join('_');
      console.log('构建的conversationId:', constructedId);
      return constructedId;
    }
    
    console.warn('无法确定会话ID，缺少targetId或conversationType');
    return '';
  }
  
  // 确保我们的ID在前面（小ID在前）
  const currentUserId = userStore.userInfo.id.toString();
  const targetUserId = props.targetId.toString();
  
  if (props.conversationType === 'private') {
    // 私聊格式：userId_userId
    const ids = [currentUserId, targetUserId].sort((a, b) => parseInt(a) - parseInt(b));
    const finalId = ids.join('_');
    console.log('私聊会话ID:', finalId);
    return finalId;
  } else {
    // 群聊格式 group_groupId
    const finalId = `group_${targetUserId}`;
    console.log('群聊会话ID:', finalId);
    return finalId;
  }
})

const conversation = ref(null)
const targetUser = ref(null)
const messages = ref([])
const loading = ref({
  conversation: false,
  messages: false,
  more: false,
  sending: false
})
const hasMoreMessages = ref(true)
const lastScrollHeight = ref(0)
const lastScrollTop = ref(0)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const showOptions = ref(false)
const isScrolling = ref(false)
const scrollDebounceTimer = ref(null)
const isTyping = ref(false)
const typingName = ref('')
const typingTimer = ref(null)
const typingUsers = ref({})

// 每页加载消息数量
const PAGE_SIZE = 20

// 用户资料临时缓存
const userProfiles = {}

// 根据ID获取默认头像
const getDefaultAvatar = (userId) => {
  return `https://api.dicebear.com/6.x/avataaars/svg?seed=user${userId}`
}

// 计算属性
const chatTitle = computed(() => {
  if (!conversation.value) return '聊天'
  if (conversation.value.type === 'group') {
    return conversation.value.name || '群聊'
  } else {
    return targetUser.value?.nickname || targetUser.value?.name || conversation.value.targetName || '聊天'
  }
})

const showSubtitle = computed(() => {
  return conversation.value?.type === 'private' && targetUser.value
})

const isOnline = computed(() => {
  if (!targetUser.value || !conversation.value?.type === 'private') return false
  return imStore.isUserOnline(targetUser.value.id)
})

const lastActiveText = computed(() => {
  if (!targetUser.value) return ''
  if (!targetUser.value.lastActive) return '离线'
  
  // 计算最后活跃时间
  const lastActive = new Date(targetUser.value.lastActive)
  const now = new Date()
  const diff = Math.floor((now - lastActive) / 1000)
  
  if (diff < 60) {
    return '刚刚活跃'
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟前活跃`
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时前活跃`
  } else {
    return formatMessageTime(lastActive)
  }
})

const inputPlaceholder = computed(() => {
  if (loading.value.conversation) return '加载中...'
  return conversation.value?.type === 'group' ? '发送群消息...' : '发送消息...'
})

const inputDisabled = computed(() => {
  return loading.value.conversation || !conversation.value
})

// 聊天选项
const chatOptions = computed(() => {
  const baseOptions = [
    { id: 'clear', name: '清空聊天记录' }
  ]
  
  if (conversation.value?.type === 'private') {
    baseOptions.push({ id: 'profile', name: '查看资料' })
  } else if (conversation.value?.type === 'group') {
    baseOptions.push({ id: 'members', name: '查看群成员' })
    baseOptions.push({ id: 'leave', name: '退出群聊' })
  }
  
  baseOptions.push({ id: 'delete', name: '删除会话' })
  
  return baseOptions
})

// 格式化消息时间
const formatTime = (timestamp) => {
  return formatMessageTime(timestamp, true)
}

// 判断是否显示时间分割线
const shouldShowTime = (currentMsg, prevMsg) => {
  if (!prevMsg) return true
  return shouldShowTimeDivider(currentMsg, prevMsg, 5)
}

// 滚动到底部
const scrollToBottom = (smooth = false) => {
  nextTick(() => {
    if (!messageListEl.value) return
    
    const scrollOptions = smooth ? { behavior: 'smooth' } : undefined
    messageListEl.value.scrollTo({
      top: messageListEl.value.scrollHeight,
      ...scrollOptions
    })
  })
}

// 处理滚动事件
const handleScroll = () => {
  if (!messageListEl.value) return
  
  // 如果滚动到顶部，加载更多消息
  if (messageListEl.value.scrollTop < 50) {
    loadMoreMessages()
  }
  
  // 防抖处理滚动事件
  if (scrollDebounceTimer.value) {
    clearTimeout(scrollDebounceTimer.value)
  }
  
  isScrolling.value = true
  
  scrollDebounceTimer.value = setTimeout(() => {
    isScrolling.value = false
  }, 100)
}

// 加载更多消息
const loadMoreMessages = async () => {
  if (loading.value.more || !hasMoreMessages.value) return
  
  loading.value.more = true
  
  try {
    // 记录滚动位置
    lastScrollHeight.value = messageListEl.value?.scrollHeight || 0
    lastScrollTop.value = messageListEl.value?.scrollTop || 0
    
    // 使用IM store API加载更多消息
    const result = await imStore.loadMoreMessages(conversationId.value)
    
    if (result) {
      messages.value = result.messages || []
      hasMoreMessages.value = result.hasMore
      
      // 下一个渲染周期后恢复滚动位置
      nextTick(() => {
        if (messageListEl.value) {
          const newScrollHeight = messageListEl.value.scrollHeight
          messageListEl.value.scrollTop = lastScrollTop.value + (newScrollHeight - lastScrollHeight.value)
        }
      })
    }
  } catch (error) {
    console.error('加载更多消息失败', error)
  } finally {
    loading.value.more = false
  }
}

// 获取消息的已读状态
const getMessageReadStatus = async (messageId) => {
  try {
    // 调用API获取消息的已读状态
    const res = await getChatLogReadRecords({ msgId: messageId });
    console.log('获取消息已读状态响应:', res);
    
    if (res.code === 200 && res.data) {
      return res.data.readRecords || {};
    }
    return {};
  } catch (error) {
    console.error('获取消息已读状态失败:', error);
    return {};
  }
}

// 加载会话数据
const loadConversation = async () => {
  // 检查必要条件
  if (!conversationId.value || conversationId.value.includes('undefined')) {
    console.error('会话ID无效，无法加载会话数据:', conversationId.value);
    return;
  }
  
  loading.value.conversation = true;
  try {
    console.log(`正在加载会话数据，ID: ${conversationId.value}, 类型: ${props.conversationType}, 目标ID: ${props.targetId}`);
    
    // 1. 检查/创建会话
    const setupData = {
      sendId: userStore.userInfo?.id?.toString() || '',
      recvId: props.targetId?.toString() || '',
      ChatType: props.conversationType === 'group' ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE
    };
    
    // 确保ChatType字段正确设置，必须使用数字
    if (!setupData.ChatType && setupData.ChatType !== 0) {
      setupData.ChatType = 2; // 默认为单聊(2)
      console.log('没有指定ChatType，使用默认值: 2 (单聊)');
    }
    
    // 确保两个ID都存在
    if (!setupData.sendId || !setupData.recvId) {
      console.error('无法创建会话，缺少用户ID', {
        sendId: setupData.sendId,
        recvId: setupData.recvId
      });
      showToast('创建会话失败：缺少必要参数');
      return;
    }
    
    console.log('创建/检查会话:', setupData);
    try {
      // 尝试创建或获取会话
      const setupRes = await setUpUserConversation(setupData);
      console.log('创建/检查会话响应:', setupRes);
      
      if (setupRes.code !== 200) {
        throw new Error(setupRes.message || '创建会话失败');
      }
    } catch (setupError) {
      console.error('创建会话出错:', setupError);
      // 即使创建失败，也尝试继续加载会话详情
    }
    
    // 2. 获取会话详情
    if (conversationId.value) {
      try {
        const res = await getConversationDetail({ 
          conversationId: conversationId.value 
        });
        console.log('获取会话详情响应:', res);
        
        if (res.code === 200) {
          conversation.value = res.data;
          
          // 3. 获取对方用户资料
          if (props.conversationType === 'private') {
            await loadUserDetail();
          }
          
          // 4. 加载消息历史
          await loadMessages(true);
          
          // 5. 标记为已读
          markAsRead();
        } else if (res.code === 404) {
          console.warn('会话不存在，将创建新会话');
          
          // 会话不存在但用户ID存在，创建会话实体以便聊天
          conversation.value = {
            id: conversationId.value,
            type: props.conversationType || 'private',
            targetId: props.targetId,
            targetName: targetUser.value?.name || `用户${props.targetId}`,
            unreadCount: 0,
            messages: []
          };
          
          // 如果是私聊，确保已加载目标用户信息
          if (props.conversationType === 'private' && !targetUser.value) {
            await loadUserDetail();
          }


          await loadMessages(true);
          markAsRead();
        } else {
          console.error('获取会话详情失败:', res.message);
          showToast('获取会话详情失败: ' + (res.message || '未知错误'));
        }
      } catch (detailError) {
        console.error('获取会话详情出错:', detailError);
        
        // 创建临时会话对象以允许用户开始聊天
        console.log('创建临时会话对象');
        conversation.value = {
          id: conversationId.value,
          type: props.conversationType || 'private',
          targetId: props.targetId,
          targetName: targetUser.value?.name || `用户${props.targetId}`,
          unreadCount: 0,
          messages: []
        };
        
        // 如果是私聊，确保已加载目标用户信息
        if (props.conversationType === 'private' && !targetUser.value) {
          await loadUserDetail();
        }
      }
    } else {
      console.error('conversationId无效，无法获取会话详情');
      showToast('无效的会话ID');
    }
  } catch (error) {
    console.error('加载会话数据出错:', error);
    showToast('加载会话数据失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value.conversation = false;
  }
};

// 验证用户认证状态
const checkAuthStatus = () => {
  // 检查用户是否登录
  if (!userStore.isLoggedIn) {
    console.error('用户未登录，无法进入聊天页面');
    showToast('请先登录');
    router.push('/login');
    return false;
  }
  
  // 检查token是否存在
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('未找到认证令牌，无法连接WebSocket');
    showToast('登录状态已过期，请重新登录');
    userStore.logout();
    router.push('/login');
    return false;
  }
  
  console.log('用户已登录，认证令牌有效');
  return true;
}

// 初始化聊天页面函数
const initializeChatPage = async () => {
  console.log('初始化聊天页面');
  console.log('当前会话ID:', conversationId.value);
  
  // 检查用户认证状态
  if (!checkAuthStatus()) {
    return;
  }
  
  // 检查WebSocket连接
  if (wsClient && !wsClient.isConnected()) {
    console.log('WebSocket未连接，正在连接到:', import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:10090/ws');
    try {
      // 确保localStorage中的token是最新的
      if (userStore.token && userStore.token !== localStorage.getItem('token')) {
        console.log('更新本地存储中的token');
        localStorage.setItem('token', userStore.token);
      }
      
      await wsClient.connect();
      console.log('WebSocket连接成功');
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      showToast('连接服务器失败，请检查网络或服务器状态');
    }
  } else {
    console.log('WebSocket已连接');
  }
  
  // 设置IM store当前会话
  imStore.setCurrentConversation(conversationId.value);
  console.log('已将当前会话设置为:', conversationId.value);
}

// 加载用户详情
const loadUserDetail = async () => {
  try {
    // 检查缓存中是否有此用户数据
    if (userProfiles[props.targetId]) {
      console.log(`使用缓存的用户数据: 用户${props.targetId}`);
      const cachedUser = userProfiles[props.targetId];
      
      targetUser.value = {
        id: props.targetId,
        name: cachedUser.nickname || cachedUser.username || `用户${props.targetId}`,
        avatar: cachedUser.avatar || getDefaultAvatar(props.targetId),
        ...cachedUser
      };
      
      console.log('从缓存获取的用户详情:', targetUser.value);
      return;
    }
    
    // 缓存中没有，请求API获取用户信息
    console.log(`请求用户资料API: /api/user/profile/${props.targetId}`);
    const userResponse = await getUserProfile(props.targetId);
    console.log(`用户${props.targetId}资料响应:`, userResponse);
    
    // 判断响应是否成功
    if (userResponse && (userResponse.code === 200 || userResponse.userId)) {
      // 直接使用响应数据或响应中的data字段
      const userData = userResponse.data || userResponse;
      console.log(`用户${props.targetId}资料数据:`, userData);
      
      targetUser.value = {
        id: props.targetId,
        name: userData.nickname || userData.username || `用户${props.targetId}`,
        avatar: userData.avatar || getDefaultAvatar(props.targetId),
        ...userData
      };
      
      console.log('处理后的用户详情:', targetUser.value);
      
      // 添加到临时缓存
      userProfiles[props.targetId] = userData;
      console.log(`已缓存用户${props.targetId}资料`);
    } else {
      console.warn(`获取用户${props.targetId}资料失败:`, userResponse?.message || '未知错误');
      
      // 使用默认值
      targetUser.value = {
        id: props.targetId,
        name: `用户${props.targetId}`,
        avatar: getDefaultAvatar(props.targetId)
      };
    }
  } catch (error) {
    console.error(`获取用户${props.targetId}信息失败:`, error);
    
    // 发生错误时使用默认值
    targetUser.value = {
      id: props.targetId,
      name: `用户${props.targetId}`,
      avatar: getDefaultAvatar(props.targetId)
    };
  }
};

// 加载消息历史
const loadMessages = async (initial = false) => {
  if (initial) {
    loading.value.messages = true;
  } else if (loading.value.more) {
    return;
  } else {
    loading.value.more = true;
  }
  
  // 确定起始时间
  let startTime = null;
  if (!initial && messages.value.length > 0) {
    startTime = messages.value[0].timestamp;
  }
  
  // 使用/api/im/chatlog接口获取消息历史
  const params = {
    conversationId: conversationId.value,
    count: PAGE_SIZE,
    startSendTime: startTime
  };
  
  console.log('请求聊天历史: /api/im/chatlog', params);
  try {
    const res = await getChatLog(params);
    console.log('聊天历史响应:', res);
    
    // 修改判断条件：直接检查res和res.list是否存在
    if (res && Array.isArray(res.list)) { 
      // 使用res.list访问数据
      const messageList = res.list; 
      console.log(`获取到 ${messageList.length} 条消息记录`, messageList);
      
      // 格式化消息
      const newMessages = messageList.map(msg => {
        const currentUserId = userStore.userInfo.id.toString();
        const isSelf = msg.sendId === currentUserId;
        
        return {
          id: msg.id,
          conversationId: msg.conversationId,
          type: 'text', // 全部设为文本类型
          content: msg.msgContent, // 使用msgContent作为内容
          senderId: msg.sendId,
          receiverId: msg.recvId,
          senderName: isSelf ? userStore.userInfo.nickname || '我' : targetUser.value?.nickname || `用户${msg.sendId}`,
          senderAvatar: isSelf ? userStore.userInfo.avatar || getDefaultAvatar(msg.sendId) : targetUser.value?.avatar || getDefaultAvatar(msg.sendId),
          timestamp: msg.SendTime, // 使用SendTime作为时间戳
          status: 'sent',
          isSelf: isSelf,
          createTime: msg.SendTime // 为时间分隔线提供
        };
      });
      
      console.log('格式化后的消息:', newMessages);
      
      if (initial) {
        // 按时间排序，确保最早的消息在上方
        newMessages.sort((a, b) => a.timestamp - b.timestamp);
        messages.value = newMessages;
      } else {
        // 加载更多时，将新消息添加到列表顶部，并按时间排序
        const combinedMessages = [...newMessages, ...messages.value];
        combinedMessages.sort((a, b) => a.timestamp - b.timestamp);
        messages.value = combinedMessages;
      }
      
      // 使用 messageList.length 判断是否还有更多
      hasMoreMessages.value = messageList.length >= PAGE_SIZE; 
      console.log(`已加载 ${newMessages.length} 条消息, 总消息数: ${messages.value.length}, 是否还有更多: ${hasMoreMessages.value}`);
    } else {
      // 如果res.list不存在或不是数组，视为获取失败或数据为空
      console.error('获取消息历史失败或数据格式不正确:', res);
      showToast('获取聊天记录失败');
      hasMoreMessages.value = false; // 没有获取到有效数据，标记为没有更多
    }
  } catch (error) {
    console.error('加载消息历史出错:', error);
    showToast('加载聊天记录失败:' + error.message);
    hasMoreMessages.value = false; // 出错也标记为没有更多
  } finally {
    if (initial) {
      loading.value.messages = false;
    } else {
      loading.value.more = false;
    }
    
    // 如果是初始加载，滚动到底部
    if (initial) {
      setTimeout(() => {
        scrollToBottom();
      }, 300); // 延迟确保DOM已更新
    } else {
      // 加载更多时，尝试恢复滚动位置
      nextTick(() => {
        if (messageListEl.value) {
          const newScrollHeight = messageListEl.value.scrollHeight;
          messageListEl.value.scrollTop = lastScrollTop.value + (newScrollHeight - lastScrollHeight.value);
          console.log('恢复滚动位置至:', messageListEl.value.scrollTop);
        }
      });
    }
  }
}

// 重试发送消息
const retryMessage = (message) => {
  imStore.resendMessage(message)
}

// 转发消息
const forwardMessage = (message) => {
  // 实现转发逻辑
  console.log('转发消息', message)
  
  // 可以跳转到选择联系人页面
  router.push({
    path: '/im/forward',
    query: {
      messageId: message.id,
      conversationId: conversationId.value
    }
  })
}

// 删除消息
const deleteMessage = (message) => {
  // 从消息列表中删除
  const index = messages.value.findIndex(m => m.id === message.id)
  if (index !== -1) {
    messages.value.splice(index, 1)
  }
}

// 撤回消息
const recallMessage = async (message) => {
  try {
    const result = await recallMessageById(message.id, conversationId.value)
    if (result.code === 200) {
      // 消息已通过WebSocket事件在store中更新
    }
  } catch (error) {
    console.error('撤回消息失败', error)
  }
}

// 查看用户资料
const viewUserProfile = () => {
  if (props.conversationType === 'private') {
    router.push(`/im/user/${props.targetId}`)
  }
}

// 预览图片
const previewImage = (url) => {
  previewImageUrl.value = parseImageContent(url)
  showImagePreview.value = true
}

// 关闭图片预览
const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrl.value = ''
}

// 预览文件
const previewFile = (file) => {
  // 文件预览逻辑
  console.log('预览文件', file)
}

// 查看位置
const viewLocation = (location) => {
  // 查看位置逻辑
  console.log('查看位置', location)
}

// 选择位置
const selectLocation = () => {
  // 实现位置选择逻辑
  console.log('位置选择功能待实现')
}

// 显示聊天选项
const showChatOptions = () => {
  showOptions.value = true
}

// 处理选项点击
const handleOptionClick = async (optionId) => {
  showOptions.value = false
  
  switch (optionId) {
    case 'clear':
      await clearChatHistory()
      break
    case 'profile':
      viewUserProfile()
      break
    case 'members':
      viewGroupMembers()
      break
    case 'leave':
      leaveGroup()
      break
    case 'delete':
      deleteConversation()
      break
  }
}

// 清空聊天记录
const clearChatHistory = async () => {
  try {
    // 调用API清空聊天记录
    await clearMessages(conversationId.value)
    
    // 清空本地消息缓存
    messages.value = []
  } catch (error) {
    console.error('清空聊天记录失败', error)
  }
}

// 添加直接处理WebSocket原始数据的函数，直接绕过store
function directProcessWebsocketMessages() {
  // 保存原始的console.log函数
  const originalConsoleLog = console.log;
  
  // 创建一个包装的console.log函数来拦截内容
  console.log = function(...args) {
    // 调用原始的console.log
    originalConsoleLog.apply(console, args);
    
    // 检查参数是否包含"处理PUSH消息:"
    if (args.length >= 2 && args[0] === '处理PUSH消息:' && args[1]) {
      try {
        const message = args[1];
        
        // 检查消息是否包含必要字段
        if (message && message.conversationId && message.content && message.conversationId === conversationId.value) {
          console.log('直接拦截到PUSH消息，准备显示在UI上:', message);
          
          // 创建一个新的消息对象
          const newMessage = {
            id: message.msgId || `direct_${Date.now()}`,
            conversationId: message.conversationId,
            senderId: message.sendId || '2', // 对方ID，这里用默认值
            content: message.content,
            type: 'text',
            timestamp: message.sendTime || Date.now(),
            status: 'received',
            isSelf: false,
            senderName: targetUser.value?.nickname || targetUser.value?.username || '对方',
            senderAvatar: targetUser.value?.avatar || getDefaultAvatar('2')
          };
          
          // 检查这个消息是否已存在
          if (!messages.value.find(m => m.id === newMessage.id)) {
            // 将消息添加到UI
            messages.value.push(newMessage);
            scrollToBottom(true);
            console.log('成功将拦截的消息添加到UI:', newMessage);
          }
        }
      } catch (error) {
        console.error('直接处理控制台消息时出错:', error);
      }
    }
  };
  
  // 返回一个清理函数
  return () => {
    // 恢复原始console.log
    console.log = originalConsoleLog;
  };
}

// 设置消息监听器
const setupMessageListeners = () => {
  console.log('设置WebSocket消息监听');
  
  // 确保WebSocket已连接
  if (wsClient && !wsClient.isConnected()) {
    console.log('WebSocket未连接，正在连接...');
    wsClient.connect().then(() => {
      console.log('WebSocket连接成功，可以接收消息');
    }).catch(err => {
      console.error('WebSocket连接失败:', err);
    });
  } else {
    console.log('WebSocket已连接，可以接收消息');
  }
  
  // 启用直接处理控制台日志的功能
  const cleanupConsoleIntercept = directProcessWebsocketMessages();
  
  // 注册IM store事件（主要消息处理通道）
  registerWebSocketEvents();
  
  // 添加WebSocket监听器（用于处理专门针对WebSocket的事件）
  const removeListener = wsClient.addListener({
    onStateChange: (state) => {
      console.log('WebSocket状态变更:', state);
      // 如果断开连接，尝试重连
      if (state === 'disconnected' && userStore.isLoggedIn) {
        console.log('WebSocket断开连接，尝试重连...');
        setTimeout(() => {
          if (!wsClient.isConnected() && userStore.isLoggedIn) {
            wsClient.connect();
          }
        }, 3000);
      }
    },
    onMessage: (message) => {
      console.log('Chat.vue收到WebSocket消息:', message);
      
      // 紧急处理 - 直接从原始消息中提取内容并显示
      try {
        let content = null;
        let senderId = null;
        
        // 提取消息内容，尝试所有可能的位置
        if (message.data && message.data.Content) {
          content = message.data.Content;
          senderId = message.formId || '';
        } else if (message.data && message.data.content) {
          content = message.data.content;
          senderId = message.formId || '';
        } else if (message.Content) {
          content = message.Content;
        } else if (message.content) {
          content = message.content;
        }
        
        console.log('提取的消息内容:', content, '发送者ID:', senderId);
        
        // 如果提取到内容，创建消息并显示
        if (content) {
          // 检查会话ID是否匹配当前会话
          let msgConvId = message.data && message.data.ConversationId 
                       ? message.data.ConversationId 
                       : message.conversationId || '';
          
          if (msgConvId === conversationId.value || !msgConvId) {
            console.log('会话ID匹配当前会话，显示消息');
            
            // 判断是否是自己发送的消息
            const isCurrentUser = senderId && userStore.userInfo && userStore.userInfo.id && 
                              userStore.userInfo.id.toString() === senderId;
            
            // 创建新消息对象
            const newMessage = {
              id: (message.data && message.data.MsgId) || `emergency_${Date.now()}`,
              conversationId: msgConvId || conversationId.value,
              senderId: senderId || (message.formId || ''),
              content: content,
              type: 'text',
              timestamp: (message.data && message.data.SendTime) || Date.now(),
              status: 'received',
              isSelf: isCurrentUser,
              senderName: isCurrentUser 
                        ? (userStore.userInfo?.nickname || '我') 
                        : (targetUser.value?.nickname || targetUser.value?.username || `用户${senderId}`),
              senderAvatar: isCurrentUser
                          ? (userStore.userInfo?.avatar || getDefaultAvatar(userStore.userInfo?.id))
                          : (targetUser.value?.avatar || getDefaultAvatar(senderId || 'unknown'))
            };
            
            console.log('创建的紧急消息对象:', newMessage);
            
            // 将消息添加到界面
            if (!messages.value.find(m => m.id === newMessage.id)) {
              messages.value.push(newMessage);
              scrollToBottom(true);
            }
          } else {
            console.log('消息属于其他会话，忽略显示');
          }
        }
      } catch (error) {
        console.error('紧急处理WebSocket消息时出错:', error);
      }
      
      // 处理简化格式的推送消息
      if (message.formId && message.data) {
        console.log('收到简化格式消息:', message.data);
        
        // 提取消息内容
        const content = message.data.Content;
        if (content && message.data.ConversationId === conversationId.value) {
          console.log(`显示消息内容: ${content}`);
          
          // 创建消息对象
          const newMessage = {
            id: message.data.MsgId || `server_${Date.now()}`,
            conversationId: message.data.ConversationId,
            senderId: message.data.SendId || message.formId,
            content: content,
            type: message.data.MType === 0 ? 'text' : 'unknown',
            timestamp: message.data.SendTime || Date.now(),
            status: 'received',
            isSelf: false
          };
          
          // 添加到消息列表
          if (!messages.value.find(m => m.id === newMessage.id)) {
            messages.value.push(newMessage);
            // 滚动到底部
            scrollToBottom(true);
          }
        }
      }
      
      // 处理普通push消息
      if (message.method === 'push' && message.data) {
        console.log('收到push消息:', message.data);
        handleWebSocketPushMessage(message.data);
      }
    },
    onError: (error) => {
      console.error('WebSocket错误:', error);
      showToast('WebSocket连接错误，请检查网络');
    }
  });
  
  // 返回清理函数，将在组件卸载时调用
  return () => {
    if (removeListener) removeListener();
    cleanupConsoleIntercept(); // 清理console拦截
  };
};

// 处理WebSocket推送消息
const handleWebSocketPushMessage = (data) => {
  console.log('WebSocket推送消息 - 处理开始:', data);
  
  try {
    // 1. 从不同可能的位置提取消息内容
    let content = null;
    
    // 如果是嵌套的data结构
    if (data.data && data.data.Content) {
      content = data.data.Content;
    } 
    // 如果是直接的消息结构
    else if (data.content) {
      content = data.content;
    }
    // 如果是console中的对象结构
    else if (data.Content) {
      content = data.Content;
    }
    
    if (!content) {
      console.log('无法从消息中提取内容:', data);
      return;
    }
    
    // 2. 提取会话ID
    let conversationId = null;
    if (data.data && data.data.ConversationId) {
      conversationId = data.data.ConversationId;
    } else if (data.conversationId) {
      conversationId = data.conversationId;
    }
    
    // 3. 提取发送者ID，确定消息方向
    let senderId = null;
    if (data.formId) {
      senderId = data.formId;
    } else if (data.data && data.data.SendId) {
      senderId = data.data.SendId;
    } else if (data.sendId) {
      senderId = data.sendId;
    }
    
    // 4. 生成唯一消息ID
    const msgId = (data.data && data.data.MsgId) || 
                 data.msgId || 
                 `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 5. 获取发送时间
    const sendTime = (data.data && data.data.SendTime) || 
                    data.sendTime || 
                    Date.now();
    
    // 确定是不是自己发的消息
    const isSelf = senderId === userStore.userInfo.id?.toString();
    
    // 创建新消息对象
    const newMessage = {
      id: msgId,
      conversationId: conversationId || '',
      senderId: senderId || '',
      content: content,
      type: 'text',  // 默认为文本类型
      timestamp: sendTime,
      status: 'received',
      isSelf: isSelf,
      senderName: isSelf ? 
                (userStore.userInfo?.nickname || '我') : 
                (targetUser.value?.nickname || targetUser.value?.username || `用户${senderId}`),
      senderAvatar: isSelf ? 
                  (userStore.userInfo?.avatar || getDefaultAvatar(senderId)) : 
                  (targetUser.value?.avatar || getDefaultAvatar(senderId))
    };
    
    console.log('创建的新消息对象:', newMessage);
    
    // 将新消息添加到消息列表
    if (!messages.value.find(m => m.id === newMessage.id)) {
      messages.value.push(newMessage);
      scrollToBottom(true);
    }
  } catch (error) {
    // 记录错误但不中断执行，确保UI不会崩溃
    console.error('处理WebSocket消息时出错:', error);
    
    // 即使出错，也尝试从消息中提取内容并显示
    try {
      let content = null;
      
      if (data.data && data.data.Content) {
        content = data.data.Content;
      } else if (data.content) {
        content = data.content;
      } else if (data.Content) {
        content = data.Content;
      }
      
      if (content) {
        // 创建最简单的消息对象
        const simpleMessage = {
          id: `emergency_${Date.now()}`,
          content: content,
          type: 'text',
          timestamp: Date.now(),
          status: 'received',
          isSelf: false,
          senderName: targetUser.value?.nickname || '对方',
          senderAvatar: targetUser.value?.avatar || getDefaultAvatar('unknown')
        };
        
        // 添加到消息列表
        messages.value.push(simpleMessage);
        scrollToBottom(true);
      }
    } catch (fallbackError) {
      console.error('尝试备用方法处理消息时出错:', fallbackError);
    }
  }
}

// 发送消息
const onMessageSent = async (content, type = 'text') => {
  if (!content || !conversation.value) return
  
  try {
    // 设置发送状态
    loading.value.sending = true
    
    // 生成临时消息ID
    const messageId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // 确定消息类型
    const messageType = type === 'text' ? MESSAGE_TYPE.TEXT : 
                        type === 'image' ? MESSAGE_TYPE.IMAGE : 
                        type === 'file' ? MESSAGE_TYPE.FILE : 
                        type === 'location' ? MESSAGE_TYPE.LOCATION : 
                        MESSAGE_TYPE.TEXT
    
    // 创建新消息对象
    const newMessage = {
      id: messageId,
      conversationId: conversationId.value,
      senderId: userStore.userInfo.id,
      senderName: userStore.userInfo.nickname || userStore.userInfo.username,
      senderAvatar: userStore.userInfo.avatar,
      content: content,
      type: type,
      timestamp: Date.now(),
      status: 'sending',
      isSelf: true
    }
    
    // 添加消息到UI
    messages.value.push(newMessage)
    
    // 滚动到底部
    scrollToBottom(true)
    
    // 确保conversationId有效
    if (!conversationId.value) {
      console.error('conversationId无效，无法发送消息');
      newMessage.status = 'failed';
      showToast('消息发送失败: 无效的会话ID');
      return;
    }
    
    // 确保有目标用户ID
    const recvId = targetUser.value?.id?.toString();
    if (!recvId) {
      console.error('目标用户ID无效，无法发送消息');
      newMessage.status = 'failed';
      showToast('消息发送失败: 无效的接收者ID');
      return;
    }
    
    // 使用IM store的新方法发送消息
    console.log('使用IM store发送消息...');
    // 发送消息并立即视为成功
    imStore.sendChatMessage(
      conversationId.value,
      recvId,
      props.conversationType === 'private' ? CHAT_TYPE.SINGLE : CHAT_TYPE.GROUP,
      messageType,
      content
    );
    
    // 直接更新消息状态为已发送
    const index = messages.value.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages.value[index].status = 'sent';
      
      // 清空输入框（可以通过引用调用ChatInput组件的方法）
      if (chatInputEl.value && typeof chatInputEl.value.clearInput === 'function') {
        chatInputEl.value.clearInput();
      }
      
      // 更新会话最新消息
      if (conversation.value) {
        conversation.value.lastMessage = {
          content: type === 'text' ? content : `[${type}]`,
          timestamp: Date.now()
        };
      }
      
      // 在UI中提供成功发送的视觉反馈 - 设置为"已发送"状态
      setTimeout(() => {
        if (messages.value[index]) {
          messages.value[index].deliveryStatus = 'delivered';
        }
      }, 500);
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    showToast('发送消息出错: ' + (error.message || '未知错误'));
  } finally {
    loading.value.sending = false;
  }
}

// 图片发送事件
const onImageSent = async (file) => {
  if (!file || !conversation.value) return
  
  try {
    loading.value.sending = true
    
    // 上传图片
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await uploadChatImage(formData)
    
    if (response.code === 200) {
      const imageUrl = response.data.url
      
      // 发送图片消息
      onMessageSent(imageUrl, 'image')
    }
  } catch (error) {
    console.error('发送图片失败', error)
  } finally {
    loading.value.sending = false
  }
}

// 文件发送事件
const onFileSent = async (file) => {
  if (!file || !conversation.value) return
  
  try {
    loading.value.sending = true
    
    // 上传文件
    const formData = new FormData()
    formData.append('file', file)
    
    // 调用上传文件API
    const response = await uploadChatFile(formData)
    
    if (response.code === 200) {
      const fileUrl = response.data.url
      const fileName = file.name || '未命名文件'
      const fileSize = file.size
      
      // 构建文件消息内容
      const fileContent = JSON.stringify({
        url: fileUrl,
        name: fileName,
        size: fileSize,
        type: file.type
      })
      
      // 发送文件消息
      onMessageSent(fileContent, 'file')
    } else {
      throw new Error(response.message || '文件上传失败')
    }
  } catch (error) {
    console.error('发送文件失败', error)
    showToast('文件发送失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value.sending = false
  }
}

// 输入框聚焦事件
const onInputFocus = () => {
  // 输入框获得焦点时滚动到底部
  scrollToBottom()
}

// 输入框失焦事件
const onInputBlur = () => {
  // 输入框失去焦点时的处理
}

// 面板变化事件
const onPanelChange = (isVisible) => {
  // 处理面板显示状态变化
  if (isVisible) {
    scrollToBottom()
  }
}

// 处理消息已读状态更新
const handleReadStatusUpdate = (data) => {
  // 只处理当前会话的消息
  if (data.conversationId !== conversationId.value) return;
  
  // 更新消息的已读状态
  const message = messages.value.find(m => m.id === data.messageId);
  if (message) {
    if (!message.readStatus) {
      message.readStatus = {};
    }
    
    // 更新已读记录
    if (data.readRecords) {
      Object.assign(message.readStatus, data.readRecords);
    } else if (data.userId) {
      // 单个用户已读更新
      message.readStatus[data.userId] = data.timestamp || Date.now();
    }
  }
}

// 注册WebSocket事件监听
const registerWebSocketEvents = () => {
  // 监听新消息
  imStore.on('new_message', handleNewMessage)
  
  // 监听消息撤回
  imStore.on('message_recall', handleMessageRecall)
  
  // 监听输入状态
  imStore.on('typing', handleTyping)
  
  // 监听消息已读状态更新
  imStore.on('read_status_update', handleReadStatusUpdate)
}

const unregisterWebSocketEvents = () => {
  imStore.off('new_message', handleNewMessage)
  imStore.off('message_recall', handleMessageRecall)
  imStore.off('typing', handleTyping)
  imStore.off('read_status_update', handleReadStatusUpdate)
}

const handleNewMessage = (message) => {
  // 只处理当前会话的消息
  if (message.conversationId !== conversationId.value) return
  
  // 如果消息不在列表中，添加到列表
  if (!messages.value.find(m => m.id === message.id)) {
    messages.value.push(message)
  }
  
  // 如果没有正在滚动，滚动到底部
  if (!isScrolling.value) {
    scrollToBottom(true)
  }
  
  // 标记为已读
  markConversationRead()
}

const handleMessageRecall = (data) => {
  // 只处理当前会话的消息
  if (data.conversationId !== conversationId.value) return
  
  // 查找并更新消息状态
  const message = messages.value.find(m => m.id === data.messageId)
  if (message) {
    message.isRevoked = true
    message.content = ''
  }
}

const handleTyping = (data) => {
  // 只处理当前会话的输入状态
  if (data.conversationId !== conversationId.value) return
  
  // 更新输入状态
  typingUsers.value = {
    ...typingUsers.value,
    [data.userId]: data.timestamp
  }
  
  updateTypingStatus()
  
  // 设置定时器，3秒后再次检查状态
  if (typingTimer.value) clearTimeout(typingTimer.value)
  typingTimer.value = setTimeout(updateTypingStatus, 3000)
}

// 标记为已读
const markConversationRead = () => {
  if (!conversation.value) return
  imStore.readConversation(conversationId.value)
}

// 更新正在输入状态
const updateTypingStatus = () => {
  if (!typingUsers.value || Object.keys(typingUsers.value).length === 0) {
    isTyping.value = false
    return
  }
  
  // 过滤掉3秒前的输入状态
  const now = Date.now()
  const activeUsers = Object.entries(typingUsers.value)
    .filter(([userId, timestamp]) => now - timestamp < 3000)
    
  if (activeUsers.length === 0) {
    isTyping.value = false
    return
  }
  
  isTyping.value = true
  
  // 获取正在输入的用户名
  // 如果是私聊，始终显示对方的名字
  if (props.conversationType === 'private') {
    typingName.value = targetUser.value?.nickname || '对方'
  } 
  // 如果是群聊，显示第一个正在输入的用户名
  else if (activeUsers.length === 1) {
    const [userId] = activeUsers[0]
    const member = conversation.value?.members?.find(m => m.id === parseInt(userId))
    typingName.value = member?.nickname || '有人'
  } 
  // 如果多人输入，显示数量
  else {
    typingName.value = `${activeUsers.length}人`
  }
}

// 页面方法
const goBack = () => {
  router.back()
}

// 标记消息为已读
const markAsRead = async () => {
  // 如果没有会话，返回
  if (!conversation.value) return;
  
  try {
    // 准备标记已读数据
    const markReadData = {
      conversationId: conversationId.value,
      ChatType: props.conversationType === 'group' ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
      recvId: props.targetId.toString(),
      msgIds: [] // 空数组表示标记所有消息已读
    };
    
    console.log('标记消息已读:', markReadData);
    
    // 调用WebSocket标记已读
    wsClient.sendMessage({
      method: wsActions.CONVERSATION_MARK_CHAT,
      data: markReadData
    }, (response) => {
      console.log('标记已读响应:', response);
      
      // 通知Store更新会话未读计数
      if (!response.error) {
        imStore.markConversationAsRead(conversationId.value);
        
        // 更新本地界面未读计数
        if (conversation.value) {
          conversation.value.unreadCount = 0;
        }
      } else {
        console.error('标记已读失败:', response.error);
      }
    });
    
    // 同时通过HTTP API标记已读（确保服务器状态更新）
    try {
      const result = await markMessagesAsRead(conversationId.value);
      console.log('HTTP标记已读响应:', result);
    } catch (httpError) {
      console.error('HTTP标记已读失败:', httpError);
      // 继续执行，不阻断流程
    }
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};

const viewGroupMembers = () => {
  if (props.conversationType === 'group') {
    router.push(`/im/group/${props.targetId}/members`)
  }
}

const leaveGroup = () => {
  // 离开群组的逻辑
  console.log('离开群组功能待实现')
}

const deleteConversation = () => {
  // 删除会话的逻辑
  imStore.deleteConversation(conversationId.value)
  router.push('/im/conversations')
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    // 重新加载会话
    loadConversation();
  }
})

// 生命周期钩子
onMounted(async () => {
  console.log('Chat组件已挂载');
  
  // 优先使用查询参数中的conversationId
  if (route.query.conversationId) {
    console.log('使用查询参数中的conversationId:', route.query.conversationId);
  }
  
  // 先初始化WebSocket连接
  await initializeChatPage();
  
  // 加载会话数据和聊天历史
  await loadConversation();
  
  // 添加直接加载消息的逻辑
  if (!messages.value || messages.value.length === 0) {
    console.log('页面挂载后开始加载聊天记录');
    loadMessages(true);
  }
  
  // 设置监听器和其他初始化
  const cleanupMessageListeners = setupMessageListeners();
  
  // 添加滚动事件监听器
  if (messageListEl.value) {
    messageListEl.value.addEventListener('scroll', handleScroll);
  }
  
  // 注册IM store事件
  registerWebSocketEvents();
  
  // 设置页面标题
  document.title = targetUser.value?.name || '聊天';
  
  // 组件卸载时的清理
  onBeforeUnmount(() => {
    // 清理定时器和事件监听
    if (scrollDebounceTimer.value) clearTimeout(scrollDebounceTimer.value);
    if (typingTimer.value) clearTimeout(typingTimer.value);
    
    // 移除滚动事件监听
    if (messageListEl.value) {
      messageListEl.value.removeEventListener('scroll', handleScroll);
    }
    
    // 清理WebSocket监听器
    if (cleanupMessageListeners) cleanupMessageListeners();
    
    // 取消注册WebSocket事件
    unregisterWebSocketEvents();
    
    // 重置当前会话
    imStore.setCurrentConversation(null);
  });
});
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--ios-systemBackground);
  position: relative;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  height: 50px;
  background-color: var(--ios-systemBackground);
  border-bottom: 1px solid var(--ios-separator);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn,
.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.back-btn:active,
.more-btn:active {
  opacity: 0.7;
}

.title {
  flex: 1;
  text-align: center;
  margin: 0 10px;
}

.title h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ios-label);
}

.subtitle {
  font-size: 12px;
  color: var(--ios-secondaryLabel);
  margin-top: 2px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 16px;
  position: relative;
}

.loading-more, 
.no-more-messages {
  text-align: center;
  padding: 10px 0;
  font-size: 12px;
  color: var(--ios-tertiaryLabel);
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--ios-tertiarySystemFill);
  border-top-color: var(--ios-tint);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: var(--ios-tertiaryLabel);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.time-divider {
  text-align: center;
  margin: 15px 0;
  font-size: 12px;
  color: var(--ios-tertiaryLabel);
}

.typing-indicator {
  font-size: 12px;
  color: var(--ios-secondaryLabel);
  text-align: center;
  padding: 8px 0;
  font-style: italic;
}

.sending-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--ios-secondaryLabel);
  padding: 8px 0;
  margin-top: 4px;
}

.sending-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--ios-tertiarySystemFill);
  border-top-color: var(--ios-tint);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

.bottom-spacer {
  height: 70px; /* 根据输入框高度调整 */
  width: 100%;
}

.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
}

.preview-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.chat-options {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

.options-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.options-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--ios-systemBackground);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  overflow: hidden;
}

.option-item {
  padding: 16px;
  text-align: center;
  font-size: 16px;
  color: var(--ios-label);
  border-bottom: 1px solid var(--ios-separator);
}

.option-item:last-child {
  margin-bottom: 10px;
  color: var(--ios-destructive);
}

.option-item:active {
  background-color: var(--ios-secondarySystemBackground);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 