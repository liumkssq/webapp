<template>
  <div class="mine-page">
    <div class="user-header">
      <div class="user-info" @click="goToProfile">
        <div class="avatar">
          <img :src="userInfo.avatar || defaultAvatar" alt="用户头像" />
        </div>
        <div class="user-text">
          <div class="username">{{ userInfo.nickname || '未登录' }}</div>
          <div class="user-id" v-if="userInfo.id">ID: {{ userInfo.id }}</div>
          <div class="login-tip" v-else @click.stop="goToLogin">点击登录账号</div>
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

    <footer-navigation active-tab="mine" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import FooterNavigation from '@/components/common/FooterNavigation.vue'
import { getUserStats, logout } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

const defaultAvatar = 'https://via.placeholder.com/100'
const userInfo = computed(() => userStore.user || {})
const isLoggedIn = computed(() => !!userStore.token)

const userStats = reactive({
  productCount: 0,
  lostFoundCount: 0,
  articleCount: 0,
  favoriteCount: 0
})

onMounted(async () => {
  if (isLoggedIn.value) {
    try {
      const response = await getUserStats()
      if (response.code === 200) {
        Object.assign(userStats, response.data)
      }
    } catch (error) {
      console.error('获取用户统计信息失败:', error)
    }
  }
})

const goToLogin = () => {
  router.push('/login')
}

const goToProfile = () => {
  if (isLoggedIn.value) {
    router.push('/user/profile')
  } else {
    goToLogin()
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
</script>