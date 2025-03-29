<template>
  <div class="conversation-detail">
    <!-- 导航栏 -->
    <van-nav-bar
      :title="targetUserName"
      left-arrow
      fixed
      placeholder
      @click-left="onClickLeft"
      @click-right="showActions = true"
    >
      <template #right>
        <van-icon name="ellipsis" size="18" />
      </template>
    </van-nav-bar>
    
    <!-- 消息列表 -->
    <message-list
      ref="messageListRef"
      class="message-list"
      :messages="messages"
      :current-user-id="currentUserId"
      :loading="loading"
      :has-more="hasMore"
      @load-earlier="loadEarlierMessages"
      @retry="retryMessage"
      @delete="showDeleteConfirm"
    />
    
    <!-- 输入框 -->
    <chat-input
      :loading-image="loadingImage"
      :loading-voice="loadingVoice"
      @send-text="sendTextMessage"
      @send-image="sendImageMessage"
      @send-voice="sendVoiceMessage"
      @send-location="sendLocationMessage"
    />
    
    <!-- 操作菜单 -->
    <van-action-sheet
      v-model:show="showActions"
      :actions="actions"
      cancel-text="取消"
      close-on-click-action
      @select="onSelectAction"
    />
    
    <!-- 确认删除消息 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除消息"
      message="确定要删除这条消息吗？"
      show-cancel-button
      @confirm="confirmDeleteMessage"
    />
    
    <!-- 确认清空会话 -->
    <van-dialog
      v-model:show="showClearDialog"
      title="清空聊天记录"
      message="确定清空所有聊天记录吗？此操作不可撤销。"
      show-cancel-button
      @confirm="confirmClearMessages"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useIntervalFn } from '@vueuse/core'
import MessageList from '@/components/im/MessageList.vue'
import ChatInput from '@/components/im/ChatInput.vue'
import {
  getConversationDetail,
  getMessageHistory,
  sendTextMessage as apiSendText,
  sendImageMessage as apiSendImage,
  sendVoiceMessage as apiSendVoice,
  markAsRead,
  deleteMessage as apiDeleteMessage,
  clearMessages as apiClearMessages
} from '@/api/im'

const route = useRoute()
const router = useRouter()
const conversationId = computed(() => Number(route.params.id))
const targetUserName = computed(() => route.query.name || '会话')
const currentUserId = 1 // 假设当前用户ID为1

// 状态
const loading = ref(false)
const loadingImage = ref(false)
const loadingVoice = ref(false)
const hasMore = ref(true)
const page = ref(1)
const messages = ref([])
const conversation = ref(null)
const messageListRef = ref(null)
const messageToDelete = ref(null)
const showActions = ref(false)
const showDeleteDialog = ref(false)
const showClearDialog = ref(false)

// 操作菜单配置
const actions = [
  { name: '清空聊天记录', color: '#ff3b30' }
]

// 导航返回
const onClickLeft = () => {
  router.back()
}

// 加载会话详情
const fetchConversation = async () => {
  loading.value = true
  try {
    const response = await getConversationDetail(conversationId.value)
    if (response.code === 200) {
      conversation.value = response.data
      
      // 标记消息为已读
      await markAsRead(conversationId.value)
    } else {
      showToast(response.message || '获取会话失败')
    }
  } catch (error) {
    console.error('获取会话失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载消息历史
const fetchMessages = async (isLoadMore = false) => {
  if (loading.value) return
  
  loading.value = true
  try {
    const response = await getMessageHistory(conversationId.value, {
      page: page.value,
      limit: 20
    })
    
    if (response.code === 200) {
      const { list, hasMore: more } = response.data
      
      if (isLoadMore) {
        // 合并消息，避免重复
        const messageIds = new Set(messages.value.map(m => m.id))
        const newMessages = list.filter(m => !messageIds.has(m.id))
        messages.value = [...newMessages, ...messages.value]
      } else {
        messages.value = list
      }
      
      hasMore.value = more
      
      // 消息已加载，标记为已读
      await markAsRead(conversationId.value)
    } else {
      showToast(response.message || '获取消息失败')
    }
  } catch (error) {
    console.error('获取消息失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载更早的消息
const loadEarlierMessages = () => {
  if (loading.value || !hasMore.value) return
  
  page.value++
  fetchMessages(true)
}

// 发送文本消息
const sendTextMessage = async (content) => {
  try {
    // 先添加一条本地消息
    const tempId = `temp_${Date.now()}`
    const tempMessage = {
      id: tempId,
      conversationId: conversationId.value,
      senderId: currentUserId,
      receiverId: conversation.value?.targetUser.id,
      type: 'text',
      content,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isRead: false,
      status: 'sending'
    }
    
    messages.value = [...messages.value, tempMessage]
    
    // 滚动到底部
    nextTick(() => {
      messageListRef.value?.scrollToBottom()
    })
    
    // 发送消息
    const response = await apiSendText(conversationId.value, content)
    
    if (response.code === 200) {
      // 用服务器返回的消息替换临时消息
      const index = messages.value.findIndex(m => m.id === tempId)
      if (index !== -1) {
        messages.value.splice(index, 1, response.data)
      }
    } else {
      // 更新临时消息状态为失败
      const index = messages.value.findIndex(m => m.id === tempId)
      if (index !== -1) {
        messages.value[index].status = 'failed'
      }
      
      showToast(response.message || '发送失败')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

// 发送图片消息
const sendImageMessage = async (file) => {
  loadingImage.value = true
  try {
    // 先添加一条本地消息
    const tempId = `temp_${Date.now()}`
    const tempUrl = URL.createObjectURL(file)
    
    const tempMessage = {
      id: tempId,
      conversationId: conversationId.value,
      senderId: currentUserId,
      receiverId: conversation.value?.targetUser.id,
      type: 'image',
      content: tempUrl,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isRead: false,
      status: 'sending'
    }
    
    messages.value = [...messages.value, tempMessage]
    
    // 滚动到底部
    nextTick(() => {
      messageListRef.value?.scrollToBottom()
    })
    
    // 发送图片
    const response = await apiSendImage(conversationId.value, file)
    
    if (response.code === 200) {
      // 用服务器返回的消息替换临时消息
      const index = messages.value.findIndex(m => m.id === tempId)
      if (index !== -1) {
        messages.value.splice(index, 1, response.data)
      }
    } else {
      // 更新临时消息状态为失败
      const index = messages.value.findIndex(m => m.id === tempId)
      if (index !== -1) {
        messages.value[index].status = 'failed'
      }
      
      showToast(response.message || '发送失败')
    }
  } catch (error) {
    console.error('发送图片失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    loadingImage.value = false
  }
}

// 发送语音消息
const sendVoiceMessage = async (voiceData) => {
  loadingVoice.value = true
  try {
    // 此处应该处理实际的语音文件
    const { duration, file } = voiceData
    
    // 模拟语音发送
    const tempId = `temp_${Date.now()}`
    const tempMessage = {
      id: tempId,
      conversationId: conversationId.value,
      senderId: currentUserId,
      receiverId: conversation.value?.targetUser.id,
      type: 'voice',
      content: 'https://example.com/audio/temp.mp3',
      duration,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isRead: false,
      status: 'sending'
    }
    
    messages.value = [...messages.value, tempMessage]
    
    // 滚动到底部
    nextTick(() => {
      messageListRef.value?.scrollToBottom()
    })
    
    // 模拟API延迟
    setTimeout(() => {
      // 更新为成功状态
      const index = messages.value.findIndex(m => m.id === tempId)
      if (index !== -1) {
        messages.value[index].status = 'sent'
      }
      
      loadingVoice.value = false
    }, 1000)
  } catch (error) {
    console.error('发送语音失败:', error)
    showToast('发送语音失败，请重试')
    loadingVoice.value = false
  }
}

// 发送位置消息
const sendLocationMessage = () => {
  showToast('位置分享功能开发中')
}

// 重试发送消息
const retryMessage = (message) => {
  if (message.type === 'text') {
    sendTextMessage(message.content)
  } else if (message.type === 'image') {
    // 重试需要原始文件，这里只是示例
    showToast('请重新选择图片')
  } else if (message.type === 'voice') {
    // 重试需要原始录音，这里只是示例
    showToast('请重新录制语音')
  }
  
  // 移除失败的消息
  const index = messages.value.findIndex(m => m.id === message.id)
  if (index !== -1) {
    messages.value.splice(index, 1)
  }
}

// 显示删除确认弹窗
const showDeleteConfirm = (message) => {
  messageToDelete.value = message
  showDeleteDialog.value = true
}

// 确认删除消息
const confirmDeleteMessage = async () => {
  if (!messageToDelete.value) return
  
  const loadingToast = showLoadingToast({
    message: '删除中...',
    forbidClick: true
  })
  
  try {
    const response = await apiDeleteMessage(
      conversationId.value,
      messageToDelete.value.id
    )
    
    if (response.code === 200) {
      // 从本地删除消息
      const index = messages.value.findIndex(m => m.id === messageToDelete.value.id)
      if (index !== -1) {
        messages.value.splice(index, 1)
      }
      
      showToast('删除成功')
    } else {
      showToast(response.message || '删除失败')
    }
  } catch (error) {
    console.error('删除消息失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    closeToast(loadingToast)
    messageToDelete.value = null
  }
}

// 选择操作
const onSelectAction = (action) => {
  if (action.name === '清空聊天记录') {
    showClearDialog.value = true
  }
}

// 确认清空消息
const confirmClearMessages = async () => {
  const loadingToast = showLoadingToast({
    message: '清空中...',
    forbidClick: true
  })
  
  try {
    const response = await apiClearMessages(conversationId.value)
    
    if (response.code === 200) {
      messages.value = []
      showToast('清空成功')
    } else {
      showToast(response.message || '清空失败')
    }
  } catch (error) {
    console.error('清空消息失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    closeToast(loadingToast)
  }
}

// 定时刷新消息
const { pause: pauseRefresh } = useIntervalFn(() => {
  // 获取最新消息
  const lastMessageId = messages.value[messages.value.length - 1]?.id
  
  // 实际项目中应该调用一个专门的API，这里简化处理
  fetchMessages()
}, 10000)

// 组件挂载
onMounted(async () => {
  // 加载会话详情和初始消息
  await fetchConversation()
  await fetchMessages()
  
  // 标记为已读
  try {
    await markAsRead(conversationId.value)
  } catch (error) {
    console.error('标记已读失败:', error)
  }
})

// 组件卸载
onUnmounted(() => {
  pauseRefresh()
})
</script>

<style scoped>
.conversation-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.message-list {
  flex: 1;
  overflow: hidden;
}
</style> 