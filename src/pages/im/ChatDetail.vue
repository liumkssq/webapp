<template>
  <div class="chat-detail">
    <!-- 头部导航 -->
    <header-nav :title="chatTitle" :go-back="true">
      <template #right>
        <van-icon name="more-o" size="24px" @click="showUserActions" />
      </template>
    </header-nav>
    
    <!-- 聊天内容区域 -->
    <div class="chat-content" ref="chatContent">
      <div v-if="loading" class="loading-container">
        <van-loading size="24px">加载中...</van-loading>
      </div>
      
      <van-pull-refresh v-else v-model="refreshing" @refresh="loadMoreHistory">
        <van-empty v-if="messages.length === 0" description="暂无消息" image="chat" />
        
        <div v-else class="messages-container">
          <div v-if="hasMore" class="load-more" @click="loadMoreHistory">
            <span v-if="!loadingMore">加载更多历史消息</span>
            <van-loading v-else size="16px">加载中</van-loading>
          </div>
          
          <div v-for="(message, index) in messages" :key="message.id" class="message-wrapper">
            <!-- 日期分割线 -->
            <div v-if="showDateDivider(index)" class="date-divider">
              {{ formatDate(message.timestamp) }}
            </div>
            
            <!-- 消息气泡 -->
            <div 
              class="message-bubble" 
              :class="{ 
                'self': message.senderId === currentUserId,
                'other': message.senderId !== currentUserId
              }"
            >
              <!-- 头像 -->
              <van-image
                v-if="message.senderId !== currentUserId"
                round
                width="40px"
                height="40px"
                :src="targetUserInfo.avatar || getDefaultAvatar(targetUserId)"
                fit="cover"
                class="avatar"
              />
              
              <!-- 消息内容 -->
              <div class="message-content">
                <div
                  class="message-bubble-content"
                  :class="{ 
                    'text': message.type === 'text',
                    'image': message.type === 'image',
                    'file': message.type === 'file',
                    'location': message.type === 'location'
                  }"
                >
                  <!-- 文本消息 -->
                  <span v-if="message.type === 'text'">{{ message.content }}</span>
                  
                  <!-- 图片消息 -->
                  <div v-else-if="message.type === 'image'" class="image-message">
                    <van-image
                      :src="message.content"
                      :width="200"
                      fit="cover"
                      radius="4px"
                      @click="previewImage(message.content)"
                    />
                  </div>
                  
                  <!-- 文件消息 -->
                  <div v-else-if="message.type === 'file'" class="file-message">
                    <van-icon name="description" size="24px" class="file-icon" />
                    <div class="file-info">
                      <div class="file-name">{{ message.fileName || '文件' }}</div>
                      <div class="file-size">{{ formatFileSize(message.fileSize) }}</div>
                    </div>
                  </div>
                  
                  <!-- 位置消息 -->
                  <div v-else-if="message.type === 'location'" class="location-message">
                    <van-icon name="location-o" size="24px" class="location-icon" />
                    <span>{{ message.content }}</span>
                  </div>
                  
                  <!-- 其他类型消息 -->
                  <span v-else>[不支持的消息类型]</span>
                </div>
                
                <!-- 消息状态 -->
                <div class="message-status" v-if="message.senderId === currentUserId">
                  <van-icon v-if="message.status === 'sending'" name="more-o" class="sending" />
                  <van-icon v-else-if="message.status === 'failed'" name="warning-o" class="failed" @click="resendMessage(message)" />
                  <div v-else-if="message.status === 'read'" class="read">已读</div>
                </div>
              </div>
              
              <!-- 发送者头像 (自己) -->
              <van-image
                v-if="message.senderId === currentUserId"
                round
                width="40px"
                height="40px"
                :src="currentUserAvatar"
                fit="cover"
                class="avatar"
              />
            </div>
          </div>
        </div>
      </van-pull-refresh>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-toolbar">
        <van-icon name="smile-o" size="24px" @click="toggleEmoji" />
        <van-icon name="photo-o" size="24px" @click="selectImage" />
        <van-icon name="plus" size="24px" @click="toggleMoreActions" />
      </div>
      
      <div class="input-wrapper">
        <van-field
          v-model="inputMessage"
          placeholder="输入消息..."
          type="textarea"
          autosize
          @keypress.enter.prevent="sendTextMessage"
        />
      </div>
      
      <div class="send-button">
        <van-button round type="primary" size="small" @click="sendTextMessage" :disabled="!inputMessage.trim()">
          发送
        </van-button>
      </div>
    </div>
    
    <!-- 更多操作弹窗 -->
    <van-action-sheet v-model:show="showMore" title="更多功能" :actions="moreActions" cancel-text="取消" @select="handleMoreAction" />
    
    <!-- 用户操作弹窗 -->
    <van-action-sheet v-model:show="showUserMenu" title="聊天信息" :actions="userActions" cancel-text="取消" @select="handleUserAction" />
    
    <!-- 文件选择 input -->
    <input type="file" ref="imageInput" style="display: none" accept="image/*" @change="handleImageSelected" />
  </div>
</template>

<script setup>
import {
  sendImageMessage as apiSendImageMessage,
  sendTextMessage as apiSendTextMessage,
  CHAT_TYPE,
  getChatLog,
  getUserDetail,
  markMessageRead,
  setUpUserConversation,
  uploadChatImage
} from '@/api/im';
import HeaderNav from '@/components/HeaderNav.vue';
import { useUserStore } from '@/store/user';
import { wsClient } from '@/utils/websocket';
import dayjs from 'dayjs';
import { showDialog, showToast } from 'vant';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// 路由信息
const route = useRoute();
const router = useRouter();
const targetUserId = ref(route.params.id);
const conversationId = ref(route.query.conversationId || '');

// 用户信息
const userStore = useUserStore();
const currentUserId = computed(() => userStore.userId);
const currentUserAvatar = computed(() => userStore.userInfo?.avatar || getDefaultAvatar(currentUserId.value));
const targetUserInfo = ref({});
const chatTitle = ref(route.query.name || '聊天');

// 聊天状态
const loading = ref(true);
const refreshing = ref(false);
const loadingMore = ref(false);
const messages = ref([]);
const hasMore = ref(true);
const chatContent = ref(null);
const oldestMessageTime = ref(Number.MAX_SAFE_INTEGER);
const newestMessageTime = ref(0);

// 输入区域
const inputMessage = ref('');
const imageInput = ref(null);

// 弹窗状态
const showMore = ref(false);
const showUserMenu = ref(false);

// 更多操作选项
const moreActions = [
  { name: '发送文件', icon: 'description' },
  { name: '发送位置', icon: 'location-o' }
];

// 用户操作选项
const userActions = [
  { name: '查看资料', icon: 'user-circle-o' },
  { name: '设置备注', icon: 'edit' },
  { name: '清空聊天记录', icon: 'delete-o', color: 'red' }
];

// 通过ID获取默认头像
const getDefaultAvatar = (userId) => {
  return `https://api.dicebear.com/6.x/avataaars/svg?seed=user${userId}`;
};

// 加载用户信息
const loadUserInfo = async () => {
  if (!targetUserId.value) return;
  
  try {
    const response = await getUserDetail(targetUserId.value);
    if (response.code === 200 && response.data) {
      targetUserInfo.value = {
        id: targetUserId.value,
        name: response.data.nickname || response.data.username || `用户${targetUserId.value}`,
        avatar: response.data.avatar || getDefaultAvatar(targetUserId.value)
      };
      
      // 更新聊天标题
      chatTitle.value = targetUserInfo.value.name;
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// 检查或创建会话ID
const ensureConversationId = async () => {
  if (!conversationId.value && currentUserId.value && targetUserId.value) {
    try {
      // 如果没有会话ID，则通过API创建/获取会话
      const response = await setUpUserConversation({
        sendId: currentUserId.value.toString(),
        recvId: targetUserId.value.toString(),
        ChatType: CHAT_TYPE.SINGLE
      });
      
      if (response.code === 200 && response.data) {
        conversationId.value = response.data.conversationId;
        console.log('成功创建/获取会话:', conversationId.value);
      } else {
        showToast('创建会话失败');
        console.error('创建会话失败:', response);
      }
    } catch (error) {
      console.error('创建会话异常:', error);
      showToast('创建会话失败，请稍后重试');
    }
  }
};

// 加载聊天记录
const loadChatMessages = async (isRefresh = false) => {
  if (!conversationId.value || !currentUserId.value) {
    loading.value = false;
    return;
  }
  
  try {
    if (isRefresh) {
      loading.value = true;
    } else {
      loadingMore.value = true;
    }
    
    // 设置查询参数
    const params = {
      conversationId: conversationId.value,
      count: 20
    };
    
    // 如果加载更多，设置结束时间为最早消息的时间
    if (!isRefresh && oldestMessageTime.value < Number.MAX_SAFE_INTEGER) {
      params.endSendTime = oldestMessageTime.value;
    }
    
    const response = await getChatLog(params);
    
    if (response.code !== 200) {
      showToast(response.message || '获取聊天记录失败');
      return;
    }
    
    // 处理消息数据
    const chatLogs = response.data?.chatLogs || [];
    hasMore.value = chatLogs.length >= 20; // 如果返回满20条，则认为有更多
    
    if (chatLogs.length === 0) {
      if (isRefresh) {
        messages.value = [];
      }
      return;
    }
    
    // 转换消息格式
    const newMessages = chatLogs.map(log => ({
      id: log.id || `temp_${Date.now()}_${Math.random()}`,
      senderId: log.sendId,
      receiverId: log.recvId,
      type: log.type || 'text',
      content: log.content,
      timestamp: log.sendTime,
      status: log.status || 'sent',
      ...(log.type === 'file' && { fileName: log.fileName, fileSize: log.fileSize })
    }));
    
    // 更新最早和最新消息时间
    if (newMessages.length > 0) {
      const timestamps = newMessages.map(msg => msg.timestamp);
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      
      if (minTime < oldestMessageTime.value) {
        oldestMessageTime.value = minTime;
      }
      
      if (maxTime > newestMessageTime.value) {
        newestMessageTime.value = maxTime;
      }
    }
    
    // 更新消息列表
    if (isRefresh) {
      messages.value = newMessages;
    } else {
      messages.value = [...newMessages, ...messages.value];
    }
    
    // 标记为已读
    if (messages.value.length > 0 && isRefresh) {
      markMessageRead({ conversationId: conversationId.value })
        .catch(err => console.error('标记消息已读失败:', err));
    }
    
  } catch (error) {
    console.error('加载聊天记录失败:', error);
    showToast('加载聊天记录失败');
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
};

// 加载更多历史记录
const loadMoreHistory = async () => {
  refreshing.value = true;
  await loadChatMessages(false);
};

// 发送文本消息
const sendTextMessage = async () => {
  if (!inputMessage.value.trim() || !conversationId.value) return;
  
  // 创建临时消息对象
  const tempMessage = {
    id: `temp_${Date.now()}`,
    senderId: currentUserId.value,
    receiverId: targetUserId.value,
    type: 'text',
    content: inputMessage.value,
    timestamp: Date.now(),
    status: 'sending'
  };
  
  // 先添加到本地消息列表
  messages.value.push(tempMessage);
  
  // 清空输入框
  const messageToSend = inputMessage.value;
  inputMessage.value = '';
  
  // 滚动到底部
  scrollToBottom();
  
  try {
    // 首先尝试通过WebSocket发送消息
    if (wsClient.isConnected()) {
      wsClient.sendChatMessage({
        conversationId: conversationId.value,
        recvId: targetUserId.value,
        content: messageToSend,
        type: 0, // 文本类型
        msgId: tempMessage.id
      }, (response) => {
        // 处理WebSocket消息发送回调
        if (response && response.error) {
          console.error('WebSocket发送消息失败:', response.error);
          // WebSocket发送失败，回退到HTTP API
          fallbackToHttpSend(tempMessage, messageToSend);
        } else {
          // WebSocket发送成功，更新消息状态
          const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
          if (index !== -1) {
            messages.value[index].status = 'sent';
          }
        }
      });
    } else {
      // WebSocket未连接，直接使用HTTP API
      fallbackToHttpSend(tempMessage, messageToSend);
    }
  } catch (error) {
    console.error('发送消息错误:', error);
    // 更新消息状态为失败
    const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
    if (index !== -1) {
      messages.value[index].status = 'failed';
    }
    showToast('发送消息失败');
  }
};

// 回退到HTTP API发送消息
const fallbackToHttpSend = async (tempMessage, content) => {
  try {
    // 发送消息到服务器（通过HTTP API）
    const response = await apiSendTextMessage({
      conversationId: conversationId.value,
      receiverId: targetUserId.value,
      content: content
    });
    
    if (response.code !== 200) {
      // 更新消息状态为失败
      const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
      if (index !== -1) {
        messages.value[index].status = 'failed';
      }
      showToast(response.message || '发送消息失败');
      return;
    }
    
    // 更新消息ID和状态
    const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
    if (index !== -1) {
      messages.value[index].id = response.data?.messageId || tempMessage.id;
      messages.value[index].status = 'sent';
    }
  } catch (error) {
    console.error('HTTP API发送消息失败:', error);
    // 更新消息状态为失败
    const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
    if (index !== -1) {
      messages.value[index].status = 'failed';
    }
    showToast('发送消息失败');
  }
};

// 选择图片
const selectImage = () => {
  if (imageInput.value) {
    imageInput.value.click();
  }
};

// 处理选择的图片
const handleImageSelected = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // 检查文件类型和大小
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件');
    return;
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB
    showToast('图片大小不能超过10MB');
    return;
  }
  
  // 创建临时消息对象
  const tempMessage = {
    id: `temp_${Date.now()}`,
    senderId: currentUserId.value,
    receiverId: targetUserId.value,
    type: 'image',
    content: URL.createObjectURL(file),
    timestamp: Date.now(),
    status: 'sending'
  };
  
  // 先添加到本地消息列表
  messages.value.push(tempMessage);
  
  // 滚动到底部
  scrollToBottom();
  
  try {
    // 上传图片
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await uploadChatImage(formData);
    
    if (uploadResponse.code !== 200) {
      // 更新消息状态为失败
      const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
      if (index !== -1) {
        messages.value[index].status = 'failed';
      }
      showToast(uploadResponse.message || '上传图片失败');
      return;
    }
    
    const imageUrl = uploadResponse.data?.url;
    
    if (!imageUrl) {
      // 更新消息状态为失败
      const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
      if (index !== -1) {
        messages.value[index].status = 'failed';
      }
      showToast('获取图片链接失败');
      return;
    }
    
    // 发送图片消息
    const sendResponse = await apiSendImageMessage({
      conversationId: conversationId.value,
      receiverId: targetUserId.value,
      imageUrl
    });
    
    if (sendResponse.code !== 200) {
      // 更新消息状态为失败
      const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
      if (index !== -1) {
        messages.value[index].status = 'failed';
      }
      showToast(sendResponse.message || '发送图片消息失败');
      return;
    }
    
    // 更新消息ID、内容和状态
    const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
    if (index !== -1) {
      messages.value[index].id = sendResponse.data?.messageId || tempMessage.id;
      messages.value[index].content = imageUrl;
      messages.value[index].status = 'sent';
    }
    
  } catch (error) {
    console.error('发送图片消息失败:', error);
    
    // 更新消息状态为失败
    const index = messages.value.findIndex(msg => msg.id === tempMessage.id);
    if (index !== -1) {
      messages.value[index].status = 'failed';
    }
    
    showToast('发送图片消息失败');
  } finally {
    // 清空input
    if (imageInput.value) {
      imageInput.value.value = '';
    }
  }
};

// 重发消息
const resendMessage = async (message) => {
  const index = messages.value.findIndex(msg => msg.id === message.id);
  if (index === -1) return;
  
  // 更新状态为发送中
  messages.value[index].status = 'sending';
  
  try {
    let response;
    
    // 根据消息类型调用不同的API
    if (message.type === 'text') {
      response = await apiSendTextMessage({
        conversationId: conversationId.value,
        receiverId: targetUserId.value,
        content: message.content
      });
    } else if (message.type === 'image') {
      response = await apiSendImageMessage({
        conversationId: conversationId.value,
        receiverId: targetUserId.value,
        imageUrl: message.content
      });
    } else {
      showToast('不支持重发此类型消息');
      messages.value[index].status = 'failed';
      return;
    }
    
    if (response.code !== 200) {
      // 更新消息状态为失败
      messages.value[index].status = 'failed';
      showToast(response.message || '重发消息失败');
      return;
    }
    
    // 更新消息ID和状态
    messages.value[index].id = response.data?.messageId || message.id;
    messages.value[index].status = 'sent';
    
  } catch (error) {
    console.error('重发消息失败:', error);
    messages.value[index].status = 'failed';
    showToast('重发消息失败');
  }
};

// 预览图片
const previewImage = (url) => {
  if (!url) return;
  
  // 使用vant的ImagePreview组件预览图片
  // 这里仅为示例，需要在template中引入ImagePreview组件
  // ImagePreview([url]);
};

// 切换表情选择器
const toggleEmoji = () => {
  // 实现表情选择器
  showToast('表情功能暂未实现');
};

// 切换更多功能
const toggleMoreActions = () => {
  showMore.value = true;
};

// 显示用户操作菜单
const showUserActions = () => {
  showUserMenu.value = true;
};

// 处理更多功能
const handleMoreAction = (action) => {
  switch (action.name) {
    case '发送文件':
      showToast('文件发送功能暂未实现');
      break;
    case '发送位置':
      showToast('位置发送功能暂未实现');
      break;
    default:
      break;
  }
};

// 处理用户操作
const handleUserAction = (action) => {
  switch (action.name) {
    case '查看资料':
      router.push(`/user/profile/${targetUserId.value}`);
      break;
    case '设置备注':
      showToast('设置备注功能暂未实现');
      break;
    case '清空聊天记录':
      showDialog({
        title: '确认清空',
        message: '确定要清空与该用户的所有聊天记录吗？',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        showCancelButton: true
      }).then(() => {
        showToast('聊天记录清空功能暂未实现');
      }).catch(() => {
        // 取消操作
      });
      break;
    default:
      break;
  }
};

// 处理接收到新消息
const handleNewMessage = (message) => {
  // 检查消息是否是聊天消息
  if (message.method !== 'push' || !message.data) return;
  
  const data = message.data;
  
  // 检查是否与当前会话相关
  if (data.conversationId !== conversationId.value) return;
  
  console.log('收到新聊天消息:', data);
  
  // 转换消息格式
  const newMessage = {
    id: data.msgId || `server_${Date.now()}`,
    senderId: data.sendId,
    receiverId: data.recvId,
    type: data.mType === 0 ? 'text' : 
          data.mType === 1 ? 'image' : 
          data.mType === 2 ? 'voice' : 
          data.mType === 3 ? 'video' :
          data.mType === 4 ? 'location' :
          data.mType === 5 ? 'file' : 'unknown',
    content: data.content,
    timestamp: data.sendTime || Date.now(),
    status: 'sent'
  };
  
  // 添加到消息列表，避免重复消息
  if (!messages.value.some(msg => msg.id === newMessage.id)) {
    messages.value.push(newMessage);
    
    // 更新最新消息时间
    if (newMessage.timestamp > newestMessageTime.value) {
      newestMessageTime.value = newMessage.timestamp;
    }
    
    // 如果是别人发的消息，标记为已读
    if (newMessage.senderId !== currentUserId.value) {
      markMessageRead({ conversationId: conversationId.value })
        .catch(err => console.error('标记消息已读失败:', err));
    }
    
    // 滚动到底部
    scrollToBottom();
  }
};

// 建立WebSocket连接
const setupWebSocketListener = () => {
  // 确保WebSocket已连接
  if (!wsClient.isConnected() && userStore.isLoggedIn) {
    wsClient.connect();
  }
  
  // 设置WebSocket消息处理函数
  return wsClient.addListener({
    onMessage: (message) => {
      handleNewMessage(message);
    },
    onStateChange: (state) => {
      console.log('WebSocket连接状态变化:', state);
    },
    onError: (error) => {
      console.error('WebSocket错误:', error);
    }
  });
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight;
    }
  });
};

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size) return '未知大小';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let fileSize = size;
  let unitIndex = 0;
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }
  
  return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
};

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  
  const messageDate = dayjs(timestamp);
  const now = dayjs();
  
  if (messageDate.isSame(now, 'day')) {
    return '今天';
  } else if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天';
  } else if (messageDate.isSame(now, 'year')) {
    return messageDate.format('M月D日');
  } else {
    return messageDate.format('YYYY年M月D日');
  }
};

// 是否显示日期分割线
const showDateDivider = (index) => {
  if (index === 0) return true;
  
  const currentMsg = messages.value[index];
  const prevMsg = messages.value[index - 1];
  
  if (!currentMsg || !prevMsg) return false;
  
  const currentDate = dayjs(currentMsg.timestamp).startOf('day');
  const prevDate = dayjs(prevMsg.timestamp).startOf('day');
  
  return !currentDate.isSame(prevDate);
};

// 监听消息列表变化，滚动到底部
watch(messages, () => {
  if (loading.value || loadingMore.value || refreshing.value) return;
  scrollToBottom();
}, { immediate: true });

// 组件挂载时
onMounted(async () => {
  // 确保有会话ID
  await ensureConversationId();
  
  // 加载用户信息
  await loadUserInfo();
  
  // 加载聊天记录
  await loadChatMessages(true);
  
  // 设置WebSocket监听
  const removeListener = setupWebSocketListener();
  
  // 初始滚动到底部
  scrollToBottom();
  
  // 组件卸载时清理WebSocket监听器
  onUnmounted(() => {
    if (removeListener) removeListener();
  });
});

// 组件卸载时
onUnmounted(() => {
  // 移除WebSocket消息处理函数
  wsClient.removeListener({
    onMessage: handleNewMessage
  });
});
</script>

<style scoped>
.chat-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f7f7;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  padding-bottom: 70px; /* 为输入框留出空间 */
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.load-more {
  text-align: center;
  color: #999;
  padding: 10px 0;
  font-size: 14px;
}

.date-divider {
  text-align: center;
  margin: 10px 0;
  color: #999;
  font-size: 12px;
}

.message-wrapper {
  margin-bottom: 10px;
}

.message-bubble {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
}

.message-bubble.self {
  flex-direction: row-reverse;
}

.avatar {
  margin: 0 8px;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message-bubble.self .message-content {
  align-items: flex-end;
}

.message-bubble-content {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  word-break: break-word;
}

.message-bubble.other .message-bubble-content {
  background-color: #fff;
  border-top-left-radius: 0;
}

.message-bubble.self .message-bubble-content {
  background-color: #10aeff;
  color: #fff;
  border-top-right-radius: 0;
}

.message-bubble-content.image {
  padding: 4px;
  background: transparent;
}

.message-status {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.sending {
  color: #ccc;
}

.failed {
  color: #ee0a24;
}

.read {
  color: #999;
}

.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #fff;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.input-toolbar {
  display: flex;
  align-items: center;
}

.input-toolbar .van-icon {
  margin-right: 12px;
  color: #666;
}

.input-wrapper {
  flex: 1;
  margin: 0 8px;
}

.send-button {
  margin-left: 8px;
}

.image-message img {
  max-width: 100%;
  border-radius: 4px;
}

.file-message {
  display: flex;
  align-items: center;
}

.file-icon {
  margin-right: 8px;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.location-message {
  display: flex;
  align-items: center;
}

.location-icon {
  margin-right: 8px;
}
</style> 