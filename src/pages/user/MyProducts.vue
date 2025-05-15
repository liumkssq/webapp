<template>
  <div class="my-products-page">
    <header-nav title="我的商品" back/>

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" />
      <p>正在加载您的商品...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-message">加载商品失败: {{ error }}</p>
      <van-button plain type="primary" @click="fetchUserProducts" class="retry-button">重试</van-button>
    </div>

    <div v-else-if="products.length === 0" class="empty-container">
      <van-empty description="您还没有发布任何商品哦" />
      <router-link to="/publish/product" class="publish-button">去发布</router-link>
    </div>

    <div v-else class="products-list">
      <product-card
        v-for="product in products"
        :key="product.id"
        :product="product"
        @edit="editProduct(product.id)"
        @delete="confirmDeleteProduct(product)"
        @toggle-status="toggleStatus(product)"
        :show-actions="true"
      />
    </div>

    <footer-nav />
  </div>
</template>

<script setup>
import { deleteProduct as apiDeleteProduct, getUserProducts, updateProduct } from '@/api/product';
import { useUserStore } from '@/store/user';
import { closeToast, showDialog, showLoadingToast, showToast } from 'vant';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

// 导入组件
import FooterNav from '@/components/FooterNav.vue';
import HeaderNav from '@/components/HeaderNav.vue';
import ProductCard from '@/components/cards/ProductCard.vue';

const router = useRouter();
const userStore = useUserStore();

const products = ref([]);
const loading = ref(true);
const error = ref(null);
const productToDelete = ref(null);
const showDeleteDialog = ref(false);

onMounted(() => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录');
    router.replace('/login');
    loading.value = false;
    return;
  }
  fetchUserProducts();
});

const fetchUserProducts = async () => {
  loading.value = true;
  error.value = null;
  products.value = [];
  try {
    const userId = userStore.userInfo?.id;
    if (!userId) {
      await userStore.getUserInfo();
      if (!userStore.userInfo?.id) {
         throw new Error('无法获取用户信息，请重新登录');
      }
    }
    console.log(`Fetching products for user ID: ${userStore.userInfo.id}`);
    const response = await getUserProducts(userStore.userInfo.id);
    console.log('getUserProducts原始响应:', response);

    // 尝试处理不同的响应格式
    if (response) {
      // 直接提取列表数据
      const productList = response.list || response.data?.list || [];
      products.value = productList;
      console.log('用户商品列表:', products.value);
    } else {
      throw new Error(response?.message || '未能加载商品列表');
    }
  } catch (err) {
    console.error("获取用户商品失败:", err);
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

// 跳转到编辑商品页面
const editProduct = (productId) => {
  router.push({ name: 'PublishProduct', query: { edit: productId } });
};

// 确认删除商品
const confirmDeleteProduct = (product) => {
  productToDelete.value = product;
  showDialog({
    title: '删除商品',
    message: `确定要删除商品 "${product.title || '此商品'}" 吗？`,
    showCancelButton: true,
  }).then((result) => {
    console.log(`确认删除商品，ID: ${product.id}`);
    console.log('Dialog result:', result);
    
    // 处理不同类型的结果格式
    const isConfirmed = typeof result === 'boolean' ? result : 
                       (result && (result.confirm || result === 'confirm'));
  
    if (isConfirmed) {
      deleteProduct();
    } else {
      productToDelete.value = null;
    }
  });
};

// 执行删除操作
const deleteProduct = async () => {
  if (!productToDelete.value) return;
  const productId = productToDelete.value.id;
  
  // 首先检查是否有认证令牌
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('未登录或会话已过期，请重新登录');
    userStore.clearUserInfo();
    router.push('/login');
    return;
  }
  
  console.log(`开始删除商品，ID: ${productId}`);

  try {
    showLoadingToast({
      message: '正在删除...',
      forbidClick: true,
    });
    
    // 详细记录删除请求
    console.log(`发送删除请求，参数:`, { id: productId, token: '已设置' });
    
    const response = await apiDeleteProduct(productId);
    console.log('删除商品响应:', response);
    
    if (response && (response.code === 200 || response.code === 0)) {
      closeToast();
      showToast('商品删除成功');
      // 从本地列表中移除商品
      products.value = products.value.filter(p => p.id !== productId);
    } else {
      // 处理错误响应
      const errorMsg = response?.message || '删除失败';
      throw new Error(errorMsg);
    }
  } catch (err) {
    console.error("删除商品失败:", err);
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
    // 关闭确认对话框
    showDeleteDialog.value = false;
    productToDelete.value = null;
  }
};

// 切换商品状态
const toggleStatus = async (product) => {
  // 定义状态码
  const STATUS_ACTIVE = 1;
  const STATUS_INACTIVE = 2;
  const STATUS_SOLD = 3;

  if (product.status === STATUS_SOLD) {
      showToast('已售出的商品无法修改状态');
      return;
  }

  const newStatus = product.status === STATUS_ACTIVE ? STATUS_INACTIVE : STATUS_ACTIVE;
  const statusText = newStatus === STATUS_ACTIVE ? '上架' : '下架';

  try {
    showLoadingToast({
      message: `正在${statusText}...`,
      forbidClick: true,
    });
    const response = await updateProduct(product.id, { status: newStatus });
    if (response.code === 200) {
       closeToast();
       showToast(`商品已${statusText}`);
       // 本地更新状态
       const index = products.value.findIndex(p => p.id === product.id);
       if (index !== -1) {
         products.value[index].status = newStatus;
       }
    } else {
       throw new Error(response.message || `${statusText}失败`);
    }
  } catch (err) {
    console.error(`更新商品状态失败:`, err);
    showToast(err.message || `${statusText}时出错`);
  } finally {
     closeToast();
  }
};
</script>

<style scoped>
.my-products-page {
  padding-top: 46px;
  padding-bottom: 60px;
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
  min-height: calc(100vh - 150px);
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

.products-list {
  padding: 10px;
}
</style>
