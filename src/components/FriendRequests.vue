<template>
  <div class="friend-requests">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#1989fa" />
      <span class="loading-text">加载中...</span>
    </div>
    
    <!-- 空状态 -->
    <van-empty 
      v-else-if="requests.length === 0" 
      description="暂无好友申请" 
      image="search"
    />
    
    <!-- 申请列表 -->
    <div v-else class="requests-container">
      <van-cell-group title="好友申请">
        <van-swipe-cell
          v-for="request in requests"
          :key="request.id"
          :disabled="isBusy(request.id)"
        >
          <van-cell :border="false">
            <template #icon>
              <div class="request-avatar">
                <van-image
                  round
                  width="40"
                  height="40"
                  :src="request.avatar"
                  fit="cover"
                >
                  <template #error>
                    <div class="avatar-fallback">{{ getInitials(request.name || request.nickname) }}</div>
                  </template>
                </van-image>
              </div>
            </template>
            
            <template #title>
              <div class="request-info">
                <div class="request-name">{{ request.name || request.nickname }}</div>
                <div class="request-message">{{ request.message || '请求添加您为好友' }}</div>
                
                <!-- 未处理状态显示操作按钮 -->
                <div v-if="request.status === 0" class="request-actions">
                  <van-button 
                    size="small" 
                    round 
                    type="primary" 
                    class="action-btn accept-btn"
                    :loading="isProcessing(request.id, 'accept')"
                    @click="handleRequest(request, 1)"
                  >
                    接受
                  </van-button>
                  <van-button 
                    size="small" 
                    round 
                    type="default"
                    class="action-btn reject-btn"
                    :loading="isProcessing(request.id, 'reject')"
                    @click="handleRequest(request, 2)"
                  >
                    拒绝
                  </van-button>
                </div>
                
                <!-- 已处理状态显示结果 -->
                <div v-else class="request-status">
                  <span v-if="request.status === 1" class="status-accepted">已接受</span>
                  <span v-else-if="request.status === 2" class="status-rejected">已拒绝</span>
                </div>
              </div>
            </template>
            
            <template #default>
              <div class="request-time">{{ formatTime(request.createdAt) }}</div>
            </template>
          </van-cell>
          
          <template #right v-if="request.status === 0">
            <van-button square type="primary" text="接受" @click="handleRequest(request, 1)" />
            <van-button square type="danger" text="拒绝" @click="handleRequest(request, 2)" />
          </template>
        </van-swipe-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { handleFriendRequest } from '@/api/social';
import dayjs from 'dayjs';
import { showToast } from 'vant';
import { ref } from 'vue';

const props = defineProps({
  requests: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['request-handled']);

// 处理中的请求状态
const processingRequests = ref({});

// 检查是否正在处理某个请求
const isProcessing = (requestId, action) => {
  return processingRequests.value[requestId]?.processing && 
         processingRequests.value[requestId]?.action === action;
};

// 检查是否繁忙（任何操作正在进行中）
const isBusy = (requestId) => {
  return processingRequests.value[requestId]?.processing;
};

// 处理好友申请
const handleRequest = async (request, status) => {
  if (isBusy(request.id)) return;
  
  const action = status === 1 ? 'accept' : 'reject';
  
  // 设置处理状态
  processingRequests.value[request.id] = {
    processing: true,
    action
  };
  
  try {
    const response = await handleFriendRequest({
      putInId: request.id,
      status
    });
    
    if (response.code === 200) {
      showToast(status === 1 ? '已接受请求' : '已拒绝请求');
      
      // 更新本地状态
      emit('request-handled', {
        requestId: request.id,
        status,
        success: true
      });
    } else {
      showToast(response.message || '操作失败，请重试');
      emit('request-handled', {
        requestId: request.id,
        status,
        success: false
      });
    }
  } catch (error) {
    console.error('处理好友申请失败:', error);
    showToast('网络错误，请重试');
    emit('request-handled', {
      requestId: request.id,
      status,
      success: false
    });
  } finally {
    // 清除处理状态
    processingRequests.value[request.id] = {
      processing: false,
      action: null
    };
  }
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  
  const date = dayjs(time);
  const now = dayjs();
  
  if (date.isSame(now, 'day')) {
    return date.format('HH:mm');
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天';
  } else if (date.isSame(now, 'year')) {
    return date.format('MM-DD');
  } else {
    return date.format('YYYY-MM-DD');
  }
};

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};
</script>

<style scoped>
.friend-requests {
  background-color: #f7f8fa;
  height: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 30px 0;
}

.loading-text {
  margin-top: 10px;
  color: #969799;
  font-size: 14px;
}

.requests-container {
  padding-bottom: 20px;
}

.request-avatar {
  margin-right: 12px;
}

.avatar-fallback {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1989fa;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-radius: 50%;
}

.request-info {
  flex: 1;
}

.request-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.request-message {
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}

.request-time {
  font-size: 12px;
  color: #969799;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 0 12px;
  height: 24px;
  font-size: 12px;
}

.request-status {
  font-size: 12px;
}

.status-accepted {
  color: #07c160;
}

.status-rejected {
  color: #969799;
}
</style> 