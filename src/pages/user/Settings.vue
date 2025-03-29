<template>
  <div class="user-settings-page">
    <!-- 头部导航 -->
    <HeaderNavigation title="设置" showBack @back="router.back()" />
    
    <!-- 用户信息区域 -->
    <section class="user-info-section">
      <div class="user-avatar-wrapper" @click="handleEditAvatar">
        <img :src="userInfo.avatar" alt="用户头像" class="user-avatar" />
        <div class="edit-avatar-icon">
          <i class="material-icons">photo_camera</i>
        </div>
      </div>
      
      <div class="user-details">
        <h3 class="user-name">{{ userInfo.nickname || userInfo.username }}</h3>
        <p class="user-id">ID: {{ userInfo.id }}</p>
      </div>
      
      <div class="edit-profile-button" @click="navigateTo('/user/edit-profile')">
        <span>编辑资料</span>
        <i class="material-icons">chevron_right</i>
      </div>
    </section>
    
    <!-- 设置列表 -->
    <section class="settings-section">
      <h4 class="section-title">账号设置</h4>
      
      <div class="setting-list">
        <div class="setting-item" @click="navigateTo('/user/change-password')">
          <div class="setting-icon">
            <i class="material-icons">lock</i>
          </div>
          <div class="setting-content">
            <span class="setting-label">修改密码</span>
          </div>
          <div class="setting-arrow">
            <i class="material-icons">chevron_right</i>
          </div>
        </div>
        
        <div class="setting-item" @click="navigateTo('/user/privacy-settings')">
          <div class="setting-icon">
            <i class="material-icons">security</i>
          </div>
          <div class="setting-content">
            <span class="setting-label">隐私设置</span>
          </div>
          <div class="setting-arrow">
            <i class="material-icons">chevron_right</i>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-icon">
            <i class="material-icons">notifications</i>
          </div>
          <div class="setting-content">
            <span class="setting-label">消息通知</span>
          </div>
          <div class="setting-toggle">
            <toggle-switch v-model="notificationEnabled" />
          </div>
        </div>
      </div>
    </section>
    
    <section class="settings-section">
      <h4 class="section-title">通用设置</h4>
      
      <div class="setting-list">
        <div class="setting-item" @click="navigateTo('/feedback')">
          <div class="setting-icon">
            <i class="material-icons">feedback</i>
          </div>
          <div class="setting-content">
            <span class="setting-label">意见反馈</span>
          </div>
          <div class="setting-arrow">
            <i class="material-icons">chevron_right</i>
          </div>
        </div>
        
        <div class="setting-item" @click="navigateTo('/about')">
          <div class="setting-icon">
            <i class="material-icons">info</i>
          </div>
          <div class="setting-content">
            <span class="setting-label">关于我们</span>
          </div>
          <div class="setting-arrow">
            <i class="material-icons">chevron_right</i>
          </div>
        </div>
        
        <div class="setting-item" @click="clearCache">
          <div class="setting-icon">
            <i class="material-icons">cleaning_services</i>
          </div>
          <div class="setting-content">
            <span class="setting-label">清除缓存</span>
            <span class="setting-value" v-if="cacheSize">{{ cacheSize }}</span>
          </div>
          <div class="setting-arrow">
            <i class="material-icons">chevron_right</i>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-icon">
            <i class="material-icons">nightlight_round</i>
          </div>
          <div class="setting-content">
            <span class="setting-label">深色模式</span>
          </div>
          <div class="setting-toggle">
            <toggle-switch v-model="darkModeEnabled" />
          </div>
        </div>
      </div>
    </section>
    
    <!-- 退出登录按钮 -->
    <div class="logout-button" @click="handleLogout">
      退出登录
    </div>
    
    <!-- 上传头像弹窗 -->
    <UploadDialog
      v-if="showUploadDialog"
      title="上传头像"
      :aspect-ratio="1"
      @close="showUploadDialog = false"
      @upload="handleUploadAvatar"
    />
    
    <!-- 退出确认弹窗 -->
    <div v-if="showLogoutConfirm" class="logout-confirm-dialog">
      <div class="confirm-dialog-content">
        <h3 class="confirm-title">退出登录</h3>
        <p class="confirm-message">确定要退出登录吗？</p>
        <div class="confirm-buttons">
          <button class="cancel-button" @click="showLogoutConfirm = false">取消</button>
          <button class="confirm-button" @click="confirmLogout">确定</button>
        </div>
      </div>
    </div>
    
    <!-- 消息提示 -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HeaderNavigation from '../components/common/HeaderNavigation.vue'
import ToggleSwitch from '../components/common/ToggleSwitch.vue'
import UploadDialog from '../components/dialog/UploadDialog.vue'
import Toast from '../components/common/Toast.vue'
import { getUserInfo, uploadAvatar, logout } from '../api/user'
import { useUserStore } from '../store/user'
import { useAppStore } from '../store/app'

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const toast = ref(null)

// 用户信息
const userInfo = ref({})

// 设置状态
const notificationEnabled = ref(true)
const darkModeEnabled = ref(false)
const cacheSize = ref('2.5MB')

// 弹窗控制
const showUploadDialog = ref(false)
const showLogoutConfirm = ref(false)

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    if (!userStore.isLoggedIn) {
      router.replace('/login')
      return
    }
    
    const res = await getUserInfo()
    if (res.data) {
      userInfo.value = res.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    toast.value.show('获取用户信息失败', 'error')
  }
}

// 编辑头像
const handleEditAvatar = () => {
  showUploadDialog.value = true
}

// 上传头像
const handleUploadAvatar = async (file) => {
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const res = await uploadAvatar(formData)
    
    if (res.data) {
      userInfo.value.avatar = res.data.url
      userStore.updateUserInfo({ avatar: res.data.url })
      showUploadDialog.value = false
      toast.value.show('头像上传成功', 'success')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    toast.value.show('头像上传失败', 'error')
  }
}

// 清除缓存
const clearCache = () => {
  // 模拟清除缓存操作
  toast.value.show('正在清除缓存...', 'info')
  
  setTimeout(() => {
    cacheSize.value = '0MB'
    toast.value.show('缓存已清除', 'success')
  }, 1000)
}

// 退出登录
const handleLogout = () => {
  showLogoutConfirm.value = true
}

// 确认退出
const confirmLogout = async () => {
  try {
    await logout()
    userStore.clearUser()
    showLogoutConfirm.value = false
    
    // 重定向到登录页
    router.replace('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    toast.value.show('退出登录失败', 'error')
  }
}

// 页面导航
const navigateTo = (path) => {
  router.push(path)
}

// 监听深色模式变化
const handleDarkModeChange = (value) => {
  appStore.setDarkMode(value)
  
  // 应用深色模式
  if (value) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
}

// 添加 watch 以响应深色模式切换
watch(darkModeEnabled, handleDarkModeChange)

onMounted(() => {
  fetchUserInfo()
  
  // 初始化设置状态
  darkModeEnabled.value = appStore.darkMode
  
  // 初始化通知设置
  notificationEnabled.value = localStorage.getItem('notificationEnabled') !== 'false'
})
</script>

<style scoped>
.user-settings-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

.user-info-section {
  background-color: #fff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
}

.user-avatar-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.edit-avatar-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-avatar-icon i {
  font-size: 16px;
  color: #666;
}

.user-details {
  text-align: center;
  margin-bottom: 15px;
}

.user-name {
  font-size: 1.2rem;
  margin: 0 0 5px;
}

.user-id {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.edit-profile-button {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  background-color: #f0f0f0;
  border-radius: 20px;
  cursor: pointer;
}

.edit-profile-button span {
  margin-right: 5px;
}

.settings-section {
  background-color: #fff;
  margin-bottom: 15px;
}

.section-title {
  font-size: 0.9rem;
  color: #888;
  padding: 10px 15px;
  margin: 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-list {
  border-bottom: 1px solid #f0f0f0;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-icon {
  margin-right: 15px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setting-icon i {
  color: #666;
}

.setting-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  font-size: 1rem;
}

.setting-value {
  font-size: 0.9rem;
  color: #888;
}

.setting-arrow {
  margin-left: 10px;
}

.setting-arrow i {
  color: #ccc;
}

.setting-toggle {
  margin-left: 10px;
}

.logout-button {
  margin: 20px 15px;
  padding: 12px 0;
  background-color: #fff;
  color: #f44336;
  text-align: center;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
}

.logout-confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog-content {
  width: 80%;
  max-width: 300px;
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.confirm-title {
  padding: 15px;
  margin: 0;
  text-align: center;
  font-size: 1.1rem;
  border-bottom: 1px solid #f0f0f0;
}

.confirm-message {
  padding: 20px 15px;
  margin: 0;
  text-align: center;
  color: #666;
}

.confirm-buttons {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.confirm-buttons button {
  flex: 1;
  padding: 12px 0;
  border: none;
  background-color: transparent;
  font-size: 1rem;
  cursor: pointer;
}

.cancel-button {
  border-right: 1px solid #f0f0f0;
}

.confirm-button {
  color: #f44336;
}
</style>