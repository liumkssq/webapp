<template>
  <div class="mine-page">
    <!-- iOS风格状态栏 -->
    <IosTop />
    
    <div class="user-header">
      <div class="user-info" @click="goToProfile">
        <div class="avatar">
          <img :src="getSafeImageUrl(userInfo.avatar, defaultAvatar)" alt="用户头像" @error="e => e.target.src = defaultAvatar" />
          <div class="avatar-border"></div>
        </div>
        <div class="user-text">
          <!-- 已登录状态 -->
          <template v-if="isLoggedIn && userInfo.id">
            <div class="username">{{ userInfo.nickname || userInfo.username || '未知用户' }}</div>
            <div class="user-id">ID: {{ userInfo.id }}</div>
            <div class="user-phone" v-if="userInfo.phone">{{ userInfo.phone }}</div>
          </template>
          
          <!-- 未登录状态 -->
          <template v-else>
            <div class="username">未登录</div>
            <div class="login-tip" @click.stop="goToLogin">
              <svg-icon name="log-in" size="14" class="login-icon" />
              <span>点击登录账号</span>
            </div>
          </template>
        </div>
      </div>
      <!-- Header Actions: Settings, Notifications -->
      <div class="header-actions">
        <div class="header-icon" @click="goToNotifications">
          <svg-icon name="bell" size="24" />
          <span class="badge" v-if="unreadNotificationsCount > 0">{{ unreadNotificationsCount }}</span>
        </div>
        <div class="header-icon" @click="goToSettings">
           <svg-icon name="settings" size="24" />
        </div>
      </div>
    </div>

    <div class="stats-panel">
      <div class="stat-item" @click="goToUserProducts">
        <div class="stat-value">{{ userStats.productCount || 0 }}</div>
        <div class="stat-label">我的商品</div>
      </div>
      <div class="stat-item" @click="goToUserLostFound">
        <div class="stat-value">{{ userStats.lostFoundCount || 0 }}</div>
        <div class="stat-label">失物招领</div>
      </div>
      <div class="stat-item" @click="goToFavorites">
        <div class="stat-value">{{ userStats.favoriteCount || 0 }}</div>
        <div class="stat-label">我的收藏</div>
      </div>
      <div class="stat-item" @click="goToCart">
        <svg-icon name="shopping-cart" size="24" />
        <div class="stat-label">购物车</div>
      </div>
    </div>

    <div class="function-list">
      <div class="function-section">
        <div class="section-title">我的交易</div>
        <div class="function-items">
          <div class="function-item" @click="goToOrderList('all')">
            <svg-icon name="order" size="24" />
            <span>全部订单</span>
            <svg-icon name="chevron-right" size="16" class="arrow-icon" />
          </div>
          <div class="function-item" @click="goToOrderList('pending')">
            <svg-icon name="wallet" size="24" />
            <span>待付款</span>
            <svg-icon name="chevron-right" size="16" class="arrow-icon" />
          </div>
          <div class="function-item" @click="goToOrderList('shipping')">
            <svg-icon name="truck" size="24" />
            <span>待收货</span>
            <svg-icon name="chevron-right" size="16" class="arrow-icon" />
          </div>
        </div>
      </div>

      <div class="function-section">
        <div class="section-title">常用功能</div>
        <div class="function-items">
          <div class="function-item" @click="goToAddressList">
            <svg-icon name="map-pin" size="24" />
            <span>收货地址</span>
            <svg-icon name="chevron-right" size="16" class="arrow-icon" />
          </div>
          <div class="function-item" @click="goToHistory">
            <svg-icon name="clock" size="24" />
            <span>浏览历史</span>
            <svg-icon name="chevron-right" size="16" class="arrow-icon" />
          </div>
          <div class="function-item" @click="goToCustomerService">
            <svg-icon name="help-circle" size="24" />
            <span>联系客服</span>
            <svg-icon name="chevron-right" size="16" class="arrow-icon" />
          </div>
          <div class="function-item" @click="goToAbout">
            <svg-icon name="info" size="24" />
            <span>关于我们</span>
            <svg-icon name="chevron-right" size="16" class="arrow-icon" />
          </div>
        </div>
      </div>
    </div>

    <div class="logout-button" v-if="isLoggedIn" @click="handleLogout">
      退出登录
    </div>

    <footer-navigation active-tab="user" />
  </div>
</template>

<script setup>
import { getUserLostFound } from '@/api/lostfound'
import { getUserFavorites, getUserProducts } from '@/api/product'
import { getNotifications, logout } from '@/api/user'
import FooterNavigation from '@/components/common/FooterNavigation.vue'
import IosTop from '@/components/Ios/IosTop.vue'
import { useMessageStore } from '@/store/message'
import { useUserStore } from '@/store/user'
import { DEFAULT_AVATAR, getSafeImageUrl } from '@/utils/defaultImages'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

// 当前时间状态
const currentTime = ref(formatTime(new Date()))
let timeInterval

// 格式化时间为HH:MM
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const defaultAvatar = DEFAULT_AVATAR
const userInfo = computed(() => userStore.userInfo || {})
const isLoggedIn = computed(() => !!userStore.token)

// 用户数据
const userProducts = ref([])
const userFavorites = ref([])
const userLostFound = ref([])
const loading = ref({
  products: false,
  favorites: false,
  lostFound: false
})

const userStats = computed(() => {
  return {
    productCount: userProducts.value.length || userInfo.value.productCount || 0,
    lostFoundCount: userLostFound.value.length || userInfo.value.lostFoundCount || 0,
    articleCount: userInfo.value.articleCount || 0,
    favoriteCount: userFavorites.value.length || userInfo.value.favoriteCount || 0
  };
});

// 添加通知数据
const unreadNotificationsCount = ref(0)

onMounted(async () => {
  console.log('个人中心页面加载...')
  
  // 启动时间更新定时器
  updateTime()
  timeInterval = setInterval(updateTime, 30000) // 每30秒更新一次
  
  try {
    // 首先获取用户信息
    if (isLoggedIn.value && (!userInfo.value || !userInfo.value.id || !userInfo.value.username)) {
      console.log('用户信息不完整，调用getUserInfo获取最新数据')
      await userStore.getUserInfo()
    }
    
    // 只有当用户信息获取成功且已登录时，才加载其他数据
    if (isLoggedIn.value) {
      console.log('当前用户信息:', userInfo.value)
      console.log('用户已登录，ID:', userInfo.value.id)
      
      // 获取用户统计数据
      // fetchUserStats()
      
      // 同时获取用户商品、收藏、失物招领和通知信息
      Promise.all([
        fetchUserProducts(),
        fetchUserFavorites(),
        fetchUserLostFound(),
        // fetchNotifications() // 确保在用户已登录状态下调用
      ])
    } else {
      console.warn('用户未登录，不加载个人数据')
    }
  } catch (error) {
    console.error('初始化个人中心页面失败:', error)
  }
})

// 获取用户发布的商品
async function fetchUserProducts() {
  if (!userInfo.value.id) {
    console.warn('fetchUserProducts: 用户ID不存在，跳过API调用');
    return;
  }
  
  try {
    loading.value.products = true;
    console.log('获取用户发布的商品...');
    
    // 添加详细调试信息
    console.log('fetchUserProducts: userInfo.id的类型:', typeof userInfo.value.id);
    console.log('fetchUserProducts: userInfo.id的值:', userInfo.value.id);
    
    // 确保userId是一个有效的值（字符串或数字），而不是对象
    let userId = userInfo.value.id;
    if (typeof userId === 'object') {
      console.warn('fetchUserProducts: 警告: 用户ID是一个对象而不是简单值');
      // 尝试从对象中提取id
      userId = userId.id || userId.userId || null;
      console.log('fetchUserProducts: 从对象中提取的userId:', userId);
    }
    
    // 如果仍然无法获取有效的userId，则返回
    if (!userId) {
      console.error('fetchUserProducts: 无法获取有效的用户ID，取消API请求');
      loading.value.products = false;
      return;
    }
    
    // 打印完整的API路径，便于调试
    console.log(`fetchUserProducts: 将调用API路径: /api/product/userProduct/${userId}`);
    
    // 使用指定的API接口获取用户商品
    const response = await getUserProducts(userId);
    console.log('fetchUserProducts: API响应:', response);
    
    if (response) {
      // 处理响应数据 - 注意这里是直接使用response，因为请求拦截器已经提取了data
      const productData = response.list || response.data?.list || [];
      const totalCount = response.total || response.data?.total || 0;
      
      userProducts.value = productData;
      console.log(`获取到${totalCount}件用户商品`);
      
      // 更新用户信息中的商品数量
      userStore.updateUserInfo({
        productCount: totalCount
      });
    } else {
      // 处理错误响应
      console.error('fetchUserProducts: API返回错误:', response?.message || '未知错误');
      messageStore.showError(response?.message || '获取商品列表失败');
    }
  } catch (error) {
    console.error('获取用户商品失败:', error);
    messageStore.showError('获取商品列表失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value.products = false;
  }
}

// 获取用户收藏的商品
async function fetchUserFavorites() {
  if (!isLoggedIn.value) return;
  
  try {
    loading.value.favorites = true;
    console.log('获取用户收藏的商品...');
    
    // 使用指定的API接口获取用户收藏
    const response = await getUserFavorites();
    console.log('fetchUserFavorites: API响应:', response);
    
    if (response) {
      // 处理响应数据 - 提取列表和总数
      const favoriteData = response.list || response.data?.list || [];
      const totalCount = response.total || response.data?.total || 0;
      
      userFavorites.value = favoriteData;
      console.log(`获取到${totalCount}件收藏商品`);
      
      // 更新用户信息中的收藏数量
      userStore.updateUserInfo({
        favoriteCount: totalCount
      });
    }
  } catch (error) {
    console.error('获取用户收藏失败:', error);
  } finally {
    loading.value.favorites = false;
  }
}

// 获取用户的失物招领
async function fetchUserLostFound() {
  if (!userInfo.value.id) {
    console.warn('fetchUserLostFound: 用户ID不存在，跳过API调用');
    return;
  }
  
  try {
    loading.value.lostFound = true;
    console.log('获取用户的失物招领...');
    
    // 添加详细调试信息
    console.log('fetchUserLostFound: userInfo.id的类型:', typeof userInfo.value.id);
    console.log('fetchUserLostFound: userInfo.id的值:', userInfo.value.id);
    
    // 确保userId是一个有效的值（字符串或数字），而不是对象
    let userId = userInfo.value.id;
    if (typeof userId === 'object') {
      console.warn('fetchUserLostFound: 警告: 用户ID是一个对象而不是简单值');
      // 尝试从对象中提取id
      userId = userId.id || userId.userId || null;
      console.log('fetchUserLostFound: 从对象中提取的userId:', userId);
    }
    
    // 如果仍然无法获取有效的userId，则返回
    if (!userId) {
      console.error('fetchUserLostFound: 无法获取有效的用户ID，取消API请求');
      loading.value.lostFound = false;
      return;
    }
    
    // 打印完整的API路径，便于调试
    console.log(`fetchUserLostFound: 将调用API路径: /api/lost-found/userLostFound/${userId}`);
    
    // 使用指定的API接口获取用户失物招领
    const response = await getUserLostFound(userId);
    console.log('fetchUserLostFound: API响应:', response);
    
    if (response) {
      // 处理响应数据 - 提取列表和总数
      const lostFoundData = response.list || response.data?.list || [];
      const totalCount = response.total || response.data?.total || 0;
      
      userLostFound.value = lostFoundData;
      console.log(`获取到${totalCount}条失物招领信息`);
      
      // 更新用户信息中的失物招领数量
      userStore.updateUserInfo({
        lostFoundCount: totalCount
      });
    } else {
      // 处理错误响应
      console.error('fetchUserLostFound: API返回错误:', response?.message || '未知错误');
      messageStore.showError(response?.message || '获取失物招领列表失败');
    }
  } catch (error) {
    console.error('获取用户失物招领失败:', error);
    messageStore.showError('获取失物招领列表失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value.lostFound = false;
  }
}

// 获取通知信息
async function fetchNotifications() {
  if (!isLoggedIn.value) {
    console.warn('用户未登录，无法获取通知');
    return;
  }

  try {
    console.log('加载用户通知数据...');
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('未找到认证令牌，无法获取通知');
      return;
    }
    
    console.log('API请求路径:', `/api/user/notifications`);
    const notificationsResponse = await getNotifications();
    console.log('通知响应结果:', notificationsResponse);
    
    if (notificationsResponse && notificationsResponse.code === 200) {
      const notifications = notificationsResponse.data.list || [];
      // 计算未读通知数量
      unreadNotificationsCount.value = notifications.filter(notification => !notification.isRead).length;
      console.log(`未读通知数量: ${unreadNotificationsCount.value}`);
    } else {
      console.error('获取通知失败:', notificationsResponse?.message || '未知错误');
      // 不向用户显示错误，静默失败
    }
  } catch (error) {
    console.error('获取通知数据失败:', error);
    // 不在UI上显示错误，因为通知不是核心功能
  }
}

const goToLogin = () => {
  router.push('/login')
}

const goToProfile = () => {
  if (isLoggedIn.value) {
    console.log('Mine页面中点击了个人头像，但当前已在个人中心页面，无需跳转');
    // 当前已在个人中心页面，可以触发一个刷新操作
    if (userInfo.value.id) {
      messageStore.showInfo('已在个人中心页面');
    }
  } else {
    goToLogin();
  }
}

const goToSettings = () => {
  router.push('/settings')
}

const goToUserProducts = () => {
  if (!isLoggedIn.value) return goToLogin()
  router.push('/user/products')
}

const goToUserLostFound = () => {
  if (!isLoggedIn.value) return goToLogin()
  router.push('/user/lost-found')
}

const goToUserArticles = () => {
  if (!isLoggedIn.value) return goToLogin()
  router.push('/user/articles')
}

const goToFavorites = () => {
  if (!isLoggedIn.value) return goToLogin()
  router.push('/user/favorites')
}

const goToOrderList = (type) => {
  if (!isLoggedIn.value) return goToLogin()
  router.push({ path: '/user/orders', query: { type } })
}

const goToAddressList = () => {
  if (!isLoggedIn.value) return goToLogin()
  router.push('/user/address')
}

const goToCustomerService = () => {
  router.push('/customer-service')
}

const goToFeedback = () => {
  router.push('/feedback')
}

const goToAbout = () => {
  router.push('/about')
}

// Add new navigation functions
const goToCart = () => {
  if (!isLoggedIn.value) return goToLogin();
  router.push('/cart'); // Placeholder path
};

const goToNotifications = () => {
  if (!isLoggedIn.value) return goToLogin();
  
  console.log('导航到通知页面');
  router.push('/notifications');
};

const goToWallet = () => {
  if (!isLoggedIn.value) return goToLogin();
  router.push('/wallet'); // Placeholder path
};

const goToHistory = () => {
  if (!isLoggedIn.value) return goToLogin();
  router.push('/history'); // Placeholder path
};

const goToIdentity = () => {
  if (!isLoggedIn.value) return goToLogin();
  router.push('/identity'); // Placeholder path
};

const goToCoupons = () => {
  if (!isLoggedIn.value) return goToLogin();
  router.push('/coupons'); // Placeholder path
};

const goToDrafts = () => {
  if (!isLoggedIn.value) return goToLogin();
  router.push('/drafts'); // Placeholder path
};

const handleLogout = async () => {
  try {
    await logout()
    userStore.clearUserInfo()
    messageStore.showSuccess('退出登录成功')
    router.push('/')
  } catch (error) {
    console.error('退出登录失败:', error)
    messageStore.showError('退出登录失败，请稍后重试')
  }
}

// 更新时间函数
function updateTime() {
  currentTime.value = formatTime(new Date())
}

onUnmounted(() => {
  // 清除定时器
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 60px;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* iOS风格状态栏 */
.ios-status-bar {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  font-weight: 500;
  position: relative;
  z-index: 10;
}

.status-bar-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.signal {
  display: flex;
  align-items: flex-end;
  height: 12px;
  gap: 1px;
}

.signal-bar {
  display: inline-block;
  width: 3px;
  height: 6px;
  background-color: white;
  border-radius: 1px;
}

.signal-bar:nth-child(2) {
  height: 8px;
}

.signal-bar:nth-child(3) {
  height: 10px;
}

.signal-bar:nth-child(4) {
  height: 12px;
}

.wifi, .battery {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

/* 用户信息区域样式 */
.user-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px 25px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 4px 20px rgba(37, 117, 252, 0.2);
  margin-top: 0;
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.avatar {
  margin-right: 12px;
  position: relative;
}

.avatar img {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.8);
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background-color: white;
  transition: transform 0.3s ease;
}

.avatar img:hover {
  transform: scale(1.05);
}

.user-text {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-id, .user-phone {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 2px;
}

.login-tip {
  background-color: rgba(255, 255, 255, 0.25);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  margin-top: 6px;
  display: inline-block;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.login-tip:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

.settings-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.settings-icon:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: rotate(15deg);
}

/* 统计面板样式 */
.stats-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 15px 16px;
  background-color: white;
  border-radius: 12px;
  margin: 0 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

/* 功能列表样式 */
.function-list {
  padding: 0 12px;
}

.function-section {
  background-color: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 0.9rem;
  color: #666;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.function-items {
  padding: 4px 0;
}

.function-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.function-item:after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 1px;
  background-color: #f5f5f5;
}

.function-item:last-child:after {
  display: none;
}

.function-item:hover {
  background-color: #f9f9f9;
}

.function-item svg-icon {
  margin-right: 12px;
  color: #2575fc;
}

.function-item span {
  flex: 1;
  font-size: 0.95rem;
  color: #333;
}

.arrow-icon {
  color: #ccc;
}

/* 退出登录按钮样式 */
.logout-button {
  margin: 24px 12px;
  padding: 14px;
  background-color: white;
  color: #ff3b30;
  text-align: center;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.logout-button:hover {
  background-color: #fff0f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.15);
}

/* 响应式设计 */
@media (max-width: 360px) {
  .stats-panel {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, auto);
    gap: 12px;
    padding: 12px;
  }
  
  .stat-value {
    font-size: 1.2rem;
  }
  
  .user-header {
    padding: 16px 12px;
  }
  
  .avatar img {
    width: 58px;
    height: 58px;
  }
  
  .username {
    font-size: 1.1rem;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .mine-page {
    background-color: #121212;
  }
  
  .user-header {
    background: linear-gradient(135deg, #4a01ab 0%, #0755d9 100%);
  }
  
  .stats-panel, .function-section, .logout-button {
    background-color: #1e1e1e;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .stat-value {
    color: #f5f5f5;
  }
  
  .stat-label, .section-title {
    color: #aaa;
  }
  
  .function-item span {
    color: #e0e0e0;
  }
  
  .function-item:after {
    background-color: #333;
  }
  
  .function-item:hover {
    background-color: #252525;
  }
  
  .logout-button {
    color: #ff453a;
  }
  
  .logout-button:hover {
    background-color: #302020;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.mine-page {
  animation: fadeIn 0.3s ease-out;
}

.function-item, .stat-item {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}

.function-item:nth-child(1), .stat-item:nth-child(1) { animation-delay: 0.05s; }
.function-item:nth-child(2), .stat-item:nth-child(2) { animation-delay: 0.1s; }
.function-item:nth-child(3), .stat-item:nth-child(3) { animation-delay: 0.15s; }
.function-item:nth-child(4), .stat-item:nth-child(4) { animation-delay: 0.2s; }
.function-item:nth-child(5) { animation-delay: 0.25s; }
.function-item:nth-child(6) { animation-delay: 0.3s; }

/* Add styles for header action icons */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px; /* Adjust gap as needed */
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  color: white; /* Ensure icons are white */
  position: relative; /* 为徽章定位 */
}

.header-icon:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1); /* Example hover effect */
}

/* 添加通知徽章样式 */
.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ff3b30;
  color: white;
  font-size: 0.7rem;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  padding: 0 4px;
  font-weight: bold;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>