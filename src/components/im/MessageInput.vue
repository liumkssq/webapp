<template>
  <div class="message-input">
    <!-- 输入工具栏 -->
    <div class="input-toolbar">
      <van-icon name="smile-o" size="24px" @click="toggleEmoji" />
      <van-icon name="photo-o" size="24px" @click="selectImage" />
      <van-icon name="plus" size="24px" @click="showMoreActions = true" />
    </div>
    
    <!-- 文本输入区域 -->
    <div class="input-wrapper">
      <van-field
        v-model="inputValue"
        placeholder="输入消息..."
        type="textarea"
        class="message-field"
        :rows="1"
        autosize
        :disabled="disabled"
        @keypress.enter.prevent="handleEnterPress"
        @focus="onFocus"
        ref="inputRef"
      />
    </div>
    
    <!-- 发送按钮 -->
    <div class="send-button">
      <van-button 
        round 
        type="primary" 
        size="small" 
        @click="sendMessage" 
        :disabled="!canSend"
      >
        发送
      </van-button>
    </div>
    
    <!-- 表情选择器弹出层 -->
    <van-popup
      v-model:show="showEmoji"
      position="bottom"
      :style="{ height: '30%' }"
      round
    >
      <div class="emoji-container">
        <div 
          v-for="emoji in emojiList" 
          :key="emoji" 
          class="emoji-item" 
          @click="insertEmoji(emoji)"
        >
          {{ emoji }}
        </div>
      </div>
    </van-popup>
    
    <!-- 更多功能弹出层 -->
    <van-action-sheet
      v-model:show="showMoreActions"
      :actions="moreActions"
      cancel-text="取消"
      @select="handleAction"
    />
    
    <!-- 隐藏的文件输入 -->
    <input 
      type="file" 
      ref="fileInput" 
      style="display: none" 
      @change="handleFileSelected"
      accept="image/*"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:value', 'send', 'send-image', 'send-file', 'send-location', 'recording-start', 'recording-stop', 'recording-cancel']);

// 内部状态
const inputValue = ref(props.value);
const inputRef = ref(null);
const fileInput = ref(null);
const showEmoji = ref(false);
const showMoreActions = ref(false);

// 监听value属性变化
watch(() => props.value, (newValue) => {
  inputValue.value = newValue;
});

// 监听inputValue变化并向父组件发出更新事件
watch(inputValue, (newValue) => {
  emit('update:value', newValue);
});

// 是否可以发送消息
const canSend = computed(() => {
  return inputValue.value.trim().length > 0;
});

// 更多操作按钮列表
const moreActions = [
  { name: '图片', icon: 'photo-o' },
  { name: '拍照', icon: 'photograph' },
  { name: '文件', icon: 'description' },
  { name: '位置', icon: 'location-o' },
  { name: '语音通话', icon: 'phone-o' },
  { name: '视频通话', icon: 'video' }
];

// 表情列表
const emojiList = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
  '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗',
  '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥',
  '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜',
  '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️',
  '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨',
  '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵',
  '🥴', '😠', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧'
];

// 处理回车键按下事件
const handleEnterPress = (event) => {
  // 检查是否按住了shift键
  if (event.shiftKey) {
    // Shift+Enter，插入换行符
    return;
  }
  
  // Enter键直接发送消息
  sendMessage();
};

// 发送文本消息
const sendMessage = () => {
  if (!canSend.value) return;
  
  emit('send', inputValue.value);
  inputValue.value = '';
};

// 切换表情选择器
const toggleEmoji = () => {
  showEmoji.value = !showEmoji.value;
};

// 插入表情
const insertEmoji = (emoji) => {
  inputValue.value += emoji;
  
  // 聚焦回输入框
  if (inputRef.value) {
    inputRef.value.focus();
  }
};

// 打开文件选择
const selectImage = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const handleFileSelected = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  emit('send-image', file);
  
  // 清空文件选择器，以便于下次选择相同文件时也能触发change事件
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 处理更多操作
const handleAction = (action) => {
  switch (action.name) {
    case '图片':
      selectImage();
      break;
    case '拍照':
      // TODO: 实现拍照功能
      break;
    case '文件':
      emit('send-file');
      break;
    case '位置':
      emit('send-location');
      break;
    case '语音通话':
      // TODO: 实现语音通话功能
      break;
    case '视频通话':
      // TODO: 实现视频通话功能
      break;
    default:
      break;
  }
};

// 输入框聚焦事件
const onFocus = () => {
  showEmoji.value = false;
};

// 对外暴露方法
defineExpose({
  focus: () => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  },
  clear: () => {
    inputValue.value = '';
  }
});
</script>

<style scoped>
.message-input {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #fff;
  border-top: 1px solid #eee;
  width: 100%;
}

.input-toolbar {
  display: flex;
  align-items: center;
}

.input-toolbar .van-icon {
  margin-right: 12px;
  color: #666;
  cursor: pointer;
}

.input-wrapper {
  flex: 1;
  margin: 0 8px;
}

.message-field {
  background-color: #f5f5f5;
  border-radius: 18px;
  padding: 5px 10px;
}

.send-button {
  margin-left: 8px;
}

.emoji-container {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  max-height: 100%;
  overflow-y: auto;
}

.emoji-item {
  width: 10%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
}

.emoji-item:hover {
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>