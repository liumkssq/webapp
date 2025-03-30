<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="个人资料"
      left-arrow
      fixed
      placeholder
      @click-left="onClickLeft"
    />
    
    <div class="profile-content" v-if="user">
      <!-- 用户信息 -->
      <div class="user-card">
        <div class="avatar-section">
          <van-image
            round
            width="80"
            height="80"
            :src="user.avatar"
            fit="cover"
          >
            <template #error>
              <div class="avatar-fallback">{{ getInitials(user.name) }}</div>
            </template>
          </van-image>
        </div>
        
        <div class="info-section">
          <div class="user-name">{{ user.name }}</div>
          <div class="user-id">ID: {{ user.id }}</div>
          <div class="user-status" :class="user.status">
            {{ statusText }}
          </div>
        </div>
      </div>
      
      <!-- 个人信息 -->
      <van-cell-group inset class="info-group">
        <van-cell title="学校" :value="user.school || '未设置'" />
        <van-cell title="专业" :value="user.major || '未设置'" />
        <van-cell title="年级" :value="user.grade || '未设置'" />
        <van-cell title="个性签名" :label="user.bio || '这个人很懒，什么都没留下'" />
      </van-cell-group>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <!-- 陌生人操作 -->
        <template v-if="!isFriend && !isCurrentUser">
          <van-button 
            type="primary" 
            block 
            class="action-btn"
            @click="showAddFriendPopup = true"
          >
            添加好友
          </van-button>
        </template>
        
        <!-- 好友操作 -->
        <template v-if="isFriend && !isCurrentUser">
          <van-button 
            type="primary" 
            block 
            class="action-btn"
            @click="startChat"
          >
            发送消息
          </van-button>
          
          <van-button 
            plain 
            block 
            class="action-btn"
            @click="showSettings = true"
          >
            好友设置
          </van-button>
        </template>
        
        <!-- 自己的资料 -->
        <template v-if="isCurrentUser">
          <van-button 
            type="primary" 
            block 
            class="action-btn"
            @click="editProfile"
          >
            编辑资料
          </van-button>
        </template>
      </div>
    </div>
    
    <!-- 加载中状态 -->
    <div v-else-if="loading" class="loading-container">
      <van-loading type="spinner" size="24px" vertical>加载中...</van-loading>
    </div>
    
    <!-- 错误状态 -->
    <van-empty v-else description="用户不存在或已被删除" />
    
    <!-- 添加好友弹窗 -->
    <van-dialog
      v-model:show="showAddFriendPopup"
      title="添加好友"
      show-cancel-button
      @confirm="sendFriendRequest"
    >
      <div class="friend-request-form">
        <van-field
          v-model="friendRequestMessage"
          rows="3"
          autosize
          label="验证消息"
          type="textarea"
          maxlength="50"
          placeholder="请输入验证消息"
          show-word-limit
        />
      </div>
    </van-dialog>
    
    <!-- 好友设置弹窗 -->
    <van-action-sheet
      v-model:show="showSettings"
      title="好友设置"
      cancel-text="取消"
    >
      <div class="setting-options">
        <div class="setting-item">
          <van-field
            v-model="friendRemark"
            label="备注名"
            placeholder="设置备注名"
            input-align="right"
            @blur="updateFriendRemark"
          />
        </div>
        
        <van-cell title="设为星标好友" center>
          <template #right-icon>
            <van-switch v-model="isStarred" size="24" @change="toggleStar" />
          </template>
        </van-cell>
        
        <van-cell 
          title="删除好友" 
          class="delete-friend" 
          @click="showDeleteConfirm = true"
        />
      </div>
    </van-action-sheet>
    
    <!-- 删除好友确认 -->
    <van-dialog
      v-model:show="showDeleteConfirm"
      title="删除好友"
      message="删除好友后，将同时删除与该好友的聊天记录，是否确认删除？"
      show-cancel-button
      @confirm="deleteFriendAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import { 
  getFriendDetail, 
  deleteFriend, 
  setFriendRemark,
  sendFriendRequest as apiSendFriendRequest 
} from '@/api/im'

const route = useRoute()
const router = useRouter()
const userId = computed(() => Number(route.params.id))
const user = ref(null)
const loading = ref(true)
const isFriend = ref(false)
const isCurrentUser = computed(() => userId.value === 1) // 假设当前用户ID为1
const friendRemark = ref('')
const isStarred = ref(false)
const showSettings = ref(false)
const showDeleteConfirm = ref(false)
const showAddFriendPopup = ref(false)
const friendRequestMessage = ref('我是xxx，请求添加您为好友')

// 状态文本
const statusText = computed(() => {
  if (!user.value) return ''
  
  switch (user.value.status) {
    case 'online':
      return '在线'
    case 'offline':
      return '离线'
    case 'busy':
      return '忙碌中'
    default:
      return '离线'
  }
})

// 导航返回
const onClickLeft = () => {
  router.back()
}

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 加载用户信息
const loadUserInfo = async () => {
  loading.value = true
  
  try {
    // 根据是否为好友调用不同接口
    const response = await getFriendDetail(userId.value)
    
    if (response.code === 200) {
      user.value = response.data
      isFriend.value = !!response.data.friendInfo
      
      // 如果是好友，加载备注信息等
      if (isFriend.value && response.data.friendInfo) {
        friendRemark.value = response.data.friendInfo.remark || ''
        isStarred.value = response.data.friendInfo.isStarred || false
      }
    } else {
      showToast(response.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 发起聊天
const startChat = () => {
  router.push(`/im/chat/${userId.value}?name=${encodeURIComponent(user.value.name)}`)
}

// 编辑资料
const editProfile = () => {
  router.push('/user/profile')
}

// 发送好友申请
const sendFriendRequest = async () => {
  const loading = showLoadingToast({
    message: '发送申请中...',
    forbidClick: true
  })
  
  try {
    const response = await apiSendFriendRequest({
      userId: userId.value,
      message: friendRequestMessage.value
    })
    
    if (response.code === 200) {
      showSuccessToast('好友申请已发送')
    } else {
      showToast(response.message || '发送申请失败')
    }
  } catch (error) {
    console.error('发送好友申请失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    closeToast(loading)
  }
}

// 更新好友备注
const updateFriendRemark = async () => {
  if (!friendRemark.value.trim()) {
    return
  }
  
  try {
    const response = await setFriendRemark(userId.value, friendRemark.value)
    
    if (response.code === 200) {
      showSuccessToast('备注已更新')
    } else {
      showToast(response.message || '更新备注失败')
    }
  } catch (error) {
    console.error('更新好友备注失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

// 设置星标好友
const toggleStar = async () => {
  // 此处需要添加设置星标好友的API调用
  showSuccessToast(isStarred.value ? '已设为星标好友' : '已取消星标')
}

// 删除好友
const deleteFriendAction = async () => {
  const loading = showLoadingToast({
    message: '处理中...',
    forbidClick: true
  })
  
  try {
    const response = await deleteFriend(userId.value)
    
    if (response.code === 200) {
      showSuccessToast('已删除好友')
      showSettings.value = false
      // 删除后更新状态
      isFriend.value = false
    } else {
      showToast(response.message || '删除好友失败')
    }
  } catch (error) {
    console.error('删除好友失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    closeToast(loading)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.profile-content {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.user-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.avatar-section {
  margin-right: 1.5rem;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #e1e1e1;
  color: #666;
  font-weight: bold;
  font-size: 1.8rem;
}

.info-section {
  flex: 1;
}

.user-name {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.user-id {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.user-status {
  font-size: 0.9rem;
  color: #999;
}

.user-status.online {
  color: #4cd964;
}

.user-status.busy {
  color: #ff9500;
}

.info-group {
  margin-bottom: 1.5rem;
}

.action-buttons {
  margin-top: 2rem;
}

.action-btn {
  margin-bottom: 1rem;
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.friend-request-form {
  padding: 1rem;
}

.setting-options {
  padding: 1rem 0;
}

.setting-item {
  margin-bottom: 1rem;
}

.delete-friend {
  color: #ff3b30;
  margin-top: 1rem;
}

:deep(.van-switch--on) {
  background-color: #4cd964;
}
</style>