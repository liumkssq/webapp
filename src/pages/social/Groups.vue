<template>
  <div class="groups-page">
    <!-- 头部导航 -->
    <header-nav title="我的群组" />
    
    <!-- 主要内容 -->
    <div class="content">
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button
          round
          type="primary"
          icon="plus"
          class="create-group-btn"
          @click="showCreateGroupDialog"
        >
          创建群组
        </van-button>
        
        <van-button
          round
          type="info"
          icon="friends-o"
          class="join-group-btn"
          @click="showJoinGroupDialog"
        >
          加入群组
        </van-button>
      </div>
      
      <!-- 群组列表 -->
      <div class="groups-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <van-loading type="spinner" color="#1989fa" />
          <p class="loading-text">加载中...</p>
        </div>
        
        <!-- 群组列表 -->
        <div v-else>
          <van-list
            v-model:loading="loadingMore"
            :finished="finished"
            finished-text="暂无更多群组"
            @load="loadMoreGroups"
          >
            <van-cell-group v-if="groupList.length > 0">
              <van-cell
                v-for="group in groupList"
                :key="group.id"
                class="group-cell"
                @click="enterGroupChat(group.id)"
              >
                <template #title>
                  <div class="group-item">
                    <!-- 群组头像 -->
                    <van-image
                      round
                      width="50"
                      height="50"
                      :src="group.avatar"
                      fit="cover"
                    >
                      <template #error>
                        <div class="avatar-fallback">{{ getGroupInitials(group.name) }}</div>
                      </template>
                    </van-image>
                    
                    <!-- 群组信息 -->
                    <div class="group-info">
                      <div class="group-name">
                        {{ group.name }}
                        <span class="group-badge" v-if="group.isOfficial">
                          <van-icon name="certificate" color="#1989fa" />
                        </span>
                      </div>
                      <div class="group-members">
                        {{ group.memberCount }}人
                        <span v-if="group.creatorId === userInfo.id" class="creator-badge">
                          创建者
                        </span>
                        <span v-else-if="group.isAdmin" class="admin-badge">
                          管理员
                        </span>
                      </div>
                      <div class="group-notice" v-if="group.notice">
                        {{ group.notice }}
                      </div>
                    </div>
                    
                    <!-- 未读消息 -->
                    <div v-if="group.unreadCount > 0" class="unread-badge">
                      {{ group.unreadCount > 99 ? '99+' : group.unreadCount }}
                    </div>
                  </div>
                </template>
              </van-cell>
            </van-cell-group>
            
            <!-- 空状态 -->
            <div v-else-if="!loadingMore" class="empty-container">
              <van-empty
                image="search"
                description="您还没有加入任何群组"
              >
                <template #bottom>
                  <van-button
                    round
                    type="primary"
                    size="small"
                    icon="plus"
                    @click="showCreateGroupDialog"
                  >
                    创建群组
                  </van-button>
                </template>
              </van-empty>
            </div>
          </van-list>
        </div>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <footer-nav />
    
    <!-- 创建群组弹窗 -->
    <van-dialog
      v-model:show="showCreateDialog"
      title="创建群组"
      show-cancel-button
      :before-close="beforeDialogClose"
      @confirm="createGroup"
    >
      <div class="dialog-content">
        <van-form>
          <van-field
            v-model="groupForm.name"
            name="name"
            label="群组名称"
            placeholder="请输入群组名称"
            :rules="[{ required: true, message: '请输入群组名称' }]"
          />
          
          <van-field
            v-model="groupForm.notice"
            name="notice"
            label="群公告"
            type="textarea"
            rows="2"
            placeholder="请输入群公告"
          />
          
          <van-field
            name="friends"
            label="邀请好友"
          >
            <template #input>
              <div class="friend-selector">
                <van-button
                  plain
                  size="small"
                  icon="plus"
                  @click="showFriendSelector"
                >
                  选择好友
                </van-button>
                
                <div v-if="selectedFriends.length > 0" class="selected-friends">
                  <div 
                    v-for="friend in selectedFriends" 
                    :key="friend.id"
                    class="selected-friend-item"
                  >
                    {{ friend.username }}
                    <van-icon 
                      name="cross" 
                      @click.stop="removeFriend(friend.id)" 
                    />
                  </div>
                </div>
              </div>
            </template>
          </van-field>
        </van-form>
      </div>
    </van-dialog>
    
    <!-- 加入群组弹窗 -->
    <van-dialog
      v-model:show="showJoinDialog"
      title="加入群组"
      show-cancel-button
      @confirm="joinGroup"
    >
      <div class="dialog-content">
        <van-field
          v-model="joinForm.groupId"
          label="群组ID"
          placeholder="请输入群组ID"
          :rules="[{ required: true, message: '请输入群组ID' }]"
        />
        
        <van-field
          v-model="joinForm.message"
          label="验证消息"
          type="textarea"
          rows="2"
          placeholder="请输入验证消息"
        />
      </div>
    </van-dialog>
    
    <!-- 好友选择器弹出层 -->
    <van-popup
      v-model:show="showFriendsPopup"
      position="bottom"
      round
      :style="{ height: '70%' }"
    >
      <div class="friend-popup-content">
        <div class="popup-header">
          <div class="popup-title">选择好友</div>
          <van-button
            plain
            type="primary"
            size="small"
            @click="confirmSelectedFriends"
          >
            确定({{ tempSelectedFriends.length }})
          </van-button>
        </div>
        
        <div class="popup-search">
          <van-search
            v-model="friendSearchKeyword"
            placeholder="搜索好友"
            @update:model-value="filterFriends"
          />
        </div>
        
        <div class="popup-list">
          <van-checkbox-group v-model="tempSelectedFriendIds">
            <van-cell-group>
              <van-cell
                v-for="friend in filteredFriends"
                :key="friend.id"
                clickable
                @click="toggleFriendSelection(friend.id)"
              >
                <template #title>
                  <div class="friend-item">
                    <van-checkbox
                      :name="friend.id"
                      shape="square"
                      @click.stop
                    />
                    <van-image
                      round
                      width="40"
                      height="40"
                      :src="friend.avatar"
                      fit="cover"
                      class="friend-avatar"
                    >
                      <template #error>
                        <div class="friend-avatar-fallback">{{ getInitials(friend.username) }}</div>
                      </template>
                    </van-image>
                    <div class="friend-name">{{ friend.username }}</div>
                  </div>
                </template>
              </van-cell>
            </van-cell-group>
          </van-checkbox-group>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import FooterNav from '@/components/FooterNav.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import { useUserStore } from '@/store/user'
import { useSocialStore } from '@/store/social'
import { showToast, showDialog } from 'vant'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const socialStore = useSocialStore()

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 本地状态
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const groupList = ref([])
const currentPage = ref(1)
const pageSize = 20

// 创建群组相关
const showCreateDialog = ref(false)
const groupForm = reactive({
  name: '',
  notice: ''
})
const selectedFriends = ref([])

// 加入群组相关
const showJoinDialog = ref(false)
const joinForm = reactive({
  groupId: '',
  message: ''
})

// 好友选择器相关
const showFriendsPopup = ref(false)
const friendSearchKeyword = ref('')
const tempSelectedFriendIds = ref([])
const tempSelectedFriends = ref([])
const filteredFriends = ref([])

// 加载群组列表
const loadGroups = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    finished.value = false
    loading.value = true
  }
  
  try {
    // 目前是模拟数据，实际项目中应该从API获取
    setTimeout(() => {
      const mockGroups = [
        {
          id: '1',
          name: '校园二手交易群',
          avatar: '',
          memberCount: 156,
          isOfficial: true,
          notice: '欢迎加入校园二手交易群，禁止发布违规内容',
          creatorId: '1',
          isAdmin: false,
          unreadCount: 5
        },
        {
          id: '2',
          name: '计算机学院2023级群',
          avatar: '',
          memberCount: 89,
          isOfficial: false,
          notice: '本群仅限计算机学院2023级学生加入',
          creatorId: userInfo.value.id || '0',
          isAdmin: true,
          unreadCount: 0
        },
        {
          id: '3',
          name: '校园活动通知群',
          avatar: '',
          memberCount: 238,
          isOfficial: true,
          notice: '发布校园活动相关信息',
          creatorId: '3',
          isAdmin: false,
          unreadCount: 12
        }
      ]
      
      if (reset) {
        groupList.value = mockGroups
      } else {
        // 模拟加载更多，实际项目中应根据API返回决定
        if (currentPage.value === 1) {
          groupList.value = [...mockGroups]
        } else {
          groupList.value = [...groupList.value]
        }
      }
      
      // 更新分页状态
      currentPage.value++
      finished.value = true // 模拟数据，一次加载全部
      
      loading.value = false
      loadingMore.value = false
    }, 1000)
  } catch (error) {
    console.error('加载群组列表失败:', error)
    showToast('加载群组列表失败，请稍后重试')
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多群组
const loadMoreGroups = () => {
  if (finished.value) return
  
  loadingMore.value = true
  loadGroups()
}

// 进入群聊
const enterGroupChat = (groupId) => {
  router.push(`/im/group/${groupId}`)
}

// 显示创建群组弹窗
const showCreateGroupDialog = () => {
  // 清空表单
  groupForm.name = ''
  groupForm.notice = ''
  selectedFriends.value = []
  
  showCreateDialog.value = true
}

// 显示加入群组弹窗
const showJoinGroupDialog = () => {
  // 清空表单
  joinForm.groupId = ''
  joinForm.message = ''
  
  showJoinDialog.value = true
}

// 创建群组
const createGroup = async () => {
  if (!groupForm.name) {
    showToast('请输入群组名称')
    return
  }
  
  try {
    // 模拟API调用
    setTimeout(() => {
      showToast({
        type: 'success',
        message: '群组创建成功'
      })
      
      // 重新加载群组列表
      loadGroups(true)
    }, 1000)
  } catch (error) {
    console.error('创建群组失败:', error)
    showToast('创建群组失败，请稍后重试')
  }
}

// 加入群组
const joinGroup = async () => {
  if (!joinForm.groupId) {
    showToast('请输入群组ID')
    return
  }
  
  try {
    // 模拟API调用
    setTimeout(() => {
      showToast({
        type: 'success',
        message: '已发送入群申请'
      })
    }, 1000)
  } catch (error) {
    console.error('发送入群申请失败:', error)
    showToast('发送入群申请失败，请稍后重试')
  }
}

// 显示好友选择器
const showFriendSelector = () => {
  // 初始化临时选择的好友
  tempSelectedFriendIds.value = selectedFriends.value.map(friend => friend.id)
  tempSelectedFriends.value = [...selectedFriends.value]
  
  // 加载好友列表并过滤
  loadFriendList()
  
  showFriendsPopup.value = true
}

// 加载好友列表
const loadFriendList = () => {
  // 从Pinia store中获取好友列表
  const friends = socialStore.allFriends
  
  if (friends.length === 0) {
    // 如果store中没有数据，尝试加载
    socialStore.loadFriendList()
  }
  
  // 设置过滤后的好友列表
  filteredFriends.value = socialStore.allFriends
}

// 过滤好友
const filterFriends = () => {
  if (!friendSearchKeyword.value) {
    filteredFriends.value = socialStore.allFriends
    return
  }
  
  const keyword = friendSearchKeyword.value.toLowerCase()
  filteredFriends.value = socialStore.allFriends.filter(friend => 
    friend.username.toLowerCase().includes(keyword)
  )
}

// 切换好友选择状态
const toggleFriendSelection = (friendId) => {
  const index = tempSelectedFriendIds.value.indexOf(friendId)
  
  if (index === -1) {
    // 选择该好友
    tempSelectedFriendIds.value.push(friendId)
    
    // 添加到临时选中列表
    const friend = socialStore.allFriends.find(f => f.id === friendId)
    if (friend) {
      tempSelectedFriends.value.push(friend)
    }
  } else {
    // 取消选择
    tempSelectedFriendIds.value.splice(index, 1)
    
    // 从临时选中列表移除
    const friendIndex = tempSelectedFriends.value.findIndex(f => f.id === friendId)
    if (friendIndex !== -1) {
      tempSelectedFriends.value.splice(friendIndex, 1)
    }
  }
}

// 确认选择的好友
const confirmSelectedFriends = () => {
  selectedFriends.value = [...tempSelectedFriends.value]
  showFriendsPopup.value = false
}

// 从已选好友中移除好友
const removeFriend = (friendId) => {
  const index = selectedFriends.value.findIndex(f => f.id === friendId)
  
  if (index !== -1) {
    selectedFriends.value.splice(index, 1)
  }
}

// 对话框关闭前的处理
const beforeDialogClose = (action, done) => {
  if (action === 'confirm') {
    // 在确认按钮点击时进行表单验证
    if (!groupForm.name) {
      showToast('请输入群组名称')
      done(false) // 阻止关闭
    } else {
      done() // 允许关闭
    }
  } else {
    // 取消按钮点击时直接关闭
    done()
  }
}

// 获取群组名称首字母作为头像占位
const getGroupInitials = (name) => {
  if (!name) return '群'
  return name.charAt(0)
}

// 获取用户名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 初始化页面
onMounted(() => {
  // 加载群组列表
  loadGroups(true)
})
</script>

<style scoped>
.groups-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.content {
  flex: 1;
  overflow: hidden;
  padding-bottom: 60px;
}

.action-buttons {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background-color: #fff;
  margin-bottom: 8px;
}

.create-group-btn,
.join-group-btn {
  width: 45%;
}

.groups-container {
  height: calc(100vh - 184px);
  overflow-y: auto;
}

.loading-container,
.empty-container {
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

.group-cell {
  padding: 12px 16px;
}

.group-item {
  display: flex;
  align-items: center;
  position: relative;
}

.group-info {
  margin-left: 12px;
  flex: 1;
}

.group-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.group-badge {
  margin-left: 6px;
  display: flex;
  align-items: center;
}

.group-members {
  font-size: 14px;
  color: #646566;
  margin-bottom: 4px;
}

.creator-badge,
.admin-badge {
  margin-left: 6px;
  font-size: 12px;
  padding: 0 4px;
  border-radius: 4px;
}

.creator-badge {
  color: #ee0a24;
  background-color: #fde8e8;
}

.admin-badge {
  color: #1989fa;
  background-color: #e6f7ff;
}

.group-notice {
  font-size: 12px;
  color: #969799;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}

.unread-badge {
  position: absolute;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  color: #fff;
  background-color: #ee0a24;
  border-radius: 8px;
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

.dialog-content {
  padding: 20px 16px;
}

.friend-selector {
  width: 100%;
}

.selected-friends {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  gap: 8px;
}

.selected-friend-item {
  display: flex;
  align-items: center;
  background-color: #f2f3f5;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 14px;
}

.selected-friend-item .van-icon {
  margin-left: 4px;
  font-size: 12px;
}

.friend-popup-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f2f3f5;
}

.popup-title {
  font-size: 16px;
  font-weight: 500;
}

.popup-search {
  padding: 8px 0;
}

.popup-list {
  flex: 1;
  overflow-y: auto;
}

.friend-item {
  display: flex;
  align-items: center;
}

.friend-avatar {
  margin: 0 12px;
}

.friend-avatar-fallback {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1989fa;
  color: white;
  font-size: 16px;
  font-weight: bold;
  border-radius: 50%;
}

.friend-name {
  flex: 1;
  font-size: 14px;
}
</style>