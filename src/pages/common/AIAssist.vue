<template>
  <div class="ai-assist-container ios-safe-area">
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
import aiAssistUtils, { createConversationalAgent, fallbackAgent } from '@/utils/aiAssist.js'
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const agent = ref(null);
const isTyping = ref(false);
const currentStreamedContent = ref('');

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

// 处理 AI 回复的流式 token
const handleToken = (token) => {
  try {
    // 首次接收到token时，展示"AI正在回复"状态
    if (!isTyping.value) {
      isTyping.value = true;
      // 添加一个新的AI消息占位符
      messages.push({
        type: 'ai',
        content: '',
        isStreaming: true
      });
    }
    
    // 获取最新消息的索引
    const messageIndex = messages.length - 1;
    
    // 将新token添加到内容中
    currentStreamedContent.value += token;
    messages[messageIndex].content = currentStreamedContent.value;
    
    // 确保滚动到底部，以便用户看到最新内容
    scrollToBottom();
  } catch (tokenError) {
    console.error('处理流式Token时出错:', tokenError);
    // 不影响主流程，但记录错误
  }
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  
  // ADDED: Check if agent is available
  if (!agent.value || typeof agent.value.invoke !== 'function') {
    messages.push({
      type: 'ai',
      content: 'AI助手未正确初始化，请刷新页面重试。'
    });
    return;
  }

  // 添加用户消息
  messages.push({
    type: 'user',
    content: userInput.value
  })

  // 清空输入区域
  const userMessage = userInput.value
  userInput.value = ''

  // 设置加载状态
  isLoading.value = true;
  // 重置流内容
  currentStreamedContent.value = '';
  
  try {
    // --- 创建元素，帮助我们检测流式响应是否正常启动 ---
    let streamStarted = false;
    
    // 监听流式开始的超时检测
    const streamStartTimeout = setTimeout(() => {
      if (!streamStarted && isLoading.value) {
        console.warn('AI响应流未开始，可能存在问题');
        // 添加一个临时消息表示正在加载
        messages.push({
          type: 'ai',
          content: '正在思考中...',
          isTemporary: true // 标记为临时，稍后会被替换
        });
      }
    }, 3000); // 3秒后检查
    
    // --- 调用真实的 AI 助手，传入流式处理回调 --- 
    const response = await agent.value.invoke({ 
      input: userMessage,
      onToken: (token) => {
        streamStarted = true; // 标记流已开始
        handleToken(token);
      }
    });
    
    // 清除超时
    clearTimeout(streamStartTimeout);
    
    // 如果我们有临时消息，移除它
    const tempMsgIndex = messages.findIndex(m => m.isTemporary);
    if (tempMsgIndex !== -1) {
      messages.splice(tempMsgIndex, 1);
    }
    
    // 最终完整的回复已经通过handleToken更新到messages中
    // 如果流式输出失败，使用完整响应作为后备
    if (!streamStarted && response.output) {
      messages.push({
        type: 'ai',
        content: response.output
      });
    }

  } catch (error) {
    console.error('AI响应错误:', error)
    // 添加错误消息
    messages.push({
      type: 'ai',
      content: `抱歉，我遇到了一点问题: ${error.message || '请稍后再试。'}`
    })
  } finally {
    isLoading.value = false;
    isTyping.value = false;
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

onMounted(async () => {
  isLoading.value = true;
  try {
    // 尝试使用命名导出
    let agentCreator = createConversationalAgent;
    
    // 如果命名导出失败，尝试使用默认导出
    if (!agentCreator) {
      console.warn('AI Agent: Named import failed, trying default import');
      agentCreator = aiAssistUtils.createConversationalAgent;
    }
    
    // 如果仍然失败，使用fallback
    if (!agentCreator) {
      console.warn('AI Agent: All imports failed, using fallback agent');
      agent.value = fallbackAgent;
    } else {
      agent.value = await agentCreator({
        systemMessage: "你是一个友善且乐于助人的校园AI助手。请清晰地回答用户关于校园生活、学习辅助、二手交易、失物招领等方面的问题。如果遇到无法回答的问题，请礼貌地告知用户。",
        useStreaming: true // 启用流式输出
      });
    }
    
    if (!agent.value || typeof agent.value.invoke !== 'function') {
        console.error('AI Agent: Initialization failed or agent is not valid.');
        messages.push({
            type: 'ai',
            content: 'AI对话助手初始化失败，请稍后重试。'
        });
        agent.value = null; // Ensure agent is null if invalid
    } else {
        console.log("AI Agent: Conversational agent initialized successfully.");
    }
  } catch (error) {
    console.error('AI Agent: Error during initialization:', error);
    messages.push({
        type: 'ai',
        content: `AI对话助手初始化遇到问题: ${error.message || '请检查网络或配置。'}`
    });
  } finally {
    isLoading.value = false;
    scrollToBottom(); // Initial scroll after attempting to load agent and potentially messages
  }
})
</script>

<style scoped>
/* iOS安全区域适配 */
.ios-safe-area {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.ai-assist-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f8f8; /* iOS 背景色 */
}

.ai-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  padding: 0 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); /* iOS安全区域 */
  overflow: hidden;
}

.ai-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 20px;
  text-align: center;
  position: relative;
}

.ai-header::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background-color: rgba(60, 60, 67, 0.1);
}

.ai-avatar {
  width: 64px;
  height: 64px;
  border-radius: 22px; /* iOS风格的圆角 */
  background-color: #e1f5fe;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15); /* iOS阴影 */
}

.ai-header h2 {
  margin: 8px 0;
  font-size: 22px;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.2px; /* iOS风格字间距 */
}

.ai-header p {
  font-size: 15px;
  color: #8e8e93; /* iOS次要文本颜色 */
  max-width: 280px;
  margin: 0;
  line-height: 1.4;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  margin-bottom: 16px;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 20px; /* iOS圆角 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); /* 轻微阴影 */
  padding: 12px 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* iOS风格的过渡曲线 */
  position: relative;
}

.chat-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(60, 60, 67, 0.06), transparent);
}

.chat-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(60, 60, 67, 0.06), transparent);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px 16px;
  -webkit-overflow-scrolling: touch; /* iOS流畅滚动 */
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
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04); /* 轻微阴影 */
  animation: message-fade-in 0.3s ease-out;
}

.user-message .message-content {
  background-color: #007AFF; /* iOS蓝色 */
  color: white;
  border-bottom-right-radius: 4px;
  margin-left: auto;
  position: relative;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08); /* 轻微阴影 */
}

.ai-message .message-content {
  background-color: #F2F2F7; /* iOS浅灰色 */
  color: #000;
  border-bottom-left-radius: 4px;
  margin-right: auto;
  position: relative;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04); /* 轻微阴影 */
}

/* 添加iOS风格气泡尾巴 */
.user-message .message-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -6px;
  width: 12px;
  height: 12px;
  background-color: #007AFF;
  border-radius: 0 0 0 12px;
  clip-path: polygon(0 0, 0% 100%, 100% 100%);
}

.ai-message .message-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -6px;
  width: 12px;
  height: 12px;
  background-color: #F2F2F7;
  border-radius: 0 0 12px 0;
  clip-path: polygon(100% 0, 0% 100%, 100% 100%);
}

@keyframes message-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-content p {
  margin: 0 0 8px 0;
}

.message-content p:last-child {
  margin-bottom: 0;
}

.message-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.message-content.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  min-width: 60px;
  background-color: rgba(242, 242, 247, 0.8); /* 半透明背景 */
  backdrop-filter: blur(8px); /* iOS毛玻璃效果 */
  -webkit-backdrop-filter: blur(8px); /* Safari支持 */
}

/* 增强iOS风格加载动画 */
.loading .dot {
  width: 8px;
  height: 8px;
  background-color: #8E8E93; /* iOS灰色 */
  border-radius: 50%;
  margin: 0 3px;
  opacity: 0.8;
  animation: ios-bounce 1.4s infinite ease-in-out both;
}

.loading .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes ios-bounce {
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
  margin: 0 16px 16px;
}

.quick-reply-item {
  background-color: #F2F2F7; /* iOS浅灰色 */
  color: #007AFF; /* iOS蓝色 */
  border-radius: 16px;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.quick-reply-item:active {
  background-color: #E5E5EA; /* iOS按下状态颜色 */
  transform: scale(0.98);
}

.chat-input {
  display: flex;
  align-items: flex-end;
  background-color: #F2F2F7; /* iOS浅灰色 */
  border-radius: 24px;
  padding: 8px 12px;
  margin: 8px 16px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(60, 60, 67, 0.1); /* iOS边框 */
}

.chat-input textarea {
  flex: 1;
  height: 24px;
  max-height: 120px;
  border: none;
  background: transparent;
  resize: none;
  font-size: 16px; /* iOS标准字体大小 */
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; /* iOS字体 */
  padding: 4px 8px;
  outline: none;
  color: #000;
  line-height: 1.4;
}

.chat-input textarea::placeholder {
  color: #8E8E93; /* iOS占位符颜色 */
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #007AFF; /* iOS蓝色 */
  border: none;
  color: white;
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.2s;
}

.send-button:active {
  transform: scale(0.95);
  background-color: #0066CC; /* 按下状态颜色 */
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 添加iOS风格过渡动画 */
.ai-avatar svg {
  transition: all 0.3s ease;
}

.ai-avatar:active svg {
  transform: scale(0.92);
}
</style>