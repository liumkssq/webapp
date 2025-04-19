<template>
  <div class="add-friend-page">
    <!-- 头部导航 -->
    <header-nav title="添加好友" />
    
    <!-- 搜索区域 -->
    <div class="search-container">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索用户名、学号或邮箱"
        clearable
        shape="round"
        @search="searchUsers"
        @clear="clearSearch"
      />
      <div class="search-filter">
        <div 
          class="filter-item" 
          :class="{ active: searchType === 'username' }"
          @click="searchType = 'username'"
        >
          用户名
        </div>
        <div 
          class="filter-item" 
          :class="{ active: searchType === 'student_id' }"
          @click="searchType = 'student_id'"
        >
          学号
        </div>
        <div 
          class="filter-item" 
          :class="{ active: searchType === 'email' }"
          @click="searchType = 'email'"
        >
          邮箱
        </div>
      </div>
    </div>
    
    <!-- 扫码添加 -->
    <div class="qrcode-section">
      <van-cell is-link title="扫一扫添加" @click="scanQRCode">
        <template #icon>
          <van-icon name="qr" size="20" color="#1989fa" class="cell-icon" />
        </template>
      </van-cell>
      <van-cell is-link title="我的二维码" @click="showMyQRCode">
        <template #icon>
          <van-icon name="contact" size="20" color="#1989fa" class="cell-icon" />
        </template>
      </van-cell>
    </div>
    
    <!-- 搜索结果 -->
    <div class="search-results" v-if="hasSearched">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" color="#1989fa" />
        <p class="loading-text">搜索中...</p>
      </div>
      
      <!-- 结果列表 -->
      <van-list 
        v-else-if="searchResults.length > 0"
        v-model:loading="loadingMore"
        :finished="finished"
        finished-text="没有更多结果了"
        @load="loadMoreResults"
      >
        <van-cell-group>
          <van-cell
            v-for="user in searchResults"
            :key="user.id"
            class="user-cell"
          >
            <template #title>
              <div class="user-item">
                <!-- 用户头像 -->
                <van-image
                  round
                  width="50"
                  height="50"
                  :src="user.avatar"
                  fit="cover"
                  @click="viewUserProfile(user.id)"
                >
                  <template #error>
                    <div class="avatar-fallback">{{ getInitials(user.username) }}</div>
                  </template>
                </van-image>
                
                <!-- 用户信息 -->
                <div class="user-info" @click="viewUserProfile(user.id)">
                  <div class="user-name">
                    {{ user.username }}
                    <span class="user-badge" v-if="user.isVerified">
                      <van-icon name="certificate" color="#1989fa" />
                    </span>
                  </div>
                  <div class="user-bio" v-if="user.bio">{{ user.bio }}</div>
                  <div class="user-details">
                    <span v-if="user.school">{{ user.school }}</span>
                    <span v-if="user.studentId">· 学号: {{ user.studentId }}</span>
                  </div>
                </div>
              </div>
            </template>
            
            <!-- 添加好友按钮 -->
            <template #right-icon>
              <div class="user-action">
                <van-button
                  v-if="user.friendStatus === 'none'"
                  round
                  type="primary"
                  size="small"
                  @click="sendFriendRequest(user.id)"
                >
                  添加
                </van-button>
                <div 
                  v-else-if="user.friendStatus === 'pending'" 
                  class="status-text pending"
                >
                  请求已发送
                </div>
                <div 
                  v-else-if="user.friendStatus === 'friend'" 
                  class="status-text friend"
                >
                  已是好友
                </div>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </van-list>
      
      <!-- 空结果 -->
      <div v-else class="empty-container">
        <van-empty image="search" description="未找到匹配的用户" />
      </div>
    </div>
    
    <!-- 初始提示 -->
    <div v-else class="initial-hint">
      <van-empty 
        image="search" 
        description="搜索用户名、学号或邮箱添加好友"
      />
    </div>
    
    <!-- 底部导航 -->
    <footer-nav />
    
    <!-- 添加好友弹窗 -->
    <van-dialog
      v-model:show="showAddDialog"
      title="添加好友"
      show-cancel-button
      @confirm="confirmSendRequest"
    >
      <div class="dialog-content">
        <p>{{ selectedUser?.username ? `向 ${selectedUser.username} 发送好友请求` : '' }}</p>
        <van-field
          v-model="requestMessage"
          label="验证消息"
          placeholder="请输入验证消息"
          maxlength="50"
          show-word-limit
        />
      </div>
    </van-dialog>
    
    <!-- 我的二维码弹窗 -->
    <van-dialog
      v-model:show="showQRCodeDialog"
      title="我的二维码"
      :show-confirm-button="false"
    >
      <div class="qrcode-content">
        <div ref="qrcodeRef" class="qrcode-container"></div>
        <p class="qrcode-tip">扫描二维码添加我为好友</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { 
  searchUsers as apiSearchUsers, 
  sendFriendRequest as apiSendFriendRequest,
  getUserQRCode 
} from '@/api/social'
import FooterNav from '@/components/FooterNav.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import { useUserStore } from '@/store/user'
import { showToast, showDialog } from 'vant'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcodejs2-fix'

const router = useRouter()
const userStore = useUserStore()

// 本地状态
const searchKeyword = ref('')
const searchType = ref('username')
const searchResults = ref([])
const hasSearched = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(true)
const currentPage = ref(1)
const pageSize = 20
const selectedUser = ref(null)
const requestMessage = ref('')
const showAddDialog = ref(false)
const showQRCodeDialog = ref(false)
const qrcodeRef = ref(null)
const qrCodeInstance = ref(null)

// 搜索用户
const searchUsers = async () => {
  if (!searchKeyword.value.trim()) {
    showToast('请输入搜索关键词')
    return
  }
  
  currentPage.value = 1
  finished.value = false
  loading.value = true
  hasSearched.value = true
  
  try {
    const response = await apiSearchUsers({
      keyword: searchKeyword.value.trim(),
      type: searchType.value,
      page: currentPage.value,
      limit: pageSize
    })
    
    if (response.code === 200) {
      searchResults.value = response.data.items || []
      finished.value = searchResults.value.length >= response.data.total
      
      // 更新当前页码
      if (searchResults.value.length > 0) {
        currentPage.value++
      }
    } else {
      showToast(response.message || '搜索用户失败')
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    showToast('搜索用户失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载更多结果
const loadMoreResults = async () => {
  if (finished.value) return
  
  loadingMore.value = true
  
  try {
    const response = await apiSearchUsers({
      keyword: searchKeyword.value.trim(),
      type: searchType.value,
      page: currentPage.value,
      limit: pageSize
    })
    
    if (response.code === 200) {
      const newItems = response.data.items || []
      searchResults.value = [...searchResults.value, ...newItems]
      
      // 更新分页和完成状态
      currentPage.value++
      finished.value = searchResults.value.length >= response.data.total
    } else {
      showToast(response.message || '加载更多结果失败')
      finished.value = true
    }
  } catch (error) {
    console.error('加载更多结果失败:', error)
    showToast('加载更多结果失败，请稍后重试')
    finished.value = true
  } finally {
    loadingMore.value = false
  }
}

// 清除搜索
const clearSearch = () => {
  searchResults.value = []
  hasSearched.value = false
  finished.value = true
  currentPage.value = 1
}

// 发送好友请求
const sendFriendRequest = (userId) => {
  selectedUser.value = searchResults.value.find(user => user.id === userId)
  
  if (!selectedUser.value) {
    showToast('用户信息不存在')
    return
  }
  
  // 默认验证消息
  requestMessage.value = `我是 ${userStore.userInfo.username || ''}，请求添加您为好友`
  showAddDialog.value = true
}

// 确认发送好友请求
const confirmSendRequest = async () => {
  if (!selectedUser.value) return
  
  try {
    const response = await apiSendFriendRequest({
      userId: selectedUser.value.id,
      message: requestMessage.value.trim()
    })
    
    if (response.code === 200) {
      // 更新本地状态
      const index = searchResults.value.findIndex(user => user.id === selectedUser.value.id)
      
      if (index !== -1) {
        searchResults.value[index].friendStatus = 'pending'
      }
      
      showToast({
        type: 'success',
        message: '好友请求已发送'
      })
    } else {
      showToast(response.message || '发送好友请求失败')
    }
  } catch (error) {
    console.error('发送好友请求失败:', error)
    showToast('发送好友请求失败，请稍后重试')
  }
}

// 扫描二维码
const scanQRCode = () => {
  showToast('暂不支持，敬请期待！')
  // TODO: 实现扫码功能，依赖于原生能力
}

// 显示我的二维码
const showMyQRCode = async () => {
  showQRCodeDialog.value = true
  
  try {
    const response = await getUserQRCode()
    
    if (response.code === 200) {
      // 等待DOM更新后生成二维码
      setTimeout(() => {
        generateQRCode(response.data.qrcodeUrl || '')
      }, 100)
    } else {
      showToast(response.message || '获取二维码失败')
    }
  } catch (error) {
    console.error('获取二维码失败:', error)
    showToast('获取二维码失败，请稍后重试')
  }
}

// 生成二维码
const generateQRCode = (url) => {
  if (!qrcodeRef.value) return
  
  // 清除之前的二维码
  if (qrCodeInstance.value) {
    qrcodeRef.value.innerHTML = ''
  }
  
  // 生成新的二维码
  qrCodeInstance.value = new QRCode(qrcodeRef.value, {
    text: url,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  })
}

// 查看用户资料
const viewUserProfile = (userId) => {
  router.push(`/user/profile/${userId}`)
}

// 获取用户名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 当二维码弹窗关闭时清除二维码
watch(showQRCodeDialog, (newVal) => {
  if (!newVal && qrcodeRef.value) {
    qrcodeRef.value.innerHTML = ''
    qrCodeInstance.value = null
  }
})

// 当搜索类型改变时自动触发搜索
watch(searchType, () => {
  if (searchKeyword.value.trim() && hasSearched.value) {
    searchUsers()
  }
})
</script>

<style scoped>
.add-friend-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.search-container {
  padding: 8px 16px;
  background-color: #fff;
  position: sticky;
  top: 46px;
  z-index: 10;
}

.search-filter {
  display: flex;
  margin-top: 8px;
  margin-bottom: 8px;
}

.filter-item {
  padding: 4px 12px;
  margin-right: 8px;
  font-size: 14px;
  border-radius: 16px;
  background-color: #f2f3f5;
  color: #646566;
  transition: all 0.3s;
}

.filter-item.active {
  background-color: #e6f7ff;
  color: #1989fa;
}

.qrcode-section {
  margin-top: 8px;
  margin-bottom: 8px;
}

.cell-icon {
  margin-right: 8px;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

.loading-container,
.empty-container,
.initial-hint {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 200px;
  padding: 20px 0;
}

.loading-text {
  margin-top: 12px;
  color: #969799;
  font-size: 14px;
}

.user-cell {
  padding: 12px 16px;
}

.user-item {
  display: flex;
  align-items: center;
}

.user-info {
  margin-left: 12px;
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.user-badge {
  margin-left: 6px;
  display: flex;
  align-items: center;
}

.user-bio {
  font-size: 14px;
  color: #646566;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.user-details {
  font-size: 12px;
  color: #969799;
}

.user-action {
  display: flex;
  align-items: center;
}

.status-text {
  font-size: 14px;
}

.status-text.pending {
  color: #ff976a;
}

.status-text.friend {
  color: #07c160;
}

.dialog-content {
  padding: 20px 16px;
}

.avatar-fallback {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1989fa;
  color: white;
  font-size: 20px;
  font-weight: bold;
  border-radius: 50%;
}

.qrcode-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-container {
  width: 200px;
  height: 200px;
  margin-bottom: 16px;
}

.qrcode-tip {
  font-size: 14px;
  color: #969799;
  text-align: center;
}
</style>