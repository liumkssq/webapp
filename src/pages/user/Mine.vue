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
      <div class="settings-icon" @click="goToSettings">
        <svg-icon name="settings" size="24" />
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
      <div class="stat-item" @click="goToUserArticles">
        <div class="stat-value">{{ userStats.articleCount || 0 }}</div>
        <div class="stat-label">我的文章</div>
      </div>
      <div class="stat-item" @click="goToFavorites">
        <div class="stat-value">{{ userStats.favoriteCount || 0 }}</div>
        <div class="stat-label">我的收藏</div>
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
          <div class="function-item" @click="goToOrderList('processing')">
            <svg-icon name="package" size="24" />
            <span>待发货</span>
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
        <div class="section-title">我的工具</div>
        <div class="function-items">
          <div class="function-item" @click="goToAddressList">
            <svg-icon name="map-pin" size="24" />
            <span>收货地址</span>
            <svg-icon name="chevron-right" size="16" class="arrow-icon" />
          </div>
          <div class="function-item" @click="goToCustomerService">
            <svg-icon name="help-circle" size="24" />
            <span>联系客服</span>
            <svg-icon name="chevron-right" size="16" class="arrow-icon" />
          </div>
          <div class="function-item" @click="goToFeedback">
            <svg-icon name="message-square" size="24" />
            <span>问题反馈</span>
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
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import FooterNavigation from '@/components/common/FooterNavigation.vue'
import { getUserStats, logout } from '@/api/user'
import { getSafeImageUrl, DEFAULT_AVATAR } from '@/utils/defaultImages'
import IosTop from '@/components/Ios/IosTop.vue'
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

const userStats = computed(() => {
  return {
    productCount: userInfo.value.productCount || 0,
    lostFoundCount: userInfo.value.lostFoundCount || 0,
    articleCount: userInfo.value.articleCount || 0,
    favoriteCount: userInfo.value.favoriteCount || 0
  };
});

onMounted(async () => {
  // 启动时间更新
  updateTime()
  timeInterval = setInterval(updateTime, 30000) // 每30秒更新一次
  
  if (isLoggedIn.value) {
    try {
      console.log('Mine页面加载，开始获取用户数据...');
      
      // 1. 确保有完整的用户基本信息
      if (!userInfo.value.id || !userInfo.value.username) {
        console.log('用户信息不完整，调用getUserInfo获取最新数据');
        await userStore.getUserInfo();
      }
      
      console.log('当前用户信息:', userInfo.value);
      
      // 2. 获取用户统计数据
      if (!userInfo.value.productCount || !userInfo.value.articleCount || !userInfo.value.lostFoundCount) {
        console.log('用户统计数据缺失，调用getUserStats API');
        const response = await getUserStats(true);
        
        if (response.code === 200 && response.data) {
          console.log('获取到用户统计数据:', response.data);
          userStore.updateUserInfo({
            productCount: response.data.productCount || 0,
            lostFoundCount: response.data.lostFoundCount || 0,
            articleCount: response.data.articleCount || 0,
            favoriteCount: response.data.favoriteCount || 0
          });
        } else {
          console.warn('获取用户统计数据失败:', response.message || '未知错误');
        }
      } else {
        console.log('用户统计数据已存在，但仍然请求最新数据以确保准确性');
        try {
          const response = await getUserStats(true);
          if (response.code === 200 && response.data) {
            console.log('更新用户统计数据:', response.data);
            userStore.updateUserInfo({
              productCount: response.data.productCount || 0,
              lostFoundCount: response.data.lostFoundCount || 0,
              articleCount: response.data.articleCount || 0,
              favoriteCount: response.data.favoriteCount || 0
            });
          }
        } catch (error) {
          console.error('更新用户统计数据失败:', error);
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  } else {
    console.log('用户未登录，不获取数据');
  }
})

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
</style>