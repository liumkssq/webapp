<template>
  <div class="settings-page">
    <!-- 头部导航 -->
    <HeaderNav title="设置" />
    
    <!-- 设置列表 -->
    <div class="settings-container">
      <!-- 账号与安全 -->
      <div class="settings-section">
        <div class="section-title">账号与安全</div>
        <div class="settings-list">
          <div class="settings-item" @click="goToProfile">
            <div class="item-icon profile">
              <i class="icon-profile"></i>
            </div>
            <div class="item-content">
              <div class="item-title">个人资料</div>
              <div class="item-desc">修改头像、昵称等信息</div>
            </div>
            <div class="item-arrow">
              <i class="icon-arrow-right"></i>
            </div>
          </div>
          
          <div class="settings-item" @click="goToChangePassword">
            <div class="item-icon password">
              <i class="icon-password"></i>
            </div>
            <div class="item-content">
              <div class="item-title">修改密码</div>
              <div class="item-desc">定期修改密码可以保障账号安全</div>
            </div>
            <div class="item-arrow">
              <i class="icon-arrow-right"></i>
            </div>
          </div>
          
          <div class="settings-item" @click="goToPhoneBinding">
            <div class="item-icon phone">
              <i class="icon-phone"></i>
            </div>
            <div class="item-content">
              <div class="item-title">手机绑定</div>
              <div class="item-desc">{{ user.phone ? formatPhone(user.phone) : '未绑定' }}</div>
            </div>
            <div class="item-arrow">
              <i class="icon-arrow-right"></i>
            </div>
          </div>
          
          <div class="settings-item" @click="goToEmailBinding">
            <div class="item-icon email">
              <i class="icon-email"></i>
            </div>
            <div class="item-content">
              <div class="item-title">邮箱绑定</div>
              <div class="item-desc">{{ user.email ? formatEmail(user.email) : '未绑定' }}</div>
            </div>
            <div class="item-arrow">
              <i class="icon-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 消息通知 -->
      <div class="settings-section">
        <div class="section-title">消息通知</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="item-icon notification">
              <i class="icon-notification"></i>
            </div>
            <div class="item-content">
              <div class="item-title">消息推送</div>
              <div class="item-desc">开启后将接收新消息提醒</div>
            </div>
            <div class="item-switch">
              <input 
                type="checkbox" 
                class="switch" 
                id="notification-switch" 
                v-model="settings.notifications.message"
                @change="updateSettings('notifications.message')"
              >
              <label for="notification-switch"></label>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="item-icon comment">
              <i class="icon-comment"></i>
            </div>
            <div class="item-content">
              <div class="item-title">评论提醒</div>
              <div class="item-desc">开启后将接收评论互动提醒</div>
            </div>
            <div class="item-switch">
              <input 
                type="checkbox" 
                class="switch" 
                id="comment-switch" 
                v-model="settings.notifications.comment"
                @change="updateSettings('notifications.comment')"
              >
              <label for="comment-switch"></label>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="item-icon like">
              <i class="icon-like"></i>
            </div>
            <div class="item-content">
              <div class="item-title">点赞收藏提醒</div>
              <div class="item-desc">开启后将接收点赞收藏提醒</div>
            </div>
            <div class="item-switch">
              <input 
                type="checkbox" 
                class="switch" 
                id="like-switch" 
                v-model="settings.notifications.like"
                @change="updateSettings('notifications.like')"
              >
              <label for="like-switch"></label>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="item-icon system">
              <i class="icon-system"></i>
            </div>
            <div class="item-content">
              <div class="item-title">系统通知</div>
              <div class="item-desc">开启后将接收系统公告、活动提醒</div>
            </div>
            <div class="item-switch">
              <input 
                type="checkbox" 
                class="switch" 
                id="system-switch" 
                v-model="settings.notifications.system"
                @change="updateSettings('notifications.system')"
              >
              <label for="system-switch"></label>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="item-icon sound">
              <i class="icon-sound"></i>
            </div>
            <div class="item-content">
              <div class="item-title">声音提醒</div>
              <div class="item-desc">开启后收到消息时会有声音提醒</div>
            </div>
            <div class="item-switch">
              <input 
                type="checkbox" 
                class="switch" 
                id="sound-switch" 
                v-model="settings.notifications.sound"
                @change="updateSettings('notifications.sound')"
              >
              <label for="sound-switch"></label>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="item-icon vibrate">
              <i class="icon-vibrate"></i>
            </div>
            <div class="item-content">
              <div class="item-title">震动提醒</div>
              <div class="item-desc">开启后收到消息时会有震动提醒</div>
            </div>
            <div class="item-switch">
              <input 
                type="checkbox" 
                class="switch" 
                id="vibrate-switch" 
                v-model="settings.notifications.vibrate"
                @change="updateSettings('notifications.vibrate')"
              >
              <label for="vibrate-switch"></label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 隐私设置 -->
      <div class="settings-section">
        <div class="section-title">隐私设置</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="item-icon privacy">
              <i class="icon-privacy"></i>
            </div>
            <div class="item-content">
              <div class="item-title">谁可以查看我的主页</div>
            </div>
            <div class="item-select" @click="showPrivacyOptions('viewProfile')">
              <div class="select-text">{{ getPrivacyText('viewProfile') }}</div>
              <i class="icon-arrow-right"></i>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="item-icon public">
              <i class="icon-public"></i>
            </div>
            <div class="item-content">
              <div class="item-title">谁可以给我发消息</div>
            </div>
            <div class="item-select" @click="showPrivacyOptions('sendMessage')">
              <div class="select-text">{{ getPrivacyText('sendMessage') }}</div>
              <i class="icon-arrow-right"></i>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="item-icon location">
              <i class="icon-location"></i>
            </div>
            <div class="item-content">
              <div class="item-title">地理位置共享</div>
              <div class="item-desc">允许使用您的位置信息来提供更好的服务</div>
            </div>
            <div class="item-switch">
              <input 
                type="checkbox" 
                class="switch" 
                id="location-switch" 
                v-model="settings.privacy.shareLocation"
                @change="updateSettings('privacy.shareLocation')"
              >
              <label for="location-switch"></label>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="item-icon online">
              <i class="icon-online"></i>
            </div>
            <div class="item-content">
              <div class="item-title">在线状态</div>
              <div class="item-desc">允许其他人看到你是否在线</div>
            </div>
            <div class="item-switch">
              <input 
                type="checkbox" 
                class="switch" 
                id="online-switch" 
                v-model="settings.privacy.showOnline"
                @change="updateSettings('privacy.showOnline')"
              >
              <label for="online-switch"></label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 通用设置 -->
      <div class="settings-section">
        <div class="section-title">通用设置</div>
        <div class="settings-list">
          <div class="settings-item" @click="clearCache">
            <div class="item-icon clear">
              <i class="icon-clear"></i>
            </div>
            <div class="item-content">
              <div class="item-title">清除缓存</div>
              <div class="item-desc">{{ formatSize(cacheSize) }}</div>
            </div>
            <div class="item-arrow">
              <i class="icon-arrow-right"></i>
            </div>
          </div>
          
          <div class="settings-item" @click="goToFeedback">
            <div class="item-icon feedback">
              <i class="icon-feedback"></i>
            </div>
            <div class="item-content">
              <div class="item-title">意见反馈</div>
              <div class="item-desc">帮助我们改进产品和服务</div>
            </div>
            <div class="item-arrow">
              <i class="icon-arrow-right"></i>
            </div>
          </div>
          
          <div class="settings-item" @click="goToAbout">
            <div class="item-icon about">
              <i class="icon-about"></i>
            </div>
            <div class="item-content">
              <div class="item-title">关于我们</div>
              <div class="item-desc">当前版本 {{ appVersion }}</div>
            </div>
            <div class="item-arrow">
              <i class="icon-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 退出登录 -->
      <div class="logout-btn" @click="showLogoutConfirm = true">
        退出登录
      </div>
    </div>
    
    <!-- 隐私选项弹窗 -->
    <div class="privacy-popup" v-if="showPrivacyPopup">
      <div class="popup-mask" @click="showPrivacyPopup = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">{{ privacyPopupTitle }}</div>
          <div class="popup-close" @click="showPrivacyPopup = false">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="privacy-options">
          <div 
            v-for="option in privacyOptions" 
            :key="option.value"
            class="privacy-option"
            :class="{ active: currentPrivacySetting === option.value }"
            @click="updatePrivacySetting(option.value)"
          >
            <div class="option-text">{{ option.label }}</div>
            <div class="option-check" v-if="currentPrivacySetting === option.value">
              <i class="icon-check"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 退出登录确认弹窗 -->
    <div class="confirm-popup" v-if="showLogoutConfirm">
      <div class="popup-mask" @click="showLogoutConfirm = false"></div>
      <div class="popup-content">
        <div class="popup-title">确认退出登录？</div>
        <div class="popup-actions">
          <div class="popup-btn cancel" @click="showLogoutConfirm = false">取消</div>
          <div class="popup-btn confirm" @click="logout">确认</div>
        </div>
      </div>
    </div>
    
    <!-- 清除缓存确认弹窗 -->
    <div class="confirm-popup" v-if="showClearCacheConfirm">
      <div class="popup-mask" @click="showClearCacheConfirm = false"></div>
      <div class="popup-content">
        <div class="popup-title">确认清除缓存？</div>
        <div class="popup-desc">这将清除应用缓存的数据，但不会删除您的账号信息</div>
        <div class="popup-actions">
          <div class="popup-btn cancel" @click="showClearCacheConfirm = false">取消</div>
          <div class="popup-btn confirm" @click="confirmClearCache">确认</div>
        </div>
      </div>
    </div>
    
    <!-- 提示消息 -->
    <div class="toast" v-if="toast.show">
      {{ toast.message }}
    </div>
    
    <!-- 底部导航 -->
    <FooterNav />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getUserInfo, logout as apiLogout } from '@/api/user'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'

const router = useRouter()
const userStore = useUserStore()

// 状态变量
const user = ref({})
const cacheSize = ref(0)
const appVersion = ref('1.0.0')
const settings = reactive({
  notifications: {
    message: true,
    comment: true,
    like: true,
    system: true,
    sound: true,
    vibrate: true
  },
  privacy: {
    viewProfile: 'all',    // all, followers, none
    sendMessage: 'all',    // all, followers, none
    shareLocation: true,
    showOnline: true
  }
})

const showPrivacyPopup = ref(false)
const privacyPopupTitle = ref('')
const currentPrivacyType = ref('')
const currentPrivacySetting = ref('')
const showLogoutConfirm = ref(false)
const showClearCacheConfirm = ref(false)
const toast = reactive({
  show: false,
  message: ''
})

// 隐私选项
const privacyOptions = [
  { value: 'all', label: '所有人' },
  { value: 'followers', label: '仅关注我的人' },
  { value: 'none', label: '禁止所有人' }
]

// 获取隐私设置文本
const getPrivacyText = (type) => {
  const value = settings.privacy[type]
  const option = privacyOptions.find(opt => opt.value === value)
  return option ? option.label : '未设置'
}

// 显示隐私选项弹窗
const showPrivacyOptions = (type) => {
  currentPrivacyType.value = type
  currentPrivacySetting.value = settings.privacy[type]
  
  if (type === 'viewProfile') {
    privacyPopupTitle.value = '谁可以查看我的主页'
  } else if (type === 'sendMessage') {
    privacyPopupTitle.value = '谁可以给我发消息'
  }
  
  showPrivacyPopup.value = true
}

// 更新隐私设置
const updatePrivacySetting = (value) => {
  settings.privacy[currentPrivacyType.value] = value
  currentPrivacySetting.value = value
  updateSettings(`privacy.${currentPrivacyType.value}`)
  showPrivacyPopup.value = false
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    
    if (res.code === 200) {
      user.value = res.data
      
      // 合并用户设置
      if (res.data.settings) {
        // 合并通知设置
        if (res.data.settings.notifications) {
          Object.assign(settings.notifications, res.data.settings.notifications)
        }
        
        // 合并隐私设置
        if (res.data.settings.privacy) {
          Object.assign(settings.privacy, res.data.settings.privacy)
        }
      }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

// 更新设置
const updateSettings = async (key) => {
  try {
    // 在实际应用中这里应该调用更新设置的API
    console.log('更新设置', key)
    showToast('设置已更新')
  } catch (error) {
    console.error('更新设置失败', error)
    showToast('更新设置失败，请稍后重试')
  }
}

// 格式化手机号 (隐藏中间4位)
const formatPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 格式化邮箱 (显示前三位和@后面的部分)
const formatEmail = (email) => {
  if (!email) return ''
  const parts = email.split('@')
  if (parts.length !== 2) return email
  
  const name = parts[0]
  const domain = parts[1]
  
  if (name.length <= 3) {
    return email
  }
  
  return `${name.slice(0, 3)}***@${domain}`
}

// 格式化缓存大小
const formatSize = (size) => {
  if (size < 1024) {
    return `${size}KB`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)}MB`
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)}GB`
  }
}

// 清除缓存
const clearCache = () => {
  showClearCacheConfirm.value = true
}

// 确认清除缓存
const confirmClearCache = () => {
  // 在实际应用中应该调用清除缓存的API或执行清除缓存的操作
  setTimeout(() => {
    cacheSize.value = 0
    showToast('缓存已清除')
    showClearCacheConfirm.value = false
  }, 500)
}

// 退出登录
const logout = async () => {
  try {
    await apiLogout()
    userStore.clearUserInfo()
    showLogoutConfirm.value = false
    showToast('已退出登录')
    
    // 跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 500)
  } catch (error) {
    console.error('退出登录失败', error)
    showToast('退出登录失败，请稍后重试')
  }
}

// 显示提示消息
const showToast = (message) => {
  toast.message = message
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 2000)
}

// 页面跳转
const goToProfile = () => {
  router.push('/profile/edit')
}

const goToChangePassword = () => {
  router.push('/change-password')
}

const goToPhoneBinding = () => {
  router.push('/phone-binding')
}

const goToEmailBinding = () => {
  router.push('/email-binding')
}

const goToFeedback = () => {
  router.push('/feedback')
}

const goToAbout = () => {
  router.push('/about')
}

// 获取缓存大小
const getCacheSize = () => {
  // 模拟获取缓存大小
  cacheSize.value = Math.floor(Math.random() * 200) + 50
}

onMounted(() => {
  fetchUserInfo()
  getCacheSize()
})
</script>