<template>
  <div class="chat-session">
    <!-- 标题栏 -->
    <div class="session-header">
      <div class="header-left" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="header-title">
        <div class="user-name">{{ sessionInfo.name }}</div>
        <div class="user-status" v-if="sessionInfo.typing">正在输入...</div>
        <div class="user-status" v-else-if="sessionInfo.online">在线</div>
        <div class="user-status" v-else-if="sessionInfo.lastActive">
          {{ formatLastActive(sessionInfo.lastActive) }}
        </div>
      </div>
      <div class="header-right" @click="showSessionOptions">
        <i class="icon-more-vertical"></i>
      </div>
    </div>
    
    <!-- 消息列表 -->
    <div class="message-container" ref="messageContainer">
      <ChatMessageList
        :messages="messages"
        :currentUserId="currentUserId"
        :currentUserAvatar="currentUserAvatar"
        :hasMore="hasMoreMessages"
        :loading="loadingMessages"
        @load-more="loadMoreMessages"
        @delete-message="deleteMessage"
        @user-click="handleUserClick"
      />
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-actions">
        <i class="icon-image" @click="showImagePicker"></i>
        <i class="icon-paperclip" @click="showFilePicker"></i>
        <i class="icon-emoji" @click="showEmojiPicker"></i>
      </div>
      
      <div class="input-box">
        <textarea
          ref="messageInput"
          v-model="messageContent"
          placeholder="请输入消息..."
          @keydown.enter="sendTextMessage"
          @input="handleInput"
          @focus="scrollToBottom"
        ></textarea>
      </div>
      
      <div class="send-button" @click="sendTextMessage" :class="{ 'active': messageContent.trim() }">
        <i class="icon-send"></i>
      </div>
    </div>
    
    <!-- 图片选择器 -->
    <div class="image-picker" v-if="showingImagePicker">
      <div class="picker-header">
        <span>选择图片</span>
        <i class="icon-close" @click="hideImagePicker"></i>
      </div>
      <div class="picker-content">
        <div class="image-grid">
          <div 
            v-for="(image, index) in recentImages" 
            :key="index" 
            class="image-item"
            @click="selectImage(image)"
          >
            <img :src="image.url" :alt="image.name">
          </div>
          <div class="image-item upload-item" @click="triggerImageUpload">
            <i class="icon-plus"></i>
            <span>上传图片</span>
            <input 
              type="file" 
              ref="imageInput" 
              accept="image/*" 
              style="display: none"
              @change="handleImageUpload"
            >
          </div>
        </div>
      </div>
    </div>
    
    <!-- 表情选择器 -->
    <div class="emoji-picker" v-if="showingEmojiPicker">
      <div class="picker-header">
        <span>选择表情</span>
        <i class="icon-close" @click="hideEmojiPicker"></i>
      </div>
      <div class="picker-content">
        <div class="emoji-grid">
          <div 
            v-for="(emoji, index) in emojis" 
            :key="index" 
            class="emoji-item"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 会话选项 -->
    <div class="session-options" v-if="showingSessionOptions">
      <div class="options-overlay" @click="hideSessionOptions"></div>
      <div class="options-content">
        <div class="option-item" @click="viewUserProfile">
          <i class="icon-user"></i>
          <span>查看个人资料</span>
        </div>
        <div class="option-item" @click="clearHistory">
          <i class="icon-trash"></i>
          <span>清空聊天记录</span>
        </div>
        <div class="option-item danger" @click="blockUser">
          <i class="icon-ban"></i>
          <span>拉黑用户</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import ChatMessageList from '@/components/chat/ChatMessageList.vue';
import { getChatHistory, getChatSessionInfo, sendMessage, deleteChatMessage } from '@/api/chat';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 会话ID
const sessionId = computed(() => route.params.id);

// 当前用户信息
const currentUserId = computed(() => userStore.id);
const currentUserAvatar = computed(() => userStore.avatar);

// 会话信息
const sessionInfo = ref({
  id: '',
  name: '',
  avatar: '',
  online: false,
  lastActive: null,
  typing: false
});

// 消息列表
const messages = ref([]);
const hasMoreMessages = ref(false);
const loadingMessages = ref(false);
const lastMessageTime = ref(null);

// 输入相关
const messageInput = ref(null);
const messageContent = ref('');
const typingTimeout = ref(null);

// UI状态
const messageContainer = ref(null);
const showingImagePicker = ref(false);
const showingEmojiPicker = ref(false);
const showingSessionOptions = ref(false);

// 图片和表情相关
const imageInput = ref(null);
const recentImages = ref([
  { url: '/mock/images/image1.jpg', name: 'Image 1' },
  { url: '/mock/images/image2.jpg', name: 'Image 2' },
  { url: '/mock/images/image3.jpg', name: 'Image 3' }
]);
const emojis = ref(['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳']);

// 加载会话信息
const loadSessionInfo = async () => {
  try {
    const { data } = await getChatSessionInfo(sessionId.value);
    sessionInfo.value = data;
  } catch (error) {
    console.error('加载会话信息失败:', error);
  }
};

// 加载消息
const loadMessages = async (initial = true) => {
  if (loadingMessages.value) return;
  
  loadingMessages.value = true;
  
  try {
    const params = {
      sessionId: sessionId.value,
      limit: 20
    };
    
    if (!initial && lastMessageTime.value) {
      params.before = lastMessageTime.value;
    }
    
    const { data } = await getChatHistory(params);
    
    if (initial) {
      messages.value = data.messages;
    } else {
      messages.value = [...data.messages, ...messages.value];
    }
    
    hasMoreMessages.value = data.hasMore;
    
    if (data.messages.length > 0) {
      lastMessageTime.value = data.messages[0].createTime;
    }
    
    if (initial) {
      scrollToBottom();
    }
  } catch (error) {
    console.error('加载消息失败:', error);
  } finally {
    loadingMessages.value = false;
  }
};

// 加载更多消息
const loadMoreMessages = () => {
  loadMessages(false);
};

// 发送文本消息
const sendTextMessage = async (e) => {
  // 按下Enter键且没有同时按Shift键时发送消息
  if (e.type === 'keydown' && (e.shiftKey || !messageContent.value.trim())) {
    return;
  }
  
  if (e.type === 'keydown') {
    e.preventDefault();
  }
  
  if (!messageContent.value.trim()) return;
  
  const content = messageContent.value;
  messageContent.value = '';
  
  // 添加到本地消息列表，乐观UI更新
  const tempId = Date.now().toString();
  const tempMessage = {
    id: tempId,
    sessionId: sessionId.value,
    senderId: currentUserId.value,
    senderAvatar: currentUserAvatar.value,
    type: 'text',
    content: content,
    createTime: new Date().toISOString(),
    status: 'sending'
  };
  
  messages.value.push(tempMessage);
  scrollToBottom();
  
  try {
    const { data } = await sendMessage({
      sessionId: sessionId.value,
      type: 'text',
      content: content
    });
    
    // 更新临时消息状态
    const index = messages.value.findIndex(m => m.id === tempId);
    if (index !== -1) {
      messages.value[index] = {
        ...data,
        status: 'sent'
      };
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    
    // 更新临时消息状态为失败
    const index = messages.value.findIndex(m => m.id === tempId);
    if (index !== -1) {
      messages.value[index].status = 'failed';
    }
  }
};

// 发送图片消息
const sendImageMessage = async (imageUrl) => {
  try {
    const { data } = await sendMessage({
      sessionId: sessionId.value,
      type: 'image',
      content: imageUrl
    });
    
    messages.value.push({
      ...data,
      status: 'sent'
    });
    
    scrollToBottom();
    hideImagePicker();
  } catch (error) {
    console.error('发送图片失败:', error);
  }
};

// 删除消息
const deleteMessage = async (data) => {
  try {
    await deleteChatMessage(data.itemId);
    
    // 从消息列表中移除
    const index = messages.value.findIndex(m => m.id === data.itemId);
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
  } catch (error) {
    console.error('删除消息失败:', error);
  }
};

// 处理输入变化
const handleInput = () => {
  // 发送正在输入状态
  clearTimeout(typingTimeout.value);
  
  typingTimeout.value = setTimeout(() => {
    // 这里可以调用接口通知对方"用户停止输入"
  }, 1000);
};

// 处理用户点击
const handleUserClick = (userId) => {
  router.push(`/user/profile/${userId}`);
};

// 处理图片上传
const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    sendImageMessage(event.target.result);
  };
  reader.readAsDataURL(file);
};

// 插入表情
const insertEmoji = (emoji) => {
  messageContent.value += emoji;
  messageInput.value.focus();
  hideEmojiPicker();
};

// 选择图片
const selectImage = (image) => {
  sendImageMessage(image.url);
};

// 触发图片上传
const triggerImageUpload = () => {
  imageInput.value.click();
};

// 显示图片选择器
const showImagePicker = () => {
  showingImagePicker.value = true;
  showingEmojiPicker.value = false;
};

// 隐藏图片选择器
const hideImagePicker = () => {
  showingImagePicker.value = false;
};

// 显示表情选择器
const showEmojiPicker = () => {
  showingEmojiPicker.value = true;
  showingImagePicker.value = false;
};

// 隐藏表情选择器
const hideEmojiPicker = () => {
  showingEmojiPicker.value = false;
};

// 显示会话选项
const showSessionOptions = () => {
  showingSessionOptions.value = true;
};

// 隐藏会话选项
const hideSessionOptions = () => {
  showingSessionOptions.value = false;
};

// 查看用户资料
const viewUserProfile = () => {
  router.push(`/user/profile/${sessionInfo.value.userId}`);
  hideSessionOptions();
};

// 清空聊天记录
const clearHistory = () => {
  // 这里应该调用接口清空聊天记录
  messages.value = [];
  hideSessionOptions();
};

// 拉黑用户
const blockUser = () => {
  // 这里应该调用接口拉黑用户
  hideSessionOptions();
  goBack();
};

// 返回上一页
const goBack = () => {
  router.push('/chat');
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

// 格式化最后活跃时间
const formatLastActive = (time) => {
  const date = new Date(time);
  const now = new Date();
  
  // 计算时间差（毫秒）
  const diff = now.getTime() - date.getTime();
  
  // 小于1分钟显示"刚刚活跃"
  if (diff < 60 * 1000) {
    return '刚刚活跃';
  }
  
  // 小于1小时显示"x分钟前活跃"
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前活跃`;
  }
  
  // 小于24小时显示"x小时前活跃"
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前活跃`;
  }
  
  // 显示"x天前活跃"
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前活跃`;
};

// 监听路由变化
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadSessionInfo();
      loadMessages();
    }
  },
  { immediate: true }
);

// 加载数据
onMounted(() => {
  loadSessionInfo();
  loadMessages();
});

// 清理
onBeforeUnmount(() => {
  clearTimeout(typingTimeout.value);
});
</script>

<style scoped>
.chat-session {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background-primary);
}

.session-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--surface);
  border-bottom: 0.5px solid var(--separator-color);
  height: 60px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  padding: var(--spacing-sm);
  margin-right: var(--spacing-sm);
  cursor: pointer;
}

.header-title {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: var(--font-size-md);
  color: var(--text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.header-right {
  padding: var(--spacing-sm);
  cursor: pointer;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--spacing-lg);
  background-color: var(--background-primary);
}

.input-area {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--surface);
  border-top: 0.5px solid var(--separator-color);
  flex-shrink: 0;
}

.input-actions {
  display: flex;
  margin-right: var(--spacing-md);
}

.input-actions i {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin-right: var(--spacing-sm);
  cursor: pointer;
}

.input-box {
  flex: 1;
  background-color: var(--background-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  max-height: 120px;
  overflow-y: auto;
}

.input-box textarea {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  resize: none;
  font-size: var(--font-size-md);
  color: var(--text-primary);
  max-height: 100px;
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--background-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--spacing-md);
  cursor: pointer;
}

.send-button i {
  color: var(--text-tertiary);
  font-size: var(--font-size-md);
}

.send-button.active {
  background-color: var(--primary-color);
}

.send-button.active i {
  color: white;
}

.image-picker,
.emoji-picker {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--surface);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 0.5px solid var(--separator-color);
}

.picker-header span {
  font-weight: 600;
  color: var(--text-primary);
}

.picker-header i {
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  cursor: pointer;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.image-grid,
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.image-item {
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.upload-item i {
  font-size: 24px;
  margin-bottom: var(--spacing-xs);
}

.emoji-grid {
  grid-template-columns: repeat(8, 1fr);
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  padding: var(--spacing-sm);
  cursor: pointer;
}

.session-options {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

.options-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.options-content {
  position: absolute;
  top: 60px;
  right: 16px;
  background-color: var(--surface);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 180px;
  overflow: hidden;
}

.option-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  color: var(--text-primary);
  cursor: pointer;
}

.option-item:hover {
  background-color: var(--background-hover);
}

.option-item i {
  margin-right: var(--spacing-md);
  font-size: var(--font-size-md);
}

.option-item.danger {
  color: var(--red);
}
</style> 