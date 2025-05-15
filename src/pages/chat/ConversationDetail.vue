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
    
    <!-- 快捷用语区域 -->
    <div v-if="showQuickReplies" class="quick-replies-container">
      <div class="quick-replies-header">
        <span>常用回复</span>
        <van-icon name="cross" @click="toggleQuickReplies" />
      </div>
      <div class="quick-replies-list">
        <div 
          v-for="(reply, index) in quickReplies" 
          :key="index" 
          class="quick-reply-item"
          @click="sendQuickReply(reply)"
        >
          {{ reply }}
        </div>
      </div>
    </div>
    
    <!-- 输入框 -->
    <div class="input-wrapper">
      <div v-if="!showQuickReplies" class="quick-reply-button" @click="toggleQuickReplies">
        <van-icon name="comment-o" />
        <span>快捷回复</span>
      </div>
      <chat-input
        :loading-image="loadingImage"
        :loading-voice="loadingVoice"
        @send-text="sendTextMessage"
        @send-image="sendImageMessage"
        @send-voice="sendVoiceMessage"
        @send-location="sendLocationMessage"
        @send-product="sendProductMessage"
        @send-emoji="sendEmojiMessage"
      />
    </div>
    
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
import {
  clearMessages as apiClearMessages,
  deleteMessage as apiDeleteMessage,
  sendImageMessage as apiSendImage,
  sendTextMessage as apiSendText,
  getChatLog,
  getConversationDetail,
  markAsRead
} from "@/api/im";
import ChatInput from "@/components/im/ChatInput.vue";
import MessageList from "@/components/im/MessageList.vue";
import { useIntervalFn } from "@vueuse/core";
import { closeToast, showLoadingToast, showToast } from "vant";
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const conversationId = computed(() => {
  const id = route.params.id;
  return id ? (route.params.id + "") : ""; // 确保转换为字符串且不为undefined
});
const targetUserName = computed(() => route.query.name || "会话");
const currentUserId = 1; // 假设当前用户ID为1

// 状态
const loading = ref(false);
const loadingImage = ref(false);
const loadingVoice = ref(false);
const hasMore = ref(true);
const page = ref(1);
const messages = ref([]);
const conversation = ref(null);
const messageListRef = ref(null);
const messageToDelete = ref(null);
const showActions = ref(false);
const showDeleteDialog = ref(false);
const showClearDialog = ref(false);
const showQuickReplies = ref(false);
const quickReplies = ref([]);
const isKeyboardVisible = ref(false);

// 操作菜单配置
const actions = [
  { name: "清空聊天记录", color: "#ff3b30" }
];

// 导航返回
const onClickLeft = () => {
  router.back();
};

// 监听键盘显示/隐藏事件
const setupKeyboardEvents = () => {
  // 在移动设备上，可以通过窗口大小变化来检测键盘显示/隐藏
  const handleResize = () => {
    const windowHeight = window.innerHeight;
    // 窗口高度明显减少时，可能是键盘弹出
    if (windowHeight < window.outerHeight * 0.8) {
      isKeyboardVisible.value = true;
      // 键盘弹出时隐藏快捷用语
      showQuickReplies.value = false;
    } else {
      isKeyboardVisible.value = false;
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  // 清理函数
  return () => {
    window.removeEventListener('resize', handleResize);
  };
};

// 切换快捷用语显示状态
const toggleQuickReplies = () => {
  showQuickReplies.value = !showQuickReplies.value;
  
  // 如果快捷用语被打开，滚动到页面底部
  if (showQuickReplies.value) {
    nextTick(() => {
      messageListRef.value?.scrollToBottom();
    });
  }
};

// 加载会话详情
const fetchConversation = async () => {
  if (!conversationId.value) {
    console.error("会话ID无效");
    showToast("无效的会话ID");
    return;
  }
  
  loading.value = true;
  try {
    const response = await getConversationDetail(conversationId.value);
    if (response.code === 200) {
      conversation.value = response.data;
      
      // 标记消息为已读
      await markAsRead(conversationId.value);
    } else {
      showToast(response.message || "获取会话失败");
    }
  } catch (error) {
    console.error("获取会话失败:", error);
    showToast("网络错误，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 加载消息历史
const fetchMessages = async (isLoadMore = false) => {
  if (loading.value || !conversationId.value) return;
  
  loading.value = true;
  try {
    const response = await getChatLog({
      conversationId: conversationId.value,
      page: page.value,
      limit: 20
    });
    
    if (response.code === 200) {
      const { list, hasMore: more } = response.data;
      
      if (isLoadMore) {
        // 合并消息，避免重复
        const messageIds = new Set(messages.value.map(m => m.id));
        const newMessages = list.filter(m => !messageIds.has(m.id));
        messages.value = [...newMessages, ...messages.value];
      } else {
        messages.value = list;
      }
      
      hasMore.value = more;
      
      // 消息已加载，标记为已读
      await markAsRead(conversationId.value);
    } else {
      showToast(response.message || "获取消息失败");
    }
  } catch (error) {
    console.error("获取消息失败:", error);
    showToast("网络错误，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 加载更早的消息
const loadEarlierMessages = () => {
  if (loading.value || !hasMore.value) return;
  
  page.value++;
  fetchMessages(true);
};

// 发送文本消息
const sendTextMessage = async (content) => {
  if (!conversationId.value) {
    showToast("无效的会话");
    return;
  }
  
  try {
    // 先添加一条本地消息
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      conversationId: conversationId.value,
      senderId: currentUserId,
      receiverId: conversation.value?.targetInfo?.id,
      type: "text",
      content,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      isRead: false,
      status: "sending"
    };
    
    messages.value = [...messages.value, tempMessage];
    
    // 滚动到底部
    nextTick(() => {
      messageListRef.value?.scrollToBottom();
    });
    
    // 发送消息
    const response = await apiSendText(conversationId.value, content);
    
    if (response.code === 200) {
      // 用服务器返回的消息替换临时消息
      const index = messages.value.findIndex(m => m.id === tempId);
      if (index !== -1) {
        messages.value.splice(index, 1, response.data);
      }
    } else {
      // 更新临时消息状态为失败
      const index = messages.value.findIndex(m => m.id === tempId);
      if (index !== -1) {
        messages.value[index].status = "failed";
      }
      
      showToast(response.message || "发送失败");
    }
  } catch (error) {
    console.error("发送消息失败:", error);
    showToast("网络错误，请稍后重试");
  }
};

// 发送图片消息
const sendImageMessage = async (file) => {
  if (!conversationId.value) {
    showToast("无效的会话");
    return;
  }
  
  loadingImage.value = true;
  try {
    // 先添加一条本地消息
    const tempId = `temp_${Date.now()}`;
    const tempUrl = URL.createObjectURL(file);
    
    const tempMessage = {
      id: tempId,
      conversationId: conversationId.value,
      senderId: currentUserId,
      receiverId: conversation.value?.targetInfo?.id,
      type: "image",
      content: tempUrl,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      isRead: false,
      status: "sending"
    };
    
    messages.value = [...messages.value, tempMessage];
    
    // 滚动到底部
    nextTick(() => {
      messageListRef.value?.scrollToBottom();
    });
    
    // 发送图片
    const response = await apiSendImage(conversationId.value, file);
    
    if (response.code === 200) {
      // 用服务器返回的消息替换临时消息
      const index = messages.value.findIndex(m => m.id === tempId);
      if (index !== -1) {
        messages.value.splice(index, 1, response.data);
      }
    } else {
      // 更新临时消息状态为失败
      const index = messages.value.findIndex(m => m.id === tempId);
      if (index !== -1) {
        messages.value[index].status = "failed";
      }
      
      showToast(response.message || "发送失败");
    }
  } catch (error) {
    console.error("发送图片失败:", error);
    showToast("网络错误，请稍后重试");
  } finally {
    loadingImage.value = false;
  }
};

// 发送语音消息
const sendVoiceMessage = async (voiceData) => {
  if (!conversationId.value) {
    showToast("无效的会话");
    return;
  }
  
  loadingVoice.value = true;
  try {
    // 此处应该处理实际的语音文件
    const { duration, file } = voiceData;
    
    // 模拟语音发送
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      conversationId: conversationId.value,
      senderId: currentUserId,
      receiverId: conversation.value?.targetInfo?.id,
      type: "voice",
      content: "https://example.com/audio/temp.mp3",
      duration,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      isRead: false,
      status: "sending"
    };
    
    messages.value = [...messages.value, tempMessage];
    
    // 滚动到底部
    nextTick(() => {
      messageListRef.value?.scrollToBottom();
    });
    
    // 模拟API延迟
    setTimeout(() => {
      // 更新为成功状态
      const index = messages.value.findIndex(m => m.id === tempId);
      if (index !== -1) {
        messages.value[index].status = "sent";
      }
      
      loadingVoice.value = false;
    }, 1000);
  } catch (error) {
    console.error("发送语音失败:", error);
    showToast("发送语音失败，请重试");
    loadingVoice.value = false;
  }
};

// 发送位置消息
const sendLocationMessage = async () => {
  try {
    // 实现位置消息发送逻辑
    showToast("位置发送功能即将上线");
  } catch (error) {
    console.error("发送位置失败:", error);
    showToast("发送位置失败");
  }
};

// 发送商品消息
const sendProductMessage = async (product) => {
  try {
    // 实现商品消息发送逻辑
    showToast("商品发送功能即将上线");
  } catch (error) {
    console.error("发送商品失败:", error);
    showToast("发送商品失败");
  }
};

// 发送表情消息
const sendEmojiMessage = async (emoji) => {
  try {
    // 实现表情消息发送逻辑
    showToast("表情发送功能即将上线");
  } catch (error) {
    console.error("发送表情失败:", error);
    showToast("发送表情失败");
  }
};

// 重试发送消息
const retryMessage = (message) => {
  if (message.type === "text") {
    sendTextMessage(message.content);
  } else if (message.type === "image") {
    // 重试需要原始文件，这里只是示例
    showToast("请重新选择图片");
  } else if (message.type === "voice") {
    // 重试需要原始录音，这里只是示例
    showToast("请重新录制语音");
  }
  
  // 移除失败的消息
  const index = messages.value.findIndex(m => m.id === message.id);
  if (index !== -1) {
    messages.value.splice(index, 1);
  }
};

// 显示删除确认弹窗
const showDeleteConfirm = (message) => {
  messageToDelete.value = message;
  showDeleteDialog.value = true;
};

// 确认删除消息
const confirmDeleteMessage = async () => {
  if (!messageToDelete.value) return;
  
  const loadingToast = showLoadingToast({
    message: "删除中...",
    forbidClick: true
  });
  
  try {
    const response = await apiDeleteMessage(
      conversationId.value,
      messageToDelete.value.id
    );
    
    if (response.code === 200) {
      // 从本地删除消息
      const index = messages.value.findIndex(m => m.id === messageToDelete.value.id);
      if (index !== -1) {
        messages.value.splice(index, 1);
      }
      
      showToast("删除成功");
    } else {
      showToast(response.message || "删除失败");
    }
  } catch (error) {
    console.error("删除消息失败:", error);
    showToast("网络错误，请稍后重试");
  } finally {
    closeToast(loadingToast);
    messageToDelete.value = null;
  }
};

// 选择操作
const onSelectAction = (action) => {
  if (action.name === "清空聊天记录") {
    showClearDialog.value = true;
  }
};

// 确认清空消息
const confirmClearMessages = async () => {
  const loadingToast = showLoadingToast({
    message: "清空中...",
    forbidClick: true
  });
  
  try {
    const response = await apiClearMessages(conversationId.value);
    
    if (response.code === 200) {
      messages.value = [];
      showToast("清空成功");
    } else {
      showToast(response.message || "清空失败");
    }
  } catch (error) {
    console.error("清空消息失败:", error);
    showToast("网络错误，请稍后重试");
  } finally {
    closeToast(loadingToast);
  }
};

// 定时刷新消息
const { pause: pauseRefresh } = useIntervalFn(() => {
  // 获取最新消息
  if (conversationId.value) {
    fetchMessages();
  }
}, 10000);

// 初始化快捷用语数据
const initQuickReplies = () => {
  // 基础快捷用语 - 所有场景通用
  const baseReplies = [
    "你好！请问还在吗？",
    "好的，没问题",
    "稍等一下",
    "已收到，谢谢"
  ];
  
  // 根据会话类型设置不同的快捷用语
  if (conversation.value?.targetInfo?.type === 'merchant' || conversation.value?.targetInfo?.isSeller) {
    // 和卖家聊天的快捷用语 - 校园交易场景
    quickReplies.value = [
      ...baseReplies,
      "您好，这个商品还有库存吗？",
      "可以便宜一点吗？我是学生党",
      "什么时候方便交易呢？",
      "可以在哪个教学楼或宿舍附近交易？",
      "能发一下商品的实物照片吗？",
      "有什么优惠活动吗？",
      "可以预留到明天下课后吗？",
      "可以帮我送货到宿舍吗？",
      "请问商品的使用情况怎么样？",
      "可以当面验货吗？"
    ];
  } else if (conversation.value?.targetInfo?.type === 'buyer' || conversation.value?.targetInfo?.isBuyer) {
    // 和买家聊天的快捷用语
    quickReplies.value = [
      ...baseReplies,
      "商品还在售，随时可以交易",
      "可以，这个价格可以接受",
      "需要送货上门吗？",
      "我有空的时间是：上午10点-12点，下午2点-5点",
      "我在图书馆/食堂/宿舍区附近，你选个地方吧",
      "已经为您预留了，什么时候方便取货？",
      "我的微信/支付宝是：（填写后发送）",
      "你在哪个宿舍楼？我可以送过去",
      "这个商品情况很好，放心购买"
    ];
  } else {
    // 普通聊天的快捷用语
    quickReplies.value = [
      ...baseReplies,
      "在吗？有空聊聊吗",
      "晚点联系你",
      "谢谢你的帮助！",
      "下午有空吗？",
      "要不要一起去吃饭？",
      "你在哪个区/宿舍？",
      "需要帮忙吗？",
      "周末有什么计划？",
      "考试准备得怎么样了？"
    ];
  }
};

// 发送快捷用语
const sendQuickReply = (content) => {
  sendTextMessage(content);
  showToast({
    message: "已发送",
    icon: "success",
    position: "bottom"
  });
  showQuickReplies.value = false;
};

// 组件挂载
onMounted(async () => {
  // 设置键盘事件监听
  const cleanupKeyboardEvents = setupKeyboardEvents();
  
  // 加载会话详情和初始消息
  if (conversationId.value) {
    await fetchConversation();
    await fetchMessages();
    
    // 初始化快捷用语
    initQuickReplies();
    
    // 标记为已读
    try {
      await markAsRead(conversationId.value);
    } catch (error) {
      console.error("标记已读失败:", error);
    }
  } else {
    console.warn("无效的会话ID, 无法加载会话");
    showToast("无效的会话ID");
    setTimeout(() => router.push("/im/conversations"), 1500);
  }
  
  // 组件卸载时清理事件
  onUnmounted(() => {
    pauseRefresh();
    cleanupKeyboardEvents();
  });
});
</script>

<style scoped>
.conversation-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  position: relative;
}

.message-list {
  flex: 1;
  overflow: hidden;
  padding-bottom: 60px; /* 为输入框留出空间 */
}

.quick-replies-container {
  position: fixed;
  bottom: 60px; /* 输入框的高度 */
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 40vh;
  overflow-y: auto;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.quick-replies-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #333;
  font-weight: 500;
  font-size: 15px;
}

.quick-replies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-reply-item {
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 16px;
  font-size: 14px;
  color: #0369a1;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.quick-reply-item:active {
  background-color: #e0f2fe;
  transform: scale(0.98);
}

.input-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 11;
}

.quick-reply-button {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 6px 10px;
  background-color: #f0f9ff;
  border-radius: 16px;
  color: #0369a1;
  font-size: 14px;
  width: fit-content;
  cursor: pointer;
}

.quick-reply-button .van-icon {
  margin-right: 4px;
  font-size: 16px;
}
</style>