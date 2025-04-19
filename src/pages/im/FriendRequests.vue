<template>
  <div class="friend-requests-page">
    <van-nav-bar
      title="好友请求"
      left-arrow
      @click-left="router.back()"
      fixed
    />
    
    <!-- 过滤选项卡 -->
    <div class="filter-tabs">
      <div 
        class="filter-tab" 
        :class="{ active: currentFilter === 'all' }"
        @click="currentFilter = 'all'; watchFilter();"
      >
        全部
      </div>
      <div 
        class="filter-tab" 
        :class="{ active: currentFilter === 'pending' }"
        @click="currentFilter = 'pending'; watchFilter();"
      >
        待处理
      </div>
      <div 
        class="filter-tab" 
        :class="{ active: currentFilter === 'accepted' }"
        @click="currentFilter = 'accepted'; watchFilter();"
      >
        已接受
      </div>
      <div 
        class="filter-tab" 
        :class="{ active: currentFilter === 'rejected' }"
        @click="currentFilter = 'rejected'; watchFilter();"
      >
        已拒绝
      </div>
    </div>
    
    <!-- 加载中 -->
    <div class="loading-container" v-if="loading">
      <van-loading type="spinner" color="#1989fa" size="24px">加载中...</van-loading>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="filteredRequests.length === 0" class="empty-state-container">
      <EmptyState 
        :image="require('@/assets/images/empty-state.png')" 
        :description="
          currentFilter === 'all' ? '暂无好友请求' : 
          currentFilter === 'pending' ? '暂无待处理的请求' : 
          currentFilter === 'accepted' ? '暂无已接受的请求' : '暂无已拒绝的请求'
        "
      />
    </div>
    
    <!-- 请求列表 -->
    <div class="requests-list" v-else>
      <div 
        v-for="request in filteredRequests" 
        :key="request.id" 
        class="request-item"
      >
        <!-- 头像区域 -->
        <div class="user-avatar" @click="viewUserProfile(request.userId)">
          <img 
            v-if="request.avatar" 
            :src="request.avatar" 
            :alt="request.name"
          />
          <div v-else class="avatar-placeholder">
            {{ getInitials(request.name) }}
          </div>
        </div>
        
        <!-- 信息区域 -->
        <div class="request-info">
          <div class="user-name" @click="viewUserProfile(request.userId)">
            {{ request.name }}
            <span class="user-id">(ID: {{ request.userId }})</span>
          </div>
          <div class="request-message">
            {{ request.message }}
          </div>
          <div class="request-time">
            {{ request.time }}
          </div>
          
          <!-- 待处理请求的操作按钮 -->
          <div class="request-actions" v-if="request.status === 'pending'">
            <van-button 
              type="primary" 
              size="small" 
              :loading="acceptingId === request.id"
              @click="handleRequest(request.id, 'accept')"
            >
              接受
            </van-button>
            <van-button 
              type="default" 
              size="small"
              :loading="rejectingId === request.id"
              @click="handleRequest(request.id, 'reject')"
            >
              拒绝
            </van-button>
          </div>
          
          <!-- 已处理请求的状态显示 -->
          <div class="request-status" v-else>
            <van-tag 
              :type="request.status === 'accepted' ? 'success' : 'danger'"
            >
              {{ request.status === 'accepted' ? '已接受' : '已拒绝' }}
            </van-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getFriendRequests, respondFriendRequest } from '@/api/social';
import EmptyState from '@/components/EmptyState.vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { closeToast, showLoadingToast, showSuccessToast, showToast } from 'vant';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const router = useRouter();
const loading = ref(true);
const requests = ref([]);
const acceptingId = ref(null);
const rejectingId = ref(null);
const currentFilter = ref('all');
const filteredRequests = computed(() => {
  if (currentFilter.value === 'all') {
    return requests.value;
  }
  return requests.value.filter(request => request.status === currentFilter.value);
});

// 处理用户ID可能包含的Unicode控制字符
function parseUserId(userId) {
  if (!userId) return '';
  
  // 检查是否包含控制字符
  const hasControlChars = /[\u0000-\u001F\u007F-\u009F]/.test(userId);
  
  if (hasControlChars) {
    console.log('Found control character in userId:', userId);
    // 将控制字符转换为其字符代码
    return Array.from(userId).map(char => {
      const code = char.charCodeAt(0);
      if (code <= 0x1F || (code >= 0x7F && code <= 0x9F)) {
        return code.toString();
      }
      return char;
    }).join('');
  }
  
  return userId;
}

// 获取姓名首字母作为头像占位符
function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

// 加载好友请求列表
async function loadRequests() {
  loading.value = true;
  try {
    const response = await getFriendRequests();
    console.log('Friend requests response:', response);
    
    if (response.code === 0 && response.data) {
      requests.value = response.data.map(request => {
        const userId = parseUserId(request.user_id);
        console.log('Original user_id:', request.user_id, 'Parsed userId:', userId);
        
        return {
          id: request.id,
          userId: userId,
          name: request.user_name || `用户${userId}`,
          avatar: request.user_avatar || '',
          message: request.req_msg || '请求添加您为好友',
          time: dayjs(request.req_time * 1000).fromNow(),
          reqTime: request.req_time,
          status: request.handle_result === 0 ? 'pending' : 
                  request.handle_result === 1 ? 'accepted' : 'rejected',
          handleResult: request.handle_result,
          handleTime: request.handle_time,
          handleMsg: request.handle_msg
        };
      });
      
      // 打印处理后的请求数据
      console.log('Processed requests:', requests.value);
    } else {
      showToast({
        message: response.msg || '获取好友请求失败',
        type: 'fail'
      });
    }
  } catch (error) {
    console.error('加载好友请求出错:', error);
    showToast({
      message: '网络错误，请稍后重试',
      type: 'fail'
    });
  } finally {
    loading.value = false;
  }
}

// 处理好友请求（接受或拒绝）
async function handleRequest(requestId, action) {
  if (action === 'accept') {
    acceptingId.value = requestId;
  } else {
    rejectingId.value = requestId;
  }
  
  const loading = showLoadingToast({
    message: action === 'accept' ? '正在接受请求...' : '正在拒绝请求...',
    forbidClick: true,
  });
  
  try {
    const response = await respondFriendRequest({
      id: requestId,
      handle_result: action === 'accept' ? 1 : 2,
      handle_msg: action === 'accept' ? '已接受' : '已拒绝'
    });
    
    closeToast();
    
    if (response.code === 0) {
      showSuccessToast(action === 'accept' ? '已接受好友请求' : '已拒绝好友请求');
      
      // 更新本地列表
      const index = requests.value.findIndex(req => req.id === requestId);
      if (index !== -1) {
        requests.value[index].status = action === 'accept' ? 'accepted' : 'rejected';
        requests.value[index].handleResult = action === 'accept' ? 1 : 2;
        requests.value[index].handleTime = Math.floor(Date.now() / 1000);
        requests.value[index].handleMsg = action === 'accept' ? '已接受' : '已拒绝';
      }
    } else {
      showToast({
        message: response.msg || `${action === 'accept' ? '接受' : '拒绝'}请求失败`,
        type: 'fail'
      });
    }
  } catch (error) {
    closeToast();
    console.error(`处理好友请求出错 (${action}):`, error);
    showToast({
      message: '网络错误，请稍后重试',
      type: 'fail'
    });
  } finally {
    if (action === 'accept') {
      acceptingId.value = null;
    } else {
      rejectingId.value = null;
    }
  }
}

// 查看用户资料
function viewUserProfile(userId) {
  if (!userId) return;
  router.push(`/user/${userId}`);
}

// 监听过滤器变化
function watchFilter() {
  console.log('Filter changed to:', currentFilter.value);
  // 可以在这里添加额外逻辑，例如分析筛选结果
}

// 页面加载时获取好友请求
onMounted(() => {
  loadRequests();
});
</script>

<style scoped>
.friend-requests-page {
  padding: 46px 0 20px;
  height: 100vh;
  box-sizing: border-box;
  background-color: #f7f8fa;
}

.filter-tabs {
  display: flex;
  padding: 10px 15px;
  background-color: white;
  margin-bottom: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: #646566;
  position: relative;
  cursor: pointer;
}

.filter-tab.active {
  color: #1989fa;
  font-weight: 500;
}

.filter-tab.active:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 2px;
  background-color: #1989fa;
  transform: translateX(-50%);
}

.loading-container,
.empty-state-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.requests-list {
  padding: 0 16px;
}

.request-item {
  display: flex;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background-color: #1989fa;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
}

.request-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.user-id {
  font-size: 12px;
  color: #969799;
  margin-left: 6px;
  font-weight: normal;
}

.request-message {
  font-size: 14px;
  color: #323233;
  margin-bottom: 8px;
  word-break: break-word;
}

.request-time {
  font-size: 12px;
  color: #969799;
  margin-bottom: 12px;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.request-status {
  margin-top: 4px;
}
</style>