<template>
  <div class="my-lost-found-page">
    <header-nav title="我的失物招领" back/>

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" />
      <p>正在加载您的失物招领信息...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-message">加载失败: {{ error }}</p>
      <van-button plain type="primary" @click="fetchUserLostFoundItems" class="retry-button">重试</van-button>
    </div>

    <div v-else-if="items.length === 0" class="empty-container">
       <van-empty description="您还没有发布任何失物招领信息" />
      <router-link to="/publish/lost-found" class="publish-button">去发布</router-link>
    </div>

    <div v-else class="items-list">
      <!-- LostFoundCard Component -->
      <lost-found-card
        v-for="item in items"
        :key="item.id"
        :item="item"
        @edit="editItem(item.id)"
        @delete="confirmDeleteItem(item)"
        @toggle-status="toggleStatus(item)"
        :show-actions="true"
      />
    </div>

    <footer-nav />

  </div>
</template>

<script setup>
import { useUserStore } from '@/store/user';
import { closeToast, showDialog, showLoadingToast, showToast } from 'vant';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
// 修正API导入路径
import { deleteLostFound, getUserLostFound, updateLostFoundStatus } from '@/api/lostFound';

// Import UI components
import FooterNav from '@/components/FooterNav.vue';
import HeaderNav from '@/components/HeaderNav.vue';
import LostFoundCard from '@/components/cards/LostFoundCard.vue'; // Updated path

const router = useRouter();
const userStore = useUserStore();

const items = ref([]);
const loading = ref(true);
const error = ref(null);
const itemToDelete = ref(null);

onMounted(() => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录');
    router.replace('/login');
    loading.value = false;
    return;
  }
  fetchUserLostFoundItems();
});

const fetchUserLostFoundItems = async () => {
  loading.value = true;
  error.value = null;
  items.value = [];
  try {
    const userId = userStore.userInfo?.id;
    if (!userId) {
       await userStore.getUserInfo();
       if(!userStore.userInfo?.id) throw new Error('无法获取用户信息，请重新登录');
    }
    console.log(`Fetching lost/found items for user ID: ${userStore.userInfo.id}`);
    const response = await getUserLostFound(userStore.userInfo.id);
    console.log('getUserLostFound原始响应:', response);

    // 尝试处理不同的响应格式
    if (response) {
      // 直接提取列表数据
      const lostFoundList = response.list || response.data?.list || [];
      items.value = lostFoundList;
      console.log('用户失物招领列表:', items.value);
    } else {
      throw new Error(response?.message || '未能加载失物招领列表');
    }
  } catch (err) {
    console.error("获取用户失物招领失败:", err);
    error.value = err.message || '网络错误，请稍后重试';
    showToast(error.value);
    if (err.message.includes('登录') || err.status === 401) {
        userStore.clearUserInfo();
        router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath }});
    }
  } finally {
    loading.value = false;
  }
};

// Navigate to edit lost/found item page
const editItem = (itemId) => {
  router.push({ name: 'PublishLostFound', query: { edit: itemId } });
};

// Confirm before deleting a lost/found item
const confirmDeleteItem = (item) => {
  itemToDelete.value = item;
  showDialog({
    title: '删除失物招领',
    message: `确定要删除 "${item.title || '此条目'}" 吗？`,
    showCancelButton: true,
  }).then((result) => {
    console.log(`确认删除失物招领，ID: ${item.id}`);
    console.log('Dialog result:', result);
    
    // 处理不同类型的结果格式
    const isConfirmed = typeof result === 'boolean' ? result : 
                       (result && (result.confirm || result === 'confirm'));
    
    if (isConfirmed) {
      deleteItem();
    } else {
      itemToDelete.value = null;
    }
  });
};

// Delete the lost/found item after confirmation
const deleteItem = async () => {
  if (!itemToDelete.value) return;
  const itemId = itemToDelete.value.id;

  // 首先检查是否有认证令牌
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('未登录或会话已过期，请重新登录');
    userStore.clearUserInfo();
    router.push('/login');
    return;
  }

  try {
    showLoadingToast({ message: '正在删除...', forbidClick: true });
    
    // 详细记录删除请求
    console.log(`发送删除失物招领请求，参数:`, { id: itemId, token: '已设置' });
    
    const response = await deleteLostFound(itemId);
    console.log('删除失物招领响应:', response);
    
    if (response && (response.code === 200 || response.code === 0)) {
      closeToast();
      showToast('删除成功');
      items.value = items.value.filter(i => i.id !== itemId);
    } else {
      // 处理错误响应
      const errorMsg = response?.message || '删除失败';
      throw new Error(errorMsg);
    }
  } catch (err) {
    console.error("删除失物招领失败:", err);
    closeToast();
    
    // 处理特定错误
    if (err.code === 401) {
      showDialog({
        title: '会话已过期',
        message: '您的登录信息已过期，请重新登录',
        confirmButtonText: '去登录',
      }).then(() => {
        userStore.clearUserInfo();
        router.push('/login');
      });
      return;
    }
    
    // 一般错误提示
    showToast({
      message: err.message || '删除失败，请稍后重试',
      type: 'fail',
      duration: 2000,
    });
  } finally {
    itemToDelete.value = null;
  }
};

// Toggle lost/found item status (e.g., active/resolved)
const toggleStatus = async (item) => {
  const STATUS_ACTIVE = 1;
  const STATUS_RESOLVED = 2;

  const newStatus = item.status === STATUS_ACTIVE ? STATUS_RESOLVED : STATUS_ACTIVE;
  const statusText = newStatus === STATUS_RESOLVED ? '标记为已解决' : '重新激活';

  try {
    showLoadingToast({ message: `正在${statusText}...`, forbidClick: true });
    
    // 修复状态更新请求
    console.log(`正在更新失物招领状态，ID: ${item.id}, 新状态: ${newStatus}`);
    const response = await updateLostFoundStatus(item.id, newStatus);
    console.log('更新失物招领状态响应:', response);
    
    if (response && (response.code === 200 || response.code === 0)) {
       closeToast();
       showToast(`信息已${statusText}`);
       const index = items.value.findIndex(i => i.id === item.id);
       if (index !== -1) {
         items.value[index].status = newStatus;
       }
    } else {
       throw new Error(response?.message || `${statusText}失败`);
    }
  } catch (err) {
    console.error(`更新状态为 ${statusText} 失败:`, err);
    showToast(err.message || `${statusText}时出错`);
  } finally {
     closeToast();
  }
};

</script>

<style scoped>
/* Reuse or adapt styles from MyProducts.vue */
.my-lost-found-page {
  padding-top: 46px; /* Standard HeaderNav height */
  padding-bottom: 60px; /* Standard FooterNav height */
  min-height: 100vh;
  background-color: #f7f8fa;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  min-height: calc(100vh - 150px); /* Adjust based on header/footer */
}

.loading-container p {
  margin-top: 15px;
  font-size: 0.9rem;
  color: #969799;
}

.error-message {
  color: #ee0a24;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.retry-button {
  margin-top: 10px;
}

.empty-container {
    color: #969799;
}

.publish-button {
  margin-top: 20px;
  padding: 8px 24px;
  background-color: #007aff;
  color: white;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.items-list {
  padding: 10px;
}

</style>
