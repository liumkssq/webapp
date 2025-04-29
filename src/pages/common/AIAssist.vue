<template>
  <div class="ai-assist-container">
    <header-navigation title="AI助手" />
    
    <div class="ai-content">
      <div class="ai-header">
        <div class="ai-avatar">
          <svg-icon name="robot" size="40" />
        </div>
        <h2>校园AI助手</h2>
        <p>我能帮你优化内容、生成文案、提供创意建议</p>
      </div>
      
      <div class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <!-- 欢迎消息 -->
          <div class="message ai-message">
            <div class="message-content">
              <p>你好！我是校园AI助手。我可以帮你：</p>
              <ul>
                <li>优化你的商品描述</li>
                <li>生成失物招领文案</li>
                <li>改进文章内容</li>
                <li>提供创意建议</li>
              </ul>
              <p>有什么我能帮到你的吗？</p>
            </div>
          </div>
          
          <!-- 历史消息 -->
          <template v-for="(message, index) in messages" :key="index">
            <div class="message" :class="message.type === 'user' ? 'user-message' : 'ai-message'">
              <div class="message-content">
                <p v-html="formatMessage(message.content)"></p>
              </div>
            </div>
          </template>
          
          <!-- 加载状态 -->
          <div class="message ai-message" v-if="isLoading">
            <div class="message-content loading">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
        
        <!-- 快捷回复选项 -->
        <div class="quick-replies" v-if="messages.length === 0 && !isLoading">
          <div 
            v-for="(prompt, index) in quickPrompts" 
            :key="index" 
            class="quick-reply-item"
            @click="sendQuickPrompt(prompt)"
          >
            {{ prompt.title }}
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="chat-input">
          <textarea 
            v-model="userInput" 
            placeholder="输入你的问题..." 
            @keydown.enter.prevent="handleEnterPress"
          ></textarea>
          <button 
            class="send-button" 
            :disabled="!userInput.trim() || isLoading"
            @click="sendMessage"
          >
            <svg-icon name="send" size="20" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderNavigation from '@/components/common/HeaderNavigation.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { generateContent as aiGenerateContent } from '@/utils/aiAssist.js'
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)

// 聊天消息
const messages = reactive([])

// 快捷提示选项
const quickPrompts = [
  { title: '优化我的商品描述', content: '我想要优化以下商品描述，让它更吸引人：' },
  { title: '生成失物招领信息', content: '帮我生成一个失物招领启事，物品是：' },
  { title: '润色我的文章', content: '请帮我润色以下文章内容：' },
  { title: '给我创意建议', content: '我想发布一个关于校园活动的帖子，请给我一些创意建议。' }
]

// 发送快捷提示
const sendQuickPrompt = (prompt) => {
  userInput.value = prompt.content
}

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  
  // 添加用户消息
  messages.push({
    type: 'user',
    content: userInput.value
  })
  
  // 保存用户输入并清空输入框
  const input = userInput.value
  userInput.value = ''
  
  // 滚动到底部 (等待DOM更新)
  await scrollToBottom()
  
  // 显示加载状态
  isLoading.value = true
  
  try {
    // --- 调用真实的 AI 助手 --- 
    const response = await aiGenerateContent({
      contentType: 'description', // 暂时使用 description 类型进行聊天
      context: { description: input } // 将用户输入作为描述上下文
    });

    // 添加AI回复
    messages.push({
      type: 'ai',
      content: response // LangChain 返回的是纯文本，不需要 formatMessage(?)，但保留以防万一
    });

  } catch (error) {
    console.error('AI响应错误:', error)
    // 添加错误消息
    messages.push({
      type: 'ai',
      // content: '抱歉，我遇到了一点问题。请稍后再试。' // Use more specific error
      content: `抱歉，我遇到了一点问题: ${error.message || '请稍后再试。'}`
    })
    
    // scrollToBottom() // Moved to finally block
  } finally { // 使用 finally 确保 loading 状态总是被重置
    isLoading.value = false;
    // 确保滚动到底部 (等待DOM更新)
    await scrollToBottom();
  }
}

// 处理回车键发送
const handleEnterPress = (event) => {
  // Ctrl+Enter 或 Shift+Enter 换行
  if (event.ctrlKey || event.shiftKey) {
    return
  }
  
  // 普通回车发送消息
  sendMessage()
}

// 格式化消息内容（支持简单HTML）
const formatMessage = (content) => {
  return content
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 监听消息变化，自动滚动
watch(messages, () => {
  scrollToBottom()
})

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.ai-assist-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

.ai-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  padding: 0 16px;
  overflow: hidden;
}

.ai-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  text-align: center;
}

.ai-avatar {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: rgba(var(--primary-rgb), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.ai-header h2 {
  margin: 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.ai-header p {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 280px;
  margin: 0;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  margin-bottom: 16px;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.message {
  display: flex;
  margin-bottom: 16px;
}

.user-message {
  justify-content: flex-end;
}

.message-content {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.4;
}

.user-message .message-content {
  background-color: var(--primary-color);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message .message-content {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.message-content p {
  margin: 0;
}

.message-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.message-content.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
}

.loading .dot {
  width: 8px;
  height: 8px;
  background-color: var(--text-tertiary);
  border-radius: 50%;
  margin: 0 3px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.quick-reply-item {
  background-color: rgba(var(--primary-rgb), 0.1);
  color: var(--primary-color);
  border-radius: 16px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.quick-reply-item:hover {
  background-color: rgba(var(--primary-rgb), 0.2);
}

.chat-input {
  display: flex;
  align-items: flex-end;
  background-color: var(--bg-secondary);
  border-radius: 24px;
  padding: 8px 12px;
  margin-top: 8px;
}

.chat-input textarea {
  flex: 1;
  height: 24px;
  max-height: 120px;
  border: none;
  background: transparent;
  resize: none;
  font-size: 15px;
  font-family: inherit;
  padding: 4px 8px;
  outline: none;
  color: var(--text-primary);
  line-height: 1.4;
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: var(--primary-color);
  border: none;
  color: white;
  cursor: pointer;
  margin-left: 8px;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>