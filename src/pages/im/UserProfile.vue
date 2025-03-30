<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="个人资料"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder
    />
    
    <!-- 用户信息 -->
    <div class="user-profile">
      <!-- 基本信息卡片 -->
      <div class="profile-card">
        <van-skeleton title avatar :row="3" :loading="loading">
          <div class="profile-header">
            <van-image
              round
              width="80"
              height="80"
              :src="userInfo.avatar"
              fit="cover"
            >
              <template #error>
                <div class="avatar-fallback">{{ getInitials(userInfo.name) }}</div>
              </template>
            </van-image>
            
            <div class="user-status" :class="{ online: userInfo.onlineStatus === 'online' }">
              {{ userInfo.onlineStatus === 'online' ? '在线' : '离线' }}
            </div>
          </div>
          
          <div class="profile-info">
            <div class="user-name">{{ userInfo.name }}</div>
            <div class="user-id">ID: {{ userInfo.id }}</div>
            
            <div v-if="userInfo.note" class="user-note">备注: {{ userInfo.note }}</div>
            
            <div class="user-details">
              <div class="detail-item">
                <van-icon name="location-o" />
                <span>{{ userInfo.school }}</span>
              </div>
              <div class="detail-item">
                <van-icon name="bookmark-o" />
                <span>{{ userInfo.department }}</span>
              </div>
              <div v-if="userInfo.addTime" class="detail-item">
                <van-icon name="clock-o" />
                <span>添加于 {{ formatDate(userInfo.addTime) }}</span>
              </div>
            </div>
            
            <div v-if="userInfo.bio" class="user-bio">
              <div class="bio-title">个人简介</div>
              <div class="bio-content">{{ userInfo.bio }}</div>
            </div>
          </div>
        </van-skeleton>
      </div>
      
      <!-- 好友关系 -->
      <div class="friend-actions">
        <van-skeleton :row="1" :loading="loading">
          <!-- 不是好友 -->
          <template v-if="userInfo.friendStatus === 'none'">
            <van-button 
              type="primary" 
              block 
              icon="plus" 
              @click="handleAddFriend"
            >
              添加为好友
            </van-button>
          </template>
          
          <!-- 等待验证 -->
          <template v-else-if="userInfo.friendStatus === 'pending'">
            <van-button 
              type="default" 
              block 
              disabled
            >
              好友申请已发送
            </van-button>
          </template>
          
          <!-- 已是好友 -->
          <template v-else-if="userInfo.friendStatus === 'friend'">
            <div class="friend-buttons">
              <van-button 
                type="primary" 
                icon="chat-o"
                @click="startChat"
              >
                发消息
              </van-button>
              
              <van-button 
                plain 
                type="primary"
                icon="setting-o"
                @click="showActionSheet = true"
              >
                设置
              </van-button>
            </div>
          </template>
        </van-skeleton>
      </div>
    </div>
    
    <!-- 操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="friendActions"
      cancel-text="取消"
      @select="onActionSelect"
    />
    
    <!-- 设置备注弹窗 -->
    <van-dialog
      v-model:show="showSetNoteDialog"
      title="设置备注"
      show-cancel-button
      @confirm="confirmSetNote"
    >
      <van-field
        v-model="noteText"
        placeholder="请输入备注名"
        clearable
      />
    </van-dialog>
    
    <!-- 添加好友弹窗 -->
    <van-dialog
      v-model:show="showAddFriendDialog"
      title="添加好友"
      show-cancel-button
      @confirm="confirmAddFriend"
    >
      <van-field
        v-model="requestMessage"
        type="textarea"
        placeholder="请输入验证信息"
        rows="3"
        autosize
      />
    </van-dialog>
    
    <!-- 删除好友确认弹窗 -->
    <van-dialog
      v-model:show="showDeleteFriendDialog"
      title="删除好友"
      message="删除后对方将从你的好友列表消失，同时你也将从对方的好友列表消失"
      show-cancel-button
      @confirm="confirmDeleteFriend"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import { getUserDetail, setFriendNote, deleteFriend, sendFriendRequest } from '@/api/im'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const userId = route.params.id

// 状态
const loading = ref(true)
const userInfo = ref({})
const showActionSheet = ref(false)
const showSetNoteDialog = ref(false)
const showAddFriendDialog = ref(false)
const showDeleteFriendDialog = ref(false)
const noteText = ref('')
const requestMessage = ref('')

// 好友操作菜单
const friendActions = [
  { name: '设置备注', color: '#1989fa' },
  { name: '删除好友', color: '#ee0a24' }
]

// 获取用户详情
const fetchUserDetail = async () => {
  loading.value = true
  
  try {
    const response = await getUserDetail(userId)
    if (response.code === 200) {
      userInfo.value = response.data
      noteText.value = userInfo.value.note || ''
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

// 添加好友
const handleAddFriend = () => {
  requestMessage.value = `我是${localStorage.getItem('userName') || '新用户'}，请求添加您为好友`
  showAddFriendDialog.value = true
}

// 确认添加好友
const confirmAddFriend = async () => {
  const loading = showLoadingToast({
    message: '发送申请中...',
    forbidClick: true
  })
  
  try {
    const response = await sendFriendRequest({
      userId: userInfo.value.id,
      message: requestMessage.value
    })
    
    if (response.code === 200) {
      showSuccessToast('好友申请已发送')
      userInfo.value.friendStatus = 'pending'
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

// 开始聊天
const startChat = () => {
  router.push(`/im/chat/${userInfo.value.id}?name=${encodeURIComponent(userInfo.value.name)}`)
}

// 选择操作菜单项
const onActionSelect = (action) => {
  if (action.name === '设置备注') {
    showSetNoteDialog.value = true
  } else if (action.name === '删除好友') {
    showDeleteFriendDialog.value = true
  }
}

// 确认设置备注
const confirmSetNote = async () => {
  const loading = showLoadingToast({
    message: '设置中...',
    forbidClick: true
  })
  
  try {
    const response = await setFriendNote({
      userId: userInfo.value.id,
      note: noteText.value
    })
    
    if (response.code === 200) {
      showSuccessToast('设置成功')
      userInfo.value.note = noteText.value
    } else {
      showToast(response.message || '设置失败')
    }
  } catch (error) {
    console.error('设置备注失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    closeToast(loading)
  }
}

// 确认删除好友
const confirmDeleteFriend = async () => {
  const loading = showLoadingToast({
    message: '删除中...',
    forbidClick: true
  })
  
  try {
    const response = await deleteFriend(userInfo.value.id)
    
    if (response.code === 200) {
      showSuccessToast('删除成功')
      userInfo.value.friendStatus = 'none'
    } else {
      showToast(response.message || '删除失败')
    }
  } catch (error) {
    console.error('删除好友失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    closeToast(loading)
  }
}

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY年MM月DD日')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUserDetail()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 2rem;
}

.user-profile {
  padding: 1rem;
}

.profile-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;
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
  font-size: 2rem;
}

.user-status {
  position: absolute;
  bottom: 0;
  right: calc(50% - 40px);
  background-color: #cccccc;
  color: white;
  font-size: 0.8rem;
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  transform: translateX(-50%);
}

.user-status.online {
  background-color: #4cd964;
}

.profile-info {
  text-align: center;
}

.user-name {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.user-id {
  font-size: 0.9rem;
  color: #999;
  margin-bottom: 0.5rem;
}

.user-note {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
  padding: 0.2rem 0.8rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  display: inline-block;
}

.user-details {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
}

.detail-item .van-icon {
  margin-right: 0.5rem;
  color: #999;
}

.user-bio {
  text-align: left;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f5f5f5;
}

.bio-title {
  font-size: 0.9rem;
  color: #999;
  margin-bottom: 0.5rem;
}

.bio-content {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
}

.friend-actions {
  margin-bottom: 1rem;
}

.friend-buttons {
  display: flex;
  gap: 1rem;
}

.friend-buttons .van-button {
  flex: 1;
}
</style>