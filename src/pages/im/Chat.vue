<template>
  <div class="chat-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="chatTitle"
      left-arrow
      fixed
      :border="false"
      @click-left="goBack"
      @click-right="showActions"
    >
      <template #right>
        <van-icon name="ellipsis" size="18" />
      </template>
    </van-nav-bar>
    
    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef" @click="handleMessageListClick">
      <template v-if="loading">
        <div class="loading-container">
          <van-loading type="spinner" color="#1989fa" />
        </div>
      </template>
      
      <template v-else-if="messages.length === 0">
        <empty-state
          icon="chat_bubble_outline"
          text="暂无消息"
          :small="false"
        />
      </template>
      
      <template v-else>
        <div class="load-more" v-if="hasMore" @click="loadMoreMessages">
          <div v-if="loadingMore" class="loading-more">
            <van-loading type="spinner" size="16" color="#969799" />
            <span>加载中...</span>
          </div>
          <span v-else>点击加载更多</span>
        </div>
        
        <!-- 消息时间分组 -->
        <div v-for="(group, date) in messageGroups" :key="date" class="message-group">
          <div class="date-divider">
            <span>{{ formatDate(date) }}</span>
          </div>
          
          <!-- 消息气泡 -->
          <div
            v-for="message in group"
            :key="message.id"
            class="message-item"
            :class="{ 'message-self': message.senderId === currentUserId }"
          >
            <!-- 头像 - 非自己发送的消息 -->
            <template v-if="message.senderId !== currentUserId">
              <div class="avatar-container" @click="viewProfile(message.senderId)">
                <van-image
                  round
                  width="2.5rem"
                  height="2.5rem"
                  :src="message.senderAvatar"
                  fit="cover"
                >
                  <template #error>
                    <div class="avatar-fallback">{{ getInitials(message.senderName) }}</div>
                  </template>
                </van-image>
              </div>
            </template>
            
            <div class="message-content" :class="{ 'self-content': message.senderId === currentUserId }">
              <!-- 发送者名称 - 群聊中他人发送的消息 -->
              <div v-if="isGroupChat && message.senderId !== currentUserId" class="sender-name">
                {{ message.senderName }}
              </div>
              
              <!-- 撤回提示 -->
              <div v-if="message.isRecalled" class="recalled-message">
                <span v-if="message.senderId === currentUserId">你撤回了一条消息</span>
                <span v-else>{{ message.senderName }}撤回了一条消息</span>
              </div>
              
              <!-- 文本消息 -->
              <div
                v-else-if="message.type === 'text'"
                class="text-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @contextmenu.prevent="showMessageActions(message, $event)"
                v-html="renderTextMessage(message.content)"
              >
              </div>
              
              <!-- 图片消息 -->
              <div
                v-else-if="message.type === 'image'"
                class="image-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <van-image
                  :src="message.content.url"
                  :width="calculateImageSize(message.content).width"
                  :height="calculateImageSize(message.content).height"
                  radius="4px"
                  @click="previewImage(message.content.url)"
                />
              </div>
              
              <!-- 语音消息 -->
              <div
                v-else-if="message.type === 'voice'"
                class="voice-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @click="playVoice(message.content)"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <van-icon name="volume-o" :color="message.senderId === currentUserId ? '#fff' : '#1989fa'" />
                <span>{{ message.content.duration }}''</span>
                <span v-if="playingVoiceId === message.id" class="playing-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
              
              <!-- 文件消息 -->
              <div
                v-else-if="message.type === 'file'"
                class="file-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <van-icon name="description" size="24" :color="message.senderId === currentUserId ? '#fff' : '#1989fa'" />
                <div class="file-info">
                  <div class="file-name">{{ getFileName(message.content.url) }}</div>
                  <div class="file-action">点击下载</div>
                </div>
              </div>
              
              <!-- 位置消息 -->
              <div
                v-else-if="message.type === 'location'"
                class="location-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @click="viewLocation(message.content)"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <div class="location-icon">
                  <van-icon name="location-o" size="20" :color="message.senderId === currentUserId ? '#fff' : '#1989fa'" />
                </div>
                <div class="location-address">
                  {{ getLocationAddress(message.content) }}
                </div>
                <div class="view-location">查看位置 ></div>
              </div>
              
              <!-- 视频消息 -->
              <div
                v-else-if="message.type === 'video'"
                class="video-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <div class="video-container">
                  <video controls :src="message.content.url" width="200"></video>
                </div>
              </div>
              
              <!-- 未知类型 -->
              <div
                v-else
                class="unknown-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
              >
                [未知消息类型]
              </div>
              
              <!-- 发送状态 - 自己发送的消息 -->
              <div v-if="message.senderId === currentUserId" class="message-status">
                <van-icon v-if="message.status === 'sending'" name="more-o" />
                <van-icon v-else-if="message.status === 'failed'" name="warning-o" color="#ee0a24" @click="resendMessage(message)" />
              </div>
            </div>
            
            <!-- 头像 - 自己发送的消息 -->
            <template v-if="message.senderId === currentUserId">
              <div class="avatar-container" @click="viewProfile(message.senderId)">
                <van-image
                  round
                  width="2.5rem"
                  height="2.5rem"
                  :src="message.senderAvatar"
                  fit="cover"
                >
                  <template #error>
                    <div class="avatar-fallback">{{ getInitials(message.senderName) }}</div>
                  </template>
                </van-image>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-bar">
        <div class="input-actions">
          <van-icon name="smile-o" size="24" color="#969799" @click="toggleEmojiPanel" />
        </div>
        
        <div class="input-box">
          <van-field
            v-model="inputText"
            type="textarea"
            placeholder="输入消息..."
            autosize
            class="message-input"
            @keypress.enter.prevent="sendTextMessage"
          />
        </div>
        
        <div class="input-actions">
          <van-icon name="add-o" size="24" color="#969799" @click="toggleMorePanel" />
        </div>
      </div>
      
      <!-- 表情面板 -->
      <div class="emoji-panel" v-if="showEmojiPanel">
        <div class="emoji-container">
          <div class="emoji-group">
            <div 
              v-for="emoji in emojiList" 
              :key="emoji" 
              class="emoji-item" 
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 更多功能面板 -->
      <div v-show="showMorePanel" class="more-panel">
        <div class="action-grid">
          <div class="action-item" @click="chooseImage">
            <div class="action-icon">
              <van-icon name="photo-o" size="24" color="#1989fa" />
            </div>
            <div class="action-name">图片</div>
          </div>
          
          <div class="action-item" @click="captureVoice">
            <div class="action-icon">
              <van-icon name="volume-o" size="24" color="#1989fa" />
            </div>
            <div class="action-name">语音</div>
          </div>
          
          <div class="action-item" @click="chooseFile">
            <div class="action-icon">
              <van-icon name="description" size="24" color="#1989fa" />
            </div>
            <div class="action-name">文件</div>
          </div>
          
          <div class="action-item" @click="shareLocation">
            <div class="action-icon">
              <van-icon name="location-o" size="24" color="#1989fa" />
            </div>
            <div class="action-name">位置</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 消息操作菜单 -->
    <van-action-sheet
      v-model:show="showMessageMenu"
      :actions="messageActions"
      cancel-text="取消"
      close-on-click-action
      @select="onMessageActionSelect"
    />
    
    <!-- 聊天操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="chatActions"
      cancel-text="取消"
      close-on-click-action
      @select="onChatActionSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showConfirmDialog, showNotify } from 'vant'
import dayjs from 'dayjs'
import EmptyState from '@/components/common/EmptyState.vue'
import { 
  getMessages, 
  sendMessage, 
  recallMessage, 
  getConversationDetail,
  markMessageRead
} from '@/api/im'

const route = useRoute()
const router = useRouter()

// 获取路由参数
const conversationType = route.params.type // private 或 group
const targetId = parseInt(route.params.id)

// 当前用户信息
const currentUserId = 1 // 假设当前用户ID为1
const isGroupChat = computed(() => conversationType === 'group')

// DOM引用
const messageListRef = ref(null)

// 状态变量
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const conversation = ref(null)
const messages = ref([])
const inputText = ref('')
const showEmojiPanel = ref(false)
const showMorePanel = ref(false)
const showMessageMenu = ref(false)
const showActionSheet = ref(false)
const selectedMessage = ref(null)
const playingVoiceId = ref(null)
const audioPlayer = ref(null)

// 计算属性 - 聊天标题
const chatTitle = computed(() => {
  if (!conversation.value) return '聊天';
  return conversation.value.targetInfo?.name || '';
})

// 计算属性 - 按日期分组的消息
const messageGroups = computed(() => {
  const groups = {};
  
  messages.value.forEach(message => {
    const date = dayjs(message.timestamp).format('YYYY-MM-DD');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return groups;
})

// 消息操作菜单
const messageActions = computed(() => {
  if (!selectedMessage.value) return [];
  
  const msg = selectedMessage.value;
  const actions = [];
  
  // 复制选项（仅文本消息）
  if (msg.type === 'text') {
    actions.push({ name: '复制', color: '#1989fa' });
  }
  
  // 转发选项
  actions.push({ name: '转发', color: '#1989fa' });
  
  // 撤回选项（自己发的且在2分钟内）
  if (msg.senderId === currentUserId && 
      dayjs().diff(dayjs(msg.timestamp), 'minute') < 2 && 
      !msg.isRecalled) {
    actions.push({ name: '撤回', color: '#ee0a24' });
  }
  
  return actions;
})

// 聊天操作菜单
const chatActions = computed(() => {
  const actions = [];
  
  if (isGroupChat.value) {
    actions.push({ name: '查看群信息', color: '#1989fa' });
  } else {
    actions.push({ name: '查看资料', color: '#1989fa' });
  }
  
  actions.push({ name: '清空聊天记录', color: '#ee0a24' });
  
  return actions;
})

// 表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😮', '😱', '😳', '🥵', '🥶',
  '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
  '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱',
  '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷',
  '🤒', '🤕', '🤑', '🤠', '👻', '💩', '🤡', '👽', '👾', '🤖',
  '👋', '🖐️', '👌', '✌️', '🤞', '🤟', '🤙', '👎', '❤️'
]

// 获取会话详情
const fetchConversationDetail = async () => {
  try {
    const { data } = await getConversationDetail(conversationType, targetId)
    conversation.value = data
  } catch (error) {
    console.error('获取会话详情失败:', error)
    showToast('获取会话详情失败')
  }
}

// 标记消息为已读
const markMessagesAsRead = async () => {
  if (!conversationType || !targetId) return;
  
  try {
    await markMessageRead(conversationType === 'group' ? `group_${targetId}` : `private_${targetId}`);
    console.log('标记消息为已读成功');
  } catch (error) {
    console.error('标记消息为已读失败:', error);
  }
};

// 获取消息列表
const fetchMessages = async (lastMessageId = null) => {
  if (!lastMessageId) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  
  try {
    const { data } = await getMessages({
      conversationType,
      targetId,
      lastMessageId,
      pageSize: 20
    })
    
    if (!lastMessageId) {
      messages.value = data.list || []
    } else {
      // 添加加载的消息，避免重复
      const newMessages = (data.list || []).filter(newMsg => 
        !messages.value.some(existingMsg => existingMsg.id === newMsg.id)
      );
      messages.value = [...newMessages, ...messages.value]
    }
    
    hasMore.value = data.hasMore
    
    // 标记为已读
    markMessagesAsRead();
  } catch (error) {
    console.error('获取消息失败:', error)
    showToast('获取消息失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多消息
const loadMoreMessages = () => {
  if (loadingMore.value || !hasMore.value) return
  
  const oldestMessage = messages.value[0]
  if (oldestMessage) {
    fetchMessages(oldestMessage.id)
  }
}

// 滚动到底部
const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (messageListRef.value) {
      const scrollOptions = smooth ? { behavior: 'smooth' } : {}
      const listElement = messageListRef.value
      
      // 检查当前是否已经在底部附近（差距小于100px）
      const isNearBottom = listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight < 100
      
      // 如果已经接近底部或强制滚动（例如发送新消息时），则滚动到底部
      if (isNearBottom || !smooth) {
        listElement.scrollTop = listElement.scrollHeight
      }
    }
  })
}

// 防抖函数：延迟执行函数，如果在延迟时间内再次调用则重新计时
const debounce = (fn, delay) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

// 防抖处理的滚动事件处理函数
const handleScroll = debounce(() => {
  if (!messageListRef.value || loadingMore.value || !hasMore.value) return
  
  // 检查是否滚动到顶部附近（距离小于50px）
  if (messageListRef.value.scrollTop < 50) {
    loadMoreMessages()
  }
}, 200)

// 发送文本消息
const sendTextMessage = async () => {
  if (!inputText.value.trim()) return
  
  // 隐藏任何可能打开的面板
  showEmojiPanel.value = false
  showMorePanel.value = false
  
  // 创建临时消息
  const tempId = `temp_${Date.now()}`
  const messageText = inputText.value.trim()
  const tempMessage = {
    id: tempId,
    conversationType,
    targetId,
    senderId: currentUserId,
    senderName: '我',
    senderAvatar: '', // 使用当前用户头像
    type: 'text',
    content: messageText,
    timestamp: new Date().toISOString(),
    status: 'sending',
    isRecalled: false
  }
  
  // 先添加到列表
  messages.value.push(tempMessage)
  scrollToBottom()
  
  // 清空输入框（在确认添加到列表后再清空）
  inputText.value = ''
  
  try {
    const { data } = await sendMessage({
      conversationType,
      targetId,
      messageType: 'text',
      content: messageText
    })
    
    // 更新消息状态
    const index = messages.value.findIndex(msg => msg.id === tempId)
    if (index !== -1) {
      messages.value[index] = {
        ...messages.value[index],
        ...data,
        status: 'sent'
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    
    // 更新为发送失败状态
    const index = messages.value.findIndex(msg => msg.id === tempId)
    if (index !== -1) {
      messages.value[index].status = 'failed'
    }
    
    showToast('发送失败，请重试')
  }
}

// 重发消息
const resendMessage = async (message) => {
  const index = messages.value.findIndex(msg => msg.id === message.id)
  if (index === -1) return
  
  // 更新为发送中状态
  messages.value[index].status = 'sending'
  
  try {
    const { data } = await sendMessage({
      conversationType,
      targetId,
      messageType: message.type,
      content: message.content
    })
    
    // 更新消息
    messages.value[index] = data
  } catch (error) {
    console.error('重发消息失败:', error)
    
    // 更新为发送失败状态
    messages.value[index].status = 'failed'
  }
}

// 撤回消息
const recallMessageAction = async (message) => {
  if (message.isRecalled) return
  
  try {
    const loadingToast = showLoadingToast({
      message: '撤回中...',
      forbidClick: true
    })
    
    await recallMessage(message.id)
    
    // 更新消息状态
    const index = messages.value.findIndex(msg => msg.id === message.id)
    if (index !== -1) {
      messages.value[index].isRecalled = true
    }
    
    closeToast(loadingToast)
  } catch (error) {
    console.error('撤回消息失败:', error)
    showToast('撤回失败')
  }
}

// 插入表情
const insertEmoji = (emoji) => {
  inputText.value += emoji
}

// 切换表情面板
const toggleEmojiPanel = () => {
  showEmojiPanel.value = !showEmojiPanel.value
  if (showEmojiPanel.value) {
    showMorePanel.value = false
  }
}

// 切换更多功能面板
const toggleMorePanel = () => {
  showMorePanel.value = !showMorePanel.value
  if (showMorePanel.value) {
    showEmojiPanel.value = false
  }
}

// 选择图片
const chooseImage = () => {
  showToast('该功能开发中...')
}

// 录制语音
const captureVoice = () => {
  showToast('该功能开发中...')
}

// 选择文件
const chooseFile = () => {
  showToast('该功能开发中...')
}

// 分享位置
const shareLocation = () => {
  try {
    // 关闭表情面板和更多选项面板
    showEmojiPanel.value = false
    showMorePanel.value = false
    
    // 跳转到地图选择页面
    console.log('分享位置，跳转到地图选择器')
    router.push({
      path: '/map/picker', 
      query: {
        callback: route.fullPath,
        type: 'location'
      }
    }).catch(err => {
      console.error('导航到地图选择器失败:', err)
      showToast('无法打开地图选择器')
    })
  } catch (e) {
    console.error('分享位置时发生错误:', e)
    showToast('分享位置功能暂时不可用')
  }
}

// 播放语音
const playVoice = (voice) => {
  if (!voice || !voice.url) return
  
  // 如果已有正在播放的音频，先停止
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value = null
    playingVoiceId.value = null
  }
  
  // 创建新的音频播放器
  const audio = new Audio(voice.url)
  audioPlayer.value = audio
  
  audio.onplaying = () => {
    playingVoiceId.value = selectedMessage.value?.id
  }
  
  audio.onended = () => {
    playingVoiceId.value = null
    audioPlayer.value = null
  }
  
  audio.play().catch(error => {
    console.error('播放语音失败:', error)
    showToast('播放语音失败')
    playingVoiceId.value = null
    audioPlayer.value = null
  })
}

// 预览图片
const previewImage = (url) => {
  // 在这里调用 Vant 的图片预览组件
  showToast('图片预览功能开发中...')
}

// 格式化日期
const formatDate = (dateStr) => {
  const date = dayjs(dateStr)
  const now = dayjs()
  
  if (date.isSame(now, 'day')) {
    return '今天'
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  } else if (date.isAfter(now.subtract(7, 'day'))) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.day()]
  } else if (date.isSame(now, 'year')) {
    return date.format('MM月DD日')
  } else {
    return date.format('YYYY年MM月DD日')
  }
}

// 获取文件名
const getFileName = (url) => {
  if (!url) return '未知文件'
  
  const parts = url.split('/')
  return parts[parts.length - 1]
}

// 获取姓名首字母
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 计算图片尺寸
const calculateImageSize = (image) => {
  // 假设有一个最大宽度，可以根据实际设备宽度调整
  const maxWidth = 200
  const maxHeight = 300
  
  // 如果有实际尺寸信息，可以根据比例计算
  // 这里简单返回固定尺寸
  return { width: 150, height: 200 }
}

// 显示消息操作菜单
const showMessageActions = (message, event) => {
  selectedMessage.value = message
  showMessageMenu.value = true
}

// 处理消息操作菜单选择
const onMessageActionSelect = (action) => {
  if (!selectedMessage.value) return
  
  const message = selectedMessage.value
  
  if (action.name === '复制') {
    if (message.type === 'text') {
      navigator.clipboard.writeText(message.content)
        .then(() => showToast('已复制到剪贴板'))
        .catch(() => showToast('复制失败'))
    }
  } else if (action.name === '转发') {
    showToast('转发功能开发中...')
  } else if (action.name === '撤回') {
    recallMessageAction(message)
  }
  
  selectedMessage.value = null
}

// 显示聊天操作菜单
const showActions = () => {
  showActionSheet.value = true
}

// 处理聊天操作菜单选择
const onChatActionSelect = (action) => {
  if (action.name === '查看群信息') {
    router.push(`/im/group-detail/${targetId}`)
  } else if (action.name === '查看资料') {
    router.push(`/user/profile/${targetId}`)
  } else if (action.name === '清空聊天记录') {
    showToast('清空聊天记录功能开发中...')
  }
}

// 查看用户资料
const viewProfile = (userId) => {
  if (userId === currentUserId) return
  router.push(`/user/profile/${userId}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 渲染文本消息，识别链接
const renderTextMessage = (text) => {
  if (!text) return '';
  
  // 链接正则表达式 - 匹配http/https链接和www开头的链接
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  
  // 替换链接为可点击的形式
  return text.replace(urlRegex, (match) => {
    let url = match;
    if (match.startsWith('www.')) {
      url = 'http://' + match;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">${match}</a>`;
  });
};

// 处理链接点击
const handleLinkClick = (event) => {
  // 检查是否点击了链接
  if (event.target.tagName === 'A' && event.target.classList.contains('message-link')) {
    event.preventDefault();
    
    const url = event.target.getAttribute('href');
    if (url) {
      // 询问用户是否打开链接
      showConfirmDialog({
        title: '打开链接',
        message: `是否打开外部链接？\n${url}`,
        confirmButtonText: '打开',
        cancelButtonText: '取消'
      }).then(() => {
        // 用户确认，在新窗口打开链接
        window.open(url, '_blank');
      }).catch(() => {
        // 用户取消，不执行操作
      });
    }
  }
};

// 检测新消息并通知
const notifyNewMessage = (newMessages) => {
  if (!newMessages || newMessages.length === 0) return;
  
  // 过滤出非自己发送的新消息
  const otherMessages = newMessages.filter(msg => msg.senderId !== currentUserId);
  
  if (otherMessages.length === 0) return;
  
  // 获取发送者信息
  const senderName = otherMessages[0].senderName || '对方';
  
  // 根据消息类型生成预览文本
  let previewText = '';
  const latestMessage = otherMessages[otherMessages.length - 1];
  
  switch (latestMessage.type) {
    case 'text':
      previewText = latestMessage.content;
      if (previewText.length > 20) {
        previewText = previewText.substring(0, 20) + '...';
      }
      break;
    case 'image':
      previewText = '[图片]';
      break;
    case 'voice':
      previewText = '[语音]';
      break;
    case 'file':
      previewText = '[文件]';
      break;
    case 'location':
      previewText = '[位置]';
      break;
    case 'video':
      previewText = '[视频]';
      break;
    default:
      previewText = '[消息]';
  }
  
  // 显示通知
  showNotify({
    type: 'primary',
    message: `${senderName}: ${previewText}`,
    duration: 3000
  });
  
  // 播放消息提示音(可选实现)
  playMessageSound();
};

// 播放消息提示音
const playMessageSound = () => {
  try {
    const audio = new Audio('/assets/sounds/message.mp3');
    audio.volume = 0.5; // 设置音量为50%
    audio.play();
  } catch (error) {
    console.error('播放提示音失败:', error);
  }
};

// 添加自动更新消息列表功能
let messageUpdateInterval = null;

const startMessagePolling = () => {
  if (messageUpdateInterval) return;
  
  // 每15秒检查一次新消息
  messageUpdateInterval = setInterval(async () => {
    if (messages.value.length === 0) return;
    
    try {
      const latestMessage = messages.value[messages.value.length - 1];
      
      const { data } = await getMessages({
        conversationType,
        targetId,
        afterMessageId: latestMessage.id,
        pageSize: 10
      });
      
      if (data.list && data.list.length > 0) {
        // 添加新消息，避免重复
        const newMessages = data.list.filter(newMsg => 
          !messages.value.some(existingMsg => existingMsg.id === newMsg.id)
        );
        
        if (newMessages.length > 0) {
          // 根据是否为当前窗口和是否在底部决定通知行为
          const shouldNotify = document.visibilityState === 'hidden' || !document.hasFocus();
          
          // 添加新消息到列表
          messages.value = [...messages.value, ...newMessages];
          
          // 如果用户当前在查看聊天，自动标记为已读
          markMessagesAsRead();
          
          // 当前在底部区域才自动滚动
          const listElement = messageListRef.value;
          if (listElement) {
            const isNearBottom = listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight < 200;
            if (isNearBottom) {
              scrollToBottom();
            } else if (shouldNotify) {
              // 如果不在底部且需要通知，则显示新消息通知
              notifyNewMessage(newMessages);
            }
          }
        }
      }
    } catch (error) {
      console.error('轮询新消息失败:', error);
    }
  }, 15000); // 15秒
};

// 生命周期钩子
onMounted(async () => {
  try {
    await fetchConversationDetail()
    await fetchMessages()
    scrollToBottom(false)
    
    // 添加滚动监听
    if (messageListRef.value) {
      messageListRef.value.addEventListener('scroll', handleScroll)
    }
    
    // 开始消息轮询
    startMessagePolling();

    // 处理地图位置分享返回
    const locationData = route.query.location
    const locationType = route.query.type
    if (locationData && locationType === 'location') {
      try {
        // 解析位置数据
        let parsedLocation
        if (typeof locationData === 'string') {
          try {
            parsedLocation = JSON.parse(decodeURIComponent(locationData))
          } catch (err) {
            console.error('JSON解析位置数据失败，尝试直接解码', err)
            parsedLocation = JSON.parse(locationData)
          }
        } else {
          parsedLocation = locationData
        }

        console.log('解析的位置数据:', parsedLocation)

        // 发送位置消息
        if (parsedLocation && parsedLocation.lng && parsedLocation.lat) {
          const tempId = `temp_${Date.now()}`
          const tempMessage = {
            id: tempId,
            conversationType,
            targetId,
            senderId: currentUserId,
            senderName: '我',
            senderAvatar: '', // 使用当前用户头像
            type: 'location',
            content: JSON.stringify(parsedLocation),
            timestamp: new Date().toISOString(),
            status: 'sending',
            isRecalled: false
          }
          
          // 先添加到列表
          messages.value.push(tempMessage)
          scrollToBottom()
          
          try {
            const { data } = await sendMessage({
              conversationType,
              targetId,
              messageType: 'location',
              content: JSON.stringify(parsedLocation)
            })
            
            // 更新消息状态
            const index = messages.value.findIndex(msg => msg.id === tempId)
            if (index !== -1) {
              messages.value[index] = data
            }
            
            // 清除URL参数
            router.replace({ 
              path: route.path,
              params: route.params
            })

            showToast('位置已发送')
          } catch (error) {
            console.error('发送位置消息失败:', error)
            
            // 更新为发送失败状态
            const index = messages.value.findIndex(msg => msg.id === tempId)
            if (index !== -1) {
              messages.value[index].status = 'failed'
            }
            showToast('发送位置失败')
          }
        } else {
          console.error('位置数据不完整', parsedLocation)
          showToast('位置数据不完整')
        }
      } catch (e) {
        console.error('处理位置数据失败', e)
        showToast('处理位置数据失败')
      }
    }
  } catch (error) {
    console.error('初始化聊天页面失败:', error)
    showToast('加载聊天记录失败，请重试')
  }
})

onBeforeUnmount(() => {
  // 清理音频播放器
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value = null
  }
  
  // 移除滚动监听
  if (messageListRef.value) {
    messageListRef.value.removeEventListener('scroll', handleScroll)
  }
  
  // 停止消息轮询
  stopMessagePolling();
})

// 获取位置地址
const getLocationAddress = (content) => {
  try {
    if (!content) {
      return '未知位置'
    }
    
    let locationData
    
    if (typeof content === 'string') {
      try {
        locationData = JSON.parse(content)
      } catch (err) {
        console.error('无法解析位置JSON:', err)
        return '解析位置失败'
      }
    } else {
      locationData = content
    }
    
    if (!locationData || !locationData.address) {
      // 如果没有地址但有经纬度，显示坐标
      if (locationData && locationData.lng && locationData.lat) {
        return `坐标 (${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)})`
      }
      return '未知位置'
    }
    
    return locationData.address
  } catch (e) {
    console.error('获取地址信息失败:', e)
    return '位置显示错误'
  }
}

// 查看位置
const viewLocation = (content) => {
  try {
    // 尝试解析位置数据，首先尝试直接解析
    let locationData
    
    try {
      // 先尝试把字符串转为JSON对象
      if (typeof content === 'string') {
        locationData = JSON.parse(content)
      } else {
        locationData = content
      }
    } catch (e) {
      console.error('解析位置数据失败，可能是无效的JSON:', e)
      showToast('位置数据格式错误')
      return
    }
    
    // 确保数据包含必需的字段
    if (!locationData || !locationData.lng || !locationData.lat) {
      console.error('位置数据不完整:', locationData)
      showToast('位置数据不完整')
      return
    }
    
    // 跳转到地图页面
    console.log('查看位置:', locationData)
    router.push({
      path: '/map/picker',
      query: {
        location: JSON.stringify(locationData),
        readonly: 'true'
      }
    })
  } catch (e) {
    console.error('处理位置数据失败:', e)
    showToast('无法查看位置')
  }
}

const stopMessagePolling = () => {
  if (messageUpdateInterval) {
    clearInterval(messageUpdateInterval);
    messageUpdateInterval = null;
  }
};

// 处理消息列表点击
const handleMessageListClick = (event) => {
  // 处理链接点击
  handleLinkClick(event);
};
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  margin-top: 46px; /* NavBar 高度 */
  margin-bottom: 50px; /* 输入区域高度 */
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem;
}

.load-more {
  text-align: center;
  color: #969799;
  font-size: 0.875rem;
  padding: 0.5rem;
  cursor: pointer;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-more span {
  margin-left: 0.5rem;
}

.date-divider {
  text-align: center;
  margin: 1rem 0;
  position: relative;
}

.date-divider span {
  background-color: #f2f3f5;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  color: #969799;
  border-radius: 1rem;
}

.message-item {
  display: flex;
  margin-bottom: 1rem;
  align-items: flex-start;
}

.message-self {
  flex-direction: row-reverse;
}

.avatar-container {
  margin: 0 0.5rem;
  flex-shrink: 0;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f2f3f5;
  color: #969799;
  font-weight: bold;
  border-radius: 50%;
}

.message-content {
  max-width: 70%;
}

.self-content {
  align-items: flex-end;
}

.sender-name {
  font-size: 0.75rem;
  color: #969799;
  margin-bottom: 0.25rem;
}

.recalled-message {
  padding: 0.5rem;
  background-color: #f2f3f5;
  color: #969799;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  text-align: center;
}

.text-message {
  padding: 0.5rem 0.75rem;
  background-color: #fff;
  border-radius: 0.25rem;
  word-break: break-word;
  line-height: 1.4;
}

.self-message {
  background-color: #1989fa;
  color: #fff;
}

.image-message {
  display: inline-block;
  border-radius: 0.25rem;
  overflow: hidden;
  background-color: #fff;
}

.voice-message {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: #fff;
  border-radius: 0.25rem;
  min-width: 4rem;
}

.voice-message .van-icon {
  margin-right: 0.5rem;
}

.playing-animation {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

.playing-animation span {
  display: inline-block;
  width: 3px;
  height: 3px;
  margin: 0 1px;
  background-color: currentColor;
  border-radius: 50%;
  animation: play 1.2s ease infinite;
}

.playing-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.playing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes play {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(2);
  }
}

.file-message {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: #fff;
  border-radius: 0.25rem;
  width: 12rem;
}

.file-info {
  margin-left: 0.5rem;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-action {
  font-size: 0.75rem;
  color: #969799;
  margin-top: 0.25rem;
}

.location-message {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: var(--message-bg-color, #fff);
  border-radius: var(--message-border-radius, 8px);
  align-items: flex-start;
  width: 220px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.self-message.location-message {
  background-color: var(--self-message-bg-color, #007AFF);
  color: var(--self-message-color, #fff);
}

.location-icon {
  margin-bottom: 8px;
}

.location-address {
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
  word-break: break-all;
}

.view-location {
  font-size: 12px;
  color: #1989fa;
  align-self: flex-end;
}

.self-message .view-location {
  color: rgba(255, 255, 255, 0.8);
}

.message-status {
  margin-left: 0.5rem;
  color: #969799;
  font-size: 0.75rem;
  align-self: center;
}

.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #f2f3f5;
  z-index: 10;
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-top: 1px solid #ebedf0;
}

.input-actions {
  padding: 0 0.5rem;
}

.input-box {
  flex: 1;
}

.message-input {
  background-color: #fff;
  border-radius: 1.25rem;
}

.emoji-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  height: 200px;
  background-color: #f5f5f5;
  padding: 0.5rem;
  overflow-y: auto;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.emoji-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  padding: 8px;
}

.emoji-group {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.emoji-item {
  font-size: 24px;
  padding: 8px;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.emoji-item:active {
  transform: scale(0.9);
}

.more-panel {
  background-color: #fff;
  height: 14rem;
  padding: 1rem;
  border-top: 1px solid #ebedf0;
  overflow-y: auto;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.action-icon {
  width: 3rem;
  height: 3rem;
  background-color: #f7f8fa;
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.5rem;
}

.action-name {
  font-size: 0.75rem;
  color: #646566;
}
</style> 