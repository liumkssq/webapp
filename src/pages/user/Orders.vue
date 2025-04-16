<template>
  <div class="my-orders-page">
    <header-nav title="我的订单" back/>

    <!-- 订单状态标签页 -->
    <div class="order-tabs">
      <button
        v-for="tab in orderStatuses"
        :key="tab.value"
        :class="['tab-button', { active: activeStatus === tab.value }]"
        @click="changeStatusFilter(tab.value)"
      >
        {{ tab.text }}
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" />
      <p>正在加载订单...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-message">加载订单失败: {{ error }}</p>
      <van-button plain type="primary" @click="fetchUserOrders" class="retry-button">重试</van-button>
    </div>

    <div v-else-if="filteredOrders.length === 0" class="empty-container">
      <van-empty description="您还没有相关订单" />
      <router-link to="/" class="explore-button">去逛逛</router-link>
    </div>

    <div v-else class="orders-list">
      <order-card
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
        @view-details="goToOrderDetail(order.id)"
        @cancel="confirmCancelOrder(order)"
        @pay="goToPayment(order)"
        @confirm-receipt="confirmReceipt(order)"
        @view-logistics="viewLogistics(order)"
      />
    </div>

    <footer-nav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { showToast, showDialog } from 'vant';
import { getUserOrders, cancelOrder, confirmOrderReceipt } from '@/api/order';

// 导入组件
import HeaderNav from '@/components/HeaderNav.vue';
import FooterNav from '@/components/FooterNav.vue';
import OrderCard from '@/components/order/OrderCard.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 订单状态定义
const ORDER_STATUS_ALL = 'all';
const ORDER_STATUS_PENDING_PAYMENT = 1;
const ORDER_STATUS_TO_SHIP = 2;
const ORDER_STATUS_SHIPPED = 3;
const ORDER_STATUS_COMPLETED = 4;
const ORDER_STATUS_CANCELLED = 5;

const orderStatuses = ref([
  { value: ORDER_STATUS_ALL, text: '全部' },
  { value: ORDER_STATUS_PENDING_PAYMENT, text: '待付款' },
  { value: ORDER_STATUS_TO_SHIP, text: '待发货' },
  { value: ORDER_STATUS_SHIPPED, text: '待收货' },
  { value: ORDER_STATUS_COMPLETED, text: '已完成' },
]);

const allOrders = ref([]);
const loading = ref(true);
const error = ref(null);
const activeStatus = ref(ORDER_STATUS_ALL);

// 根据当前标签页过滤订单
const filteredOrders = computed(() => {
  if (activeStatus.value === ORDER_STATUS_ALL) {
    return allOrders.value;
  } else {
    return allOrders.value.filter(order => String(order.status) === String(activeStatus.value));
  }
});

onMounted(() => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录');
    router.replace('/login');
    loading.value = false;
    return;
  }
  // 设置初始筛选条件（从路由参数）
  const initialStatus = getStatusFromQuery(route.query.type);
  activeStatus.value = initialStatus ?? ORDER_STATUS_ALL;

  fetchUserOrders();
});

// 从查询参数获取状态
const getStatusFromQuery = (type) => {
    switch (type?.toLowerCase()) {
        case 'pending': return ORDER_STATUS_PENDING_PAYMENT;
        case 'processing': return ORDER_STATUS_TO_SHIP;
        case 'shipping': return ORDER_STATUS_SHIPPED;
        case 'completed': return ORDER_STATUS_COMPLETED;
        case 'cancelled': return ORDER_STATUS_CANCELLED;
        default: return null;
    }
};

const fetchUserOrders = async () => {
  loading.value = true;
  error.value = null;
  allOrders.value = [];
  try {
    const userId = userStore.userInfo?.id;
    if (!userId) {
       await userStore.getUserInfo();
       if(!userStore.userInfo?.id) throw new Error('无法获取用户信息，请重新登录');
    }
    console.log(`Fetching orders for user ID: ${userStore.userInfo.id}`);
    
    const response = await getUserOrders({ userId: userStore.userInfo.id, page: 1, pageSize: 100 });

    if (response.code === 200) {
      allOrders.value = response.data?.list || [];
      console.log('用户订单列表:', allOrders.value);
    } else {
      throw new Error(response.message || '未能加载订单列表');
    }
  } catch (err) {
    console.error("获取用户订单失败:", err);
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

// 切换订单状态标签
const changeStatusFilter = (statusValue) => {
  activeStatus.value = statusValue;
  
  // 更新URL查询参数（不重新加载页面）
  let queryTypeParam = undefined;
  const matchedTab = orderStatuses.value.find(tab => tab.value === statusValue);
  if (matchedTab && matchedTab.value !== ORDER_STATUS_ALL) {
      switch(matchedTab.value) {
          case ORDER_STATUS_PENDING_PAYMENT: queryTypeParam = 'pending'; break;
          case ORDER_STATUS_TO_SHIP: queryTypeParam = 'processing'; break;
          case ORDER_STATUS_SHIPPED: queryTypeParam = 'shipping'; break;
          case ORDER_STATUS_COMPLETED: queryTypeParam = 'completed'; break;
          case ORDER_STATUS_CANCELLED: queryTypeParam = 'cancelled'; break;
      }
  }
  router.replace({ query: { ...route.query, type: queryTypeParam } });
};

// 跳转到订单详情页
const goToOrderDetail = (orderId) => {
  router.push({ name: 'UserOrderDetail', params: { id: orderId } });
};

// 跳转到支付页面
const goToPayment = (order) => {
   showToast('正在准备支付...');
   router.push({ name: 'Payment', query: { orderId: order.id } });
};

// 取消订单确认
const confirmCancelOrder = (order) => {
  if (order.status !== ORDER_STATUS_PENDING_PAYMENT) {
      showToast('此订单状态无法取消');
      return;
  }
  
  showDialog({
    title: '取消订单',
    message: `确定要取消订单 ${order.orderNo || order.id} 吗？`,
    showCancelButton: true,
  }).then(({ confirm }) => {
    if (confirm) {
      cancelUserOrder(order);
    }
  });
};

// 取消订单
const cancelUserOrder = async (order) => {
  const orderId = order.id;
  try {
    showToast('正在取消订单...');
    const response = await cancelOrder(orderId);
    if (response.code === 200) {
      showToast('订单已取消');
      // 本地更新订单状态
      const index = allOrders.value.findIndex(o => o.id === orderId);
      if (index !== -1) {
          allOrders.value[index].status = ORDER_STATUS_CANCELLED;
      }
    } else {
      throw new Error(response.message || '取消订单失败');
    }
  } catch (err) {
    console.error("取消订单失败:", err);
    showToast(err.message || '取消订单时出错');
  }
};

// 确认收货
const confirmReceipt = async (order) => {
   if (order.status !== ORDER_STATUS_SHIPPED) {
       showToast('订单尚未发货或已完成/取消');
       return;
   }
   
   showDialog({
     title: '确认收货',
     message: `确认收到订单 ${order.orderNo || order.id} 的所有商品吗？`,
     showCancelButton: true,
   }).then(({ confirm }) => {
     if (confirm) {
       const orderId = order.id;
       try {
         showToast('正在确认收货...');
         const response = confirmOrderReceipt(orderId).then(response => {
           if (response.code === 200) {
             showToast('确认收货成功');
             // 本地更新订单状态
             const index = allOrders.value.findIndex(o => o.id === orderId);
             if (index !== -1) {
               allOrders.value[index].status = ORDER_STATUS_COMPLETED;
             }
           } else {
             throw new Error(response.message || '确认收货失败');
           }
         });
       } catch (err) {
         console.error("确认收货失败:", err);
         showToast(err.message || '确认收货时出错');
       }
     }
   });
};

// 查看物流信息
const viewLogistics = (order) => {
  if (order.status < ORDER_STATUS_SHIPPED) {
      showToast('订单尚未发货');
      return;
  }
  router.push({ name: 'LogisticsDetail', query: { orderId: order.id } });
};
</script>

<style scoped>
.my-orders-page {
  padding-top: 46px;
  padding-bottom: 60px;
  min-height: 100vh;
  background-color: #f7f8fa;
}

.order-tabs {
  display: flex;
  background-color: #fff;
  padding: 0 10px;
  border-bottom: 1px solid #ebedf0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  white-space: nowrap;
  position: sticky;
  top: 46px;
  z-index: 9;
}

.order-tabs::-webkit-scrollbar {
  display: none;
}

.tab-button {
  padding: 12px 15px;
  font-size: 0.9rem;
  color: #646566;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
  flex-shrink: 0;
}

.tab-button.active {
  color: #323233;
  font-weight: 500;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 3px;
  background-color: #007aff;
  border-radius: 3px;
}

.loading-container,
.error-container,
.empty-container,
.orders-list {
  padding-top: 55px;
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
  min-height: calc(100vh - 200px);
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

.explore-button {
  margin-top: 20px;
  padding: 8px 24px;
  background-color: #007aff;
  color: white;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.orders-list {
  padding: 10px;
}
</style>
