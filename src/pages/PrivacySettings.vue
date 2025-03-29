<template>
  <div class="privacy-settings-page">
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
      <div class="nav-title">隐私设置</div>
    </div>
    
    <!-- 隐私设置列表 -->
    <div class="privacy-container">
      <!-- 账号隐私 -->
      <div class="settings-group">
        <div class="group-title">账号隐私</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-profile"></i>
              <span>个人资料可见性</span>
            </div>
            <div class="settings-item-right">
              <select v-model="profileVisibility" class="select-dropdown">
                <option value="public">所有人可见</option>
                <option value="friends">仅好友可见</option>
                <option value="private">仅自己可见</option>
              </select>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-phone"></i>
              <span>手机号可见性</span>
            </div>
            <div class="settings-item-right">
              <select v-model="phoneVisibility" class="select-dropdown">
                <option value="public">所有人可见</option>
                <option value="friends">仅好友可见</option>
                <option value="private">仅自己可见</option>
              </select>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-school"></i>
              <span>学校和专业可见性</span>
            </div>
            <div class="settings-item-right">
              <select v-model="schoolVisibility" class="select-dropdown">
                <option value="public">所有人可见</option>
                <option value="friends">仅好友可见</option>
                <option value="private">仅自己可见</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 内容隐私 -->
      <div class="settings-group">
        <div class="group-title">内容隐私</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-article"></i>
              <span>文章默认可见性</span>
            </div>
            <div class="settings-item-right">
              <select v-model="articleVisibility" class="select-dropdown">
                <option value="public">所有人可见</option>
                <option value="friends">仅好友可见</option>
                <option value="private">仅自己可见</option>
              </select>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-product"></i>
              <span>商品默认可见性</span>
            </div>
            <div class="settings-item-right">
              <select v-model="productVisibility" class="select-dropdown">
                <option value="public">所有人可见</option>
                <option value="friends">仅好友可见</option>
                <option value="schoolmates">仅校友可见</option>
              </select>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-history"></i>
              <span>浏览历史可见性</span>
            </div>
            <div class="settings-item-right">
              <select v-model="historyVisibility" class="select-dropdown">
                <option value="friends">仅好友可见</option>
                <option value="private">仅自己可见</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 社交隐私 -->
      <div class="settings-group">
        <div class="group-title">社交隐私</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-add-friend"></i>
              <span>谁可以加我为好友</span>
            </div>
            <div class="settings-item-right">
              <select v-model="friendRequestSetting" class="select-dropdown">
                <option value="everyone">所有人</option>
                <option value="schoolmates">仅校友</option>
                <option value="approval">需要我的同意</option>
              </select>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-message"></i>
              <span>谁可以给我发消息</span>
            </div>
            <div class="settings-item-right">
              <select v-model="messageSetting" class="select-dropdown">
                <option value="everyone">所有人</option>
                <option value="friends">仅好友</option>
                <option value="schoolmates">仅校友</option>
              </select>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-online"></i>
              <span>在线状态</span>
            </div>
            <div class="settings-item-right">
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  id="onlineStatusToggle" 
                  v-model="showOnlineStatus"
                >
                <label for="onlineStatusToggle"></label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 隐私保护 -->
      <div class="settings-group">
        <div class="group-title">隐私保护</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-block"></i>
              <span>黑名单管理</span>
            </div>
            <div class="settings-item-right">
              <span class="block-count" v-if="blockedUserCount > 0">{{ blockedUserCount }}人</span>
              <i class="icon-arrow"></i>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-location"></i>
              <span>位置信息</span>
            </div>
            <div class="settings-item-right">
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  id="locationToggle" 
                  v-model="shareLocation"
                >
                <label for="locationToggle"></label>
              </div>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-analytics"></i>
              <span>统计数据收集</span>
            </div>
            <div class="settings-item-right">
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  id="analyticsToggle" 
                  v-model="allowAnalytics"
                >
                <label for="analyticsToggle"></label>
              </div>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <i class="icon-personalization"></i>
              <span>个性化推荐</span>
            </div>
            <div class="settings-item-right">
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  id="personalizationToggle" 
                  v-model="allowPersonalization"
                >
                <label for="personalizationToggle"></label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 数据管理 -->
      <div class="settings-group">
        <div class="group-title">数据管理</div>
        <div class="settings-list">
          <div class="settings-item" @click="requestDataExport">
            <div class="settings-item-left">
              <i class="icon-download"></i>
              <span>导出我的数据</span>
            </div>
            <div class="settings-item-right">
              <i class="icon-arrow"></i>
            </div>
          </div>
          <div class="settings-item" @click="showDeleteConfirm = true">
            <div class="settings-item-left">
              <i class="icon-delete"></i>
              <span class="delete-text">删除我的账号</span>
            </div>
            <div class="settings-item-right">
              <i class="icon-arrow"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 保存按钮 -->
    <div class="floating-btn" @click="saveSettings">
      <i class="icon-save"></i>
    </div>
    
    <!-- 删除账号确认弹窗 -->
    <div class="confirm-popup" v-if="showDeleteConfirm">
      <div class="popup-mask" @click="showDeleteConfirm = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">删除账号</div>
        </div>
        <div class="popup-body">
          <div class="popup-message">
            <p>您确定要删除账号吗？</p>
            <p class="warning-text">此操作将会:</p>
            <ul class="warning-list">
              <li>永久删除您的个人信息</li>
              <li>删除您发布的所有内容</li>
              <li>无法恢复您的账号和数据</li>
            </ul>
          </div>
          <div class="confirm-input">
            <label for="confirmPassword">请输入密码确认:</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              placeholder="输入您的密码"
            >
          </div>
        </div>
        <div class="popup-footer">
          <button class="cancel-btn" @click="showDeleteConfirm = false">取消</button>
          <button 
            class="delete-btn"
            :disabled="!confirmPassword"
            @click="deleteAccount"
          >
            确认删除
          </button>
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

// 隐私设置
const profileVisibility = ref('friends')
const phoneVisibility = ref('private')
const schoolVisibility = ref('friends')
const articleVisibility = ref('public')
const productVisibility = ref('schoolmates')
const historyVisibility = ref('private')
const friendRequestSetting = ref('approval')
const messageSetting = ref('friends')
const showOnlineStatus = ref(true)
const shareLocation = ref(false)
const allowAnalytics = ref(true)
const allowPersonalization = ref(true)

// 黑名单
const blockedUserCount = ref(0)

// 页面状态
const showToast = ref(false)
const toastMessage = ref('')
const showDeleteConfirm = ref(false)
const confirmPassword = ref('')
const isSaving = ref(false)

// 获取用户隐私设置
const fetchUserPrivacySettings = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟从API获取的数据
    profileVisibility.value = 'friends'
    phoneVisibility.value = 'private'
    schoolVisibility.value = 'friends'
    articleVisibility.value = 'friends'
    productVisibility.value = 'schoolmates'
    historyVisibility.value = 'private'
    friendRequestSetting.value = 'approval'
    messageSetting.value = 'friends'
    showOnlineStatus.value = true
    shareLocation.value = false
    allowAnalytics.value = true
    allowPersonalization.value = true
    blockedUserCount.value = Math.floor(Math.random() * 5)
  } catch (error) {
    console.error('获取隐私设置失败', error)
    showToastMessage('获取隐私设置失败，请重试')
  }
}

// 保存隐私设置
const saveSettings = async () => {
  if (isSaving.value) return
  
  isSaving.value = true
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 整合隐私设置数据
    const privacySettings = {
      profileVisibility: profileVisibility.value,
      phoneVisibility: phoneVisibility.value,
      schoolVisibility: schoolVisibility.value,
      articleVisibility: articleVisibility.value,
      productVisibility: productVisibility.value,
      historyVisibility: historyVisibility.value,
      friendRequestSetting: friendRequestSetting.value,
      messageSetting: messageSetting.value,
      showOnlineStatus: showOnlineStatus.value,
      shareLocation: shareLocation.value,
      allowAnalytics: allowAnalytics.value,
      allowPersonalization: allowPersonalization.value
    }
    
    console.log('保存隐私设置', privacySettings)
    
    // 显示成功消息
    showToastMessage('隐私设置已保存')
    isSaving.value = false
  } catch (error) {
    console.error('保存隐私设置失败', error)
    showToastMessage('保存隐私设置失败，请重试')
    isSaving.value = false
  }
}

// 导出用户数据
const requestDataExport = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 显示提示消息
    showToastMessage('数据导出请求已提交，我们将在24小时内发送到您的邮箱')
  } catch (error) {
    console.error('请求数据导出失败', error)
    showToastMessage('请求数据导出失败，请重试')
  }
}

// 删除账号
const deleteAccount = async () => {
  if (!confirmPassword.value) {
    showToastMessage('请输入密码确认')
    return
  }
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 关闭确认弹窗
    showDeleteConfirm.value = false
    confirmPassword.value = ''
    
    // 显示成功消息
    showToastMessage('账号删除请求已提交，将在7天内处理')
    
    // 登出用户
    await userStore.userLogout()
    
    // 5秒后重定向到登录页
    setTimeout(() => {
      router.push('/login')
    }, 5000)
  } catch (error) {
    console.error('删除账号失败', error)
    showToastMessage('删除账号失败，请重试')
  }
}

// 显示提示消息
const showToastMessage = (message) => {
  toastMessage.value = message
  showToast.value = true
  
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面加载时获取隐私设置
onMounted(() => {
  fetchUserPrivacySettings()
})
</script>