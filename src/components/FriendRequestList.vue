<template>
  <div class="friend-request-list">
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#1989fa" />
      <p class="loading-text">加载中...</p>
    </div>
    
    <!-- 无请求状态 -->
    <div v-else-if="requests.length === 0" class="empty-container">
      <van-empty
        image="search"
        description="暂无好友请求"
      />
    </div>
    
    <!-- 请求列表 -->
    <div v-else class="list-container">
      <van-cell-group title="收到的好友请求">
        <van-cell
          v-for="request in requests"
          :key="request.id"
          :title="request.fromUser.name || request.fromUser.nickname"
          :label="request.message || '想添加您为好友'"
          center
        >
          <!-- 发送请求用户头像 -->
          <template #icon>
            <div class="request-avatar">
              <van-image
                round
                fit="cover"
                :src="request.fromUser.avatar || '/img/default-avatar.png'"
                width="40"
                height="40"
              >
                <template #error>
                  <van-icon name="user-circle-o" size="40" />
                </template>
              </van-image>
            </div>
          </template>
          
          <!-- 时间信息 -->
          <template #label>
            <div>
              <p>{{ request.message || '想添加您为好友' }}</p>
              <p class="request-time">{{ formatTime(request.createdAt) }}</p>
            </div>
          </template>
          
          <!-- 操作按钮 -->
          <template #right-icon>
            <div class="request-actions" v-if="!request.handled">
              <van-button
                type="primary"
                size="small"
                @click="handleRequest(request.id, 'accept')"
                :loading="processingMap[request.id] === 'accept'"
                :disabled="!!processingMap[request.id]"
              >
                接受
              </van-button>
              <van-button
                type="default"
                size="small"
                @click="handleRequest(request.id, 'reject')"
                :loading="processingMap[request.id] === 'reject'"
                :disabled="!!processingMap[request.id]"
              >
                拒绝
              </van-button>
            </div>
            <div v-else class="request-status">
              <van-tag
                :type="request.status === 'accepted' ? 'success' : 'danger'"
                round
              >
                {{ request.status === 'accepted' ? '已接受' : '已拒绝' }}
              </van-tag>
            </div>
          </template>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { showToast } from 'vant';
import { ref } from 'vue';

// 设置 dayjs 本地化和插件
dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

// 定义组件属性
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

// 定义组件事件
const emit = defineEmits(['handle-request']);

// 跟踪每个请求的处理状态
const processingMap = ref({});

// 处理好友请求
const handleRequest = async (requestId, action) => {
  processingMap.value[requestId] = action;
  
  try {
    await emit('handle-request', { requestId, action });
    showToast({
      type: 'success',
      message: action === 'accept' ? '已添加为好友' : '已拒绝请求'
    });
  } catch (error) {
    console.error('处理好友请求失败:', error);
    showToast({
      type: 'fail',
      message: '操作失败，请重试'
    });
  } finally {
    processingMap.value[requestId] = null;
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = dayjs(timestamp);
  
  // 当天显示时间
  if (date.isAfter(dayjs().startOf('day'))) {
    return date.format('HH:mm');
  }
  
  // 昨天显示"昨天"
  if (date.isAfter(dayjs().subtract(1, 'day').startOf('day'))) {
    return '昨天 ' + date.format('HH:mm');
  }
  
  // 一周内显示星期几
  if (date.isAfter(dayjs().subtract(7, 'day'))) {
    return date.format('ddd HH:mm');
  }
  
  // 一年内显示月日
  if (date.isAfter(dayjs().subtract(1, 'year'))) {
    return date.format('MM-DD');
  }
  
  // 超过一年显示年月日
  return date.format('YYYY-MM-DD');
};
</script>

<style scoped>
.friend-request-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loading-container,
.empty-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.loading-text {
  margin-top: 12px;
  color: #999;
  font-size: 14px;
}

.list-container {
  flex: 1;
  overflow-y: auto;
}

.request-avatar {
  margin-right: 12px;
}

.request-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.request-status {
  display: flex;
  align-items: center;
}
</style> 