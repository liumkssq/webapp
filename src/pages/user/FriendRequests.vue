<template>
  <div class="friend-requests-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="好友请求"
      left-arrow
      @click-left="router.back()"
    />
    
    <!-- 请求列表 -->
    <div class="content">
      <friend-request-list
        :requests="friendRequests"
        :loading="loading"
        @handle-request="handleFriendRequest"
      />
    </div>
  </div>
</template>

<script setup>
import { handleFriendRequest as apiHandleRequest, getFriendRequests } from '@/api/user';
import FriendRequestList from '@/components/FriendRequestList.vue';
import { showToast } from 'vant';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);
const friendRequests = ref([]);

// 获取好友请求列表
const fetchFriendRequests = async () => {
  loading.value = true;
  
  try {
    const res = await getFriendRequests();
    
    if (res.code === 0 && res.data) {
      friendRequests.value = res.data;
    } else {
      showToast({
        type: 'fail',
        message: res.message || '获取好友请求失败'
      });
    }
  } catch (error) {
    console.error('获取好友请求失败:', error);
    showToast({
      type: 'fail',
      message: '网络异常，请稍后重试'
    });
  } finally {
    loading.value = false;
  }
};

// 处理好友请求
const handleFriendRequest = async ({ requestId, action }) => {
  try {
    const res = await apiHandleRequest({
      requestId,
      action
    });
    
    if (res.code === 0) {
      // 更新当前列表中的请求状态
      const index = friendRequests.value.findIndex(req => req.id === requestId);
      
      if (index !== -1) {
        friendRequests.value[index] = {
          ...friendRequests.value[index],
          handled: true,
          status: action === 'accept' ? 'accepted' : 'rejected'
        };
      }
      
      return true;
    } else {
      throw new Error(res.message || '操作失败');
    }
  } catch (error) {
    console.error('处理好友请求失败:', error);
    showToast({
      type: 'fail',
      message: error.message || '网络异常，请稍后重试'
    });
    throw error;
  }
};

// 初始化页面
onMounted(() => {
  fetchFriendRequests();
});
</script>

<style scoped>
.friend-requests-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f8fa;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}
</style> 