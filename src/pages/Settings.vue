<template>
  <div class="settings-page">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">设置</div>
    </div>
    
    <!-- 设置列表 -->
    <div class="settings-container">
      <!-- 账号设置 -->
      <div class="settings-group">
        <div class="group-title">账号设置</div>
        <div class="settings-list">
          <div class="settings-item" @click="goToProfile">
            <div class="settings-item-left">
              <i class="icon-profile"></i>
              <span>个人资料</span>
            </div>
            <div class="settings-item-right">
              <i class="icon-arrow"></i>
            </div>
          </div>
          <div class="settings-item" @click="goToPasswordChange">
            <div class="settings-item-left">
              <i class="icon-password"></i>
              <span>修改密码</span>
            </div>
            <div class="settings-item-right">
              <i class="icon-arrow"></i>
            </div>
          </div>
          <div class="settings-item" @click="goToPrivacy">
            <div class="settings-item-left">
              <i class="icon-privacy"></i>
              <span>隐私设置</span>
            </div>
            <div class="settings-item-right">
              <i class="icon-arrow"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 应用设置 -->
      <div class="settings-group">
        <div class="group-title">应用设置</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-notifications"></i>
              <span>通知设置</span>
            </div>
            <div class="settings-item-right">
              <i class="icon-arrow"></i>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-theme"></i>
              <span>主题设置</span>
            </div>
            <div class="settings-item-right">
              <div class="theme-options">
                <span 
                  class="theme-option" 
                  :class="{ active: currentTheme === 'light' }"
                  @click.stop="setTheme('light')"
                >
                  浅色
                </span>
                <span 
                  class="theme-option" 
                  :class="{ active: currentTheme === 'dark' }"
                  @click.stop="setTheme('dark')"
                >
                  深色
                </span>
                <span 
                  class="theme-option" 
                  :class="{ active: currentTheme === 'system' }"
                  @click.stop="setTheme('system')"
                >
                  跟随系统
                </span>
              </div>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-language"></i>
              <span>语言设置</span>
            </div>
            <div class="settings-item-right">
              <span class="current-value">简体中文</span>
              <i class="icon-arrow"></i>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-storage"></i>
              <span>清除缓存</span>
            </div>
            <div class="settings-item-right">
              <span class="current-value">{{ cacheSize }}</span>
              <i class="icon-arrow"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 关于我们 -->
      <div class="settings-group">
        <div class="group-title">关于</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-about"></i>
              <span>关于我们</span>
            </div>
            <div class="settings-item-right">
              <i class="icon-arrow"></i>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-feedback"></i>
              <span>意见反馈</span>
            </div>
            <div class="settings-item-right">
              <i class="icon-arrow"></i>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-update"></i>
              <span>检查更新</span>
            </div>
            <div class="settings-item-right">
              <span class="current-value">v{{ appVersion }}</span>
              <i class="icon-arrow"></i>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-terms"></i>
              <span>用户协议与隐私政策</span>
            </div>
            <div class="settings-item-right">
              <i class="icon-arrow"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 退出登录 -->
      <div class="settings-group">
        <button class="logout-btn" @click="showLogoutConfirm = true">
          退出登录
        </button>
      </div>
    </div>
    
    <!-- 退出登录确认弹窗 -->
    <div class="confirm-popup" v-if="showLogoutConfirm">
      <div class="popup-mask" @click="showLogoutConfirm = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">退出登录</div>
        </div>
        <div class="popup-body">
          <div class="popup-message">确定要退出当前账号吗？</div>
        </div>
        <div class="popup-footer">
          <button class="cancel-btn" @click="showLogoutConfirm = false">取消</button>
          <button class="confirm-btn" @click="logout">确定</button>
        </div>
      </div>
    </div>
    
    <!-- 提示消息 -->
    <div class="toast" v-if="showToast">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 页面状态
const currentTheme = ref('system')
const cacheSize = ref('23.5MB')
const appVersion = ref('1.0.0')
const showLogoutConfirm = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

// 初始化应用设置
onMounted(() => {
  // 获取用户主题设置
  const savedTheme = localStorage.getItem('theme') || 'system'
  currentTheme.value = savedTheme
  
  // 应用主题
  applyTheme(savedTheme)
  
  // 获取应用缓存大小（模拟）
  setTimeout(() => {
    cacheSize.value = `${(Math.random() * 50 + 10).toFixed(1)}MB`
  }, 500)
})

// 设置主题
const setTheme = (theme) => {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
  applyTheme(theme)
  
  // 显示提示
  showToastMessage(`已切换到${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}主题`)
}

// 应用主题设置
const applyTheme = (theme) => {
  const htmlElement = document.documentElement
  
  if (theme === 'light') {
    htmlElement.classList.remove('dark')
    htmlElement.classList.add('light')
  } else if (theme === 'dark') {
    htmlElement.classList.remove('light')
    htmlElement.classList.add('dark')
  } else {
    // 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    htmlElement.classList.remove('light', 'dark')
    htmlElement.classList.add(prefersDark ? 'dark' : 'light')
  }
}

// 显示提示消息
const showToastMessage = (message) => {
  toastMessage.value = message
  showToast.value = true
  
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

// 清除缓存
const clearCache = () => {
  // 模拟清除缓存
  setTimeout(() => {
    cacheSize.value = '0MB'
    showToastMessage('缓存已清除')
  }, 800)
}

// 退出登录
const logout = async () => {
  try {
    await userStore.userLogout()
    showLogoutConfirm.value = false
    showToastMessage('退出登录成功')
    
    // 重定向到登录页
    setTimeout(() => {
      router.push('/login')
    }, 1000)
  } catch (error) {
    console.error('退出登录失败', error)
    showToastMessage('退出登录失败，请重试')
  }
}

// 导航到个人资料页
const goToProfile = () => {
  router.push('/profile')
}

// 导航到修改密码页
const goToPasswordChange = () => {
  router.push('/password/change')
}

// 导航到隐私设置页
const goToPrivacy = () => {
  router.push('/privacy/settings')
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>