<template>
  <div class="chat-container">
    <!-- 聊天头部 -->
    <van-nav-bar
      class="chat-header"
      left-arrow
      :title="chatTitle"
      @click-left="handleBack"
    >
      <template #right>
        <van-popover
          v-model:show="showOptions"
          theme="dark"
          trigger="click"
          placement="bottom-end"
        >
          <van-cell-group>
            <van-cell title="清除聊天记录" @click="showClearConfirm = true" />
          </van-cell-group>
        </van-popover>
        <van-icon name="ellipsis" @click="showOptions = true" />
      </template>
    </van-nav-bar>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef">
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" color="#1989fa" />
      </div>
      
      <template v-else>
        <div v-if="hasMoreMessages" class="load-more" @click="loadMoreMessages">
          <span>加载更多</span>
        </div>

        <div v-if="messages.length === 0" class="empty-messages">
          <van-empty description="暂无消息" />
        </div>

        <template v-else>
          <div 
            v-for="(message, index) in messages" 
            :key="message.id" 
            class="message-item"
            :class="{ 'self-message': message.isSelf }"
          >
            <!-- 时间分割线 -->
            <div 
              v-if="shouldShowTimestamp(message, index)"
              class="timestamp"
            >
              {{ formatTimestamp(message.timestamp) }}
            </div>

            <!-- 消息气泡 -->
            <div class="message-content" :class="{ 'self-message': message.isSelf }">
              <div 
                v-if="!message.isSelf" 
                class="avatar"
              >
                <van-image 
                  round 
                  width="40" 
                  height="40" 
                  :src="getAvatarUrl(message.senderId)" 
                  fit="cover"
                />
              </div>

              <div class="bubble" :class="{ 'self-bubble': message.isSelf }">
                <!-- 已撤回消息 -->
                <template v-if="message.recalled || message.type === 'recall'">
                  <div class="recall-message">
                    <van-icon name="info-o" />
                    <span>消息已撤回</span>
                  </div>
                </template>

                <!-- 文本消息 -->
                <template v-else-if="message.type === 'text'">
                  <div class="text-message">{{ message.content }}</div>
                </template>

                <!-- 图片消息 -->
                <template v-else-if="message.type === 'image'">
                  <div class="image-message">
                    <van-image 
                      :src="message.content" 
                      @click="previewImage(message.content)"
                      fit="cover"
                      width="200"
                      radius="8"
                      :error="require('@/assets/img/image-error.png')"
                    />
                  </div>
                </template>

                <!-- 其他类型消息 -->
                <template v-else>
                  <div class="unsupported-message">不支持的消息类型</div>
                </template>
              </div>

              <div 
                v-if="message.isSelf" 
                class="avatar"
              >
                <van-image 
                  round 
                  width="40" 
                  height="40" 
                  :src="getAvatarUrl(message.senderId)" 
                  fit="cover"
                />
              </div>
            </div>

            <!-- 发送状态 -->
            <div v-if="message.isSelf" class="message-status">
              <van-icon v-if="message.status === 'sending'" name="success-o" class="status-icon sending" />
              <van-icon v-else-if="message.status === 'sent'" name="success" class="status-icon sent" />
              <van-icon v-else-if="message.status === 'failed'" name="warning-o" class="status-icon failed" @click="resendMessage(message)" />
            </div>
          </div>
        </template>
      </template>
    </div>
    
    <!-- 底部输入区域 -->
    <div class="input-container">
      <van-field
        v-model="messageText"
        rows="1"
        autosize
        type="textarea"
        placeholder="请输入消息"
        @keypress.enter.prevent="sendMessage"
      >
        <template #button>
          <van-button size="small" type="primary" :disabled="!messageText.trim()" @click="sendMessage">
            发送
          </van-button>
        </template>
        <template #left-icon>
          <van-icon name="photo-o" class="input-icon" @click="showImageSelector" />
        </template>
      </van-field>
    </div>

    <!-- 清除聊天记录确认弹窗 -->
    <van-dialog
      v-model:show="showClearConfirm"
      title="清除聊天记录"
      message="确定要清除所有聊天记录吗？此操作不可恢复。"
      show-cancel-button
      @confirm="clearChatHistory"
    />

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showImagePreview"
      :images="previewImages"
      :start-position="previewIndex"
      :show-index="false"
      :close-on-popstate="true"
    />
  </div>
</template>

<script setup>
import defaultAvatar from '@/assets/img/default-avatar.png'
import { useIMStore } from '@/store/im'
import { useUserStore } from '@/store/user'
import { formatTime } from '@/utils/format'
import { wsClient } from '@/utils/websocket'
import { storeToRefs } from 'pinia'
import { showToast } from 'vant'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 获取路由参数
const route = useRoute()
const router = useRouter()

// 获取IM Store和用户Store
const imStore = useIMStore()
const userStore = useUserStore()

// 从Store中获取响应式状态
const { messageCache, connectionState } = storeToRefs(imStore)

// 定义组件状态
const conversationId = ref('')
const targetUserId = ref('')
const chatType = ref(2) // 默认单聊
const messageText = ref('')
const loading = ref(false)
const hasMoreMessages = ref(true)
const showOptions = ref(false)
const showClearConfirm = ref(false)
const showImagePreview = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)
const messageListRef = ref(null)

// 计算属性
const chatTitle = computed(() => {
  const conversation = imStore.getConversationById(conversationId.value)
  return conversation?.title || '聊天'
})

const messages = computed(() => {
  return imStore.getMessagesByConversationId(conversationId.value) || []
})

// 初始化聊天会话
const initChat = async () => {
  // 从路由获取会话ID
  conversationId.value = route.params.id
  
  if (!conversationId.value) {
    showToast('无效的会话ID')
    router.back()
    return
  }
  
  // 获取会话中的目标用户
  const conversation = imStore.getConversationById(conversationId.value)
  if (conversation) {
    targetUserId.value = conversation.targetId
    chatType.value = conversation.chatType || 2
  } else {
    // 如果会话不存在，尝试获取会话列表
    const result = await imStore.fetchConversations()
    if (!result.success) {
      showToast('获取会话信息失败')
      router.back()
      return
    }
    
    // 重新获取会话信息
    const updatedConversation = imStore.getConversationById(conversationId.value)
    if (updatedConversation) {
      targetUserId.value = updatedConversation.targetId
      chatType.value = updatedConversation.chatType || 2
    } else {
      showToast('会话不存在')
      router.back()
      return
    }
  }
  
  // 标记会话为已读
  imStore.markConversationAsRead(conversationId.value)
  
  // 加载消息
  await fetchMessages()
  
  // 设置当前活跃会话
  imStore.setCurrentConversation(conversationId.value)
  
  // 检查WebSocket连接状态
  if (connectionState.value !== 'connected' && wsClient) {
    wsClient.connect()
  }
}

// 加载历史消息
const fetchMessages = async () => {
  loading.value = true
  
  try {
    const result = await imStore.loadMoreMessages(conversationId.value)
    
    if (result.success) {
      hasMoreMessages.value = result.hasMore
      
      // 滚动到底部
      await nextTick()
      scrollToBottom()
    } else {
      showToast('获取聊天记录失败: ' + result.error)
    }
  } catch (error) {
    console.error('获取聊天记录失败:', error)
    showToast('获取聊天记录失败')
  } finally {
    loading.value = false
  }
}

// 加载更多消息
const loadMoreMessages = async () => {
  if (loading.value || !hasMoreMessages.value) return
  
  loading.value = true
  
  try {
    // 获取当前显示的第一条消息的时间作为结束时间
    let endTime = null
    if (messages.value.length > 0) {
      endTime = messages.value[0].timestamp
    }
    
    const result = await imStore.loadMoreMessages(conversationId.value, {
      endTime,
      count: 20
    })
    
    if (result.success) {
      hasMoreMessages.value = result.hasMore
    } else {
      showToast('加载更多消息失败: ' + result.error)
    }
  } catch (error) {
    console.error('加载更多消息失败:', error)
    showToast('加载更多消息失败')
  } finally {
    loading.value = false
  }
}

// 发送消息
const sendMessage = async () => {
  const content = messageText.value.trim()
  if (!content) return
  
  // 清空输入框
  messageText.value = ''
  
  try {
    const currentUserId = userStore.userInfo.id
    
    const result = await imStore.sendMessageToConversation({
      conversationId: conversationId.value,
      senderId: currentUserId,
      receiverId: targetUserId.value,
      content,
      type: 'text'
    })
    
    if (!result.success) {
      showToast('发送失败: ' + result.error)
    }
    
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
    showToast('发送消息失败')
  }
}

// 显示图片选择器
const showImageSelector = () => {
  showToast('图片发送功能开发中')
  // TODO: 实现图片选择和发送功能
}

// 重发消息
const resendMessage = async (message) => {
  const result = await imStore.resendMessage(message)
  
  if (!result.success) {
    showToast('重发失败: ' + result.error)
  }
}

// 获取头像URL
const getAvatarUrl = (userId) => {
  // TODO: 从用户信息中获取头像
  return defaultAvatar
}

// 预览图片
const previewImage = (imageUrl) => {
  previewImages.value = [imageUrl]
  previewIndex.value = 0
  showImagePreview.value = true
}

// 判断是否显示时间戳
const shouldShowTimestamp = (message, index) => {
  if (index === 0) return true
  
  const prevMsg = messages.value[index - 1]
  const currentTime = new Date(message.timestamp)
  const prevTime = new Date(prevMsg.timestamp)
  
  // 如果两条消息相隔超过5分钟，显示时间戳
  return currentTime.getTime() - prevTime.getTime() > 5 * 60 * 1000
}

// 格式化时间戳
const formatTimestamp = (timestamp) => {
  return formatTime(timestamp)
}

// 清除聊天记录
const clearChatHistory = () => {
  // 修改为使用Pinia Store方法来清空消息缓存
  imStore.updateMessageCache(conversationId.value, [])
  showOptions.value = false
}

// 返回上一页
const handleBack = () => {
  router.back()
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 监听新消息事件
const handleNewMessage = (message) => {
  if (message.conversationId === conversationId.value) {
    // 新消息属于当前会话，滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
    
    // 标记为已读
    imStore.markConversationAsRead(conversationId.value)
  }
}

// 监听WebSocket消息
const setupWebSocketListeners = () => {
  // 监听新消息
  imStore.on('new_message', handleNewMessage)
}

// 移除WebSocket监听器
const removeWebSocketListeners = () => {
  imStore.off('new_message', handleNewMessage)
}

// 组件生命周期
onMounted(() => {
  initChat()
  setupWebSocketListeners()
})

onBeforeUnmount(() => {
  // 离开时移除当前活跃会话
  imStore.setCurrentConversation(null)
  removeWebSocketListeners()
})

// 监听路由变化，重新初始化聊天
watch(
  () => route.params.id,
  (newId) => {
    if (newId && newId !== conversationId.value) {
      initChat()
    }
  }
)
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.chat-header {
  flex-shrink: 0;
  background-color: #fff;
  border-bottom: 1px solid #ebedf0;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.load-more {
  text-align: center;
  color: #969799;
  font-size: 14px;
  padding: 10px 0;
  cursor: pointer;
}

.empty-messages {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.message-item {
  margin-bottom: 16px;
}

.timestamp {
  text-align: center;
  font-size: 12px;
  color: #969799;
  margin: 8px 0;
}

.message-content {
  display: flex;
  align-items: flex-start;
}

.self-message .message-content {
  flex-direction: row-reverse;
}

.avatar {
  margin: 0 8px;
}

.bubble {
  max-width: 70%;
  border-radius: 12px;
  padding: 12px;
  background-color: #fff;
  word-break: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.self-bubble {
  background-color: #007aff;
  color: #fff;
}

.recall-message {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.recall-message .van-icon {
  margin-right: 4px;
}

.text-message {
  font-size: 16px;
  line-height: 1.4;
}

.image-message {
  display: flex;
  justify-content: center;
}

.unsupported-message {
  color: #909399;
  font-size: 14px;
}

.message-status {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.status-icon {
  font-size: 16px;
}

.sending {
  color: #909399;
}

.sent {
  color: #67c23a;
}

.failed {
  color: #f56c6c;
  cursor: pointer;
}

.input-container {
  background-color: #fff;
  border-top: 1px solid #ebedf0;
  padding: 8px;
}

.input-icon {
  font-size: 24px;
  margin-right: 8px;
  color: #969799;
  cursor: pointer;
}
</style> 