<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="群聊列表"
      left-arrow
      fixed
      placeholder
      right-text="创建"
      @click-left="onClickLeft"
      @click-right="showCreateGroup = true"
    />
    
    <!-- 群聊列表 -->
    <div class="group-list-container">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-empty v-if="groups.length === 0 && !loading" description="暂无群聊" />
        
        <div v-else class="group-list">
          <div
            v-for="group in groups"
            :key="group.id"
            class="group-item"
            @click="enterGroup(group)"
          >
            <van-image
              round
              width="50"
              height="50"
              :src="group.avatar || defaultGroupAvatar"
              fit="cover"
            >
              <template #error>
                <div class="avatar-fallback">{{ getInitials(group.name) }}</div>
              </template>
            </van-image>
            
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-data">{{ group.memberCount }}人</div>
            </div>
          </div>
        </div>
      </van-pull-refresh>
      
      <!-- 加载中状态 -->
      <van-overlay :show="loading" z-index="1000">
        <div class="loading-container">
          <van-loading type="spinner" color="#1989fa" />
        </div>
      </van-overlay>
    </div>
    
    <!-- 创建群聊弹窗 -->
    <van-popup
      v-model:show="showCreateGroup"
      round
      position="bottom"
      :style="{ height: '70%' }"
    >
      <div class="popup-header">
        <div class="popup-title">创建群聊</div>
        <van-icon name="cross" class="close-icon" @click="showCreateGroup = false" />
      </div>
      
      <div class="popup-content">
        <div class="form-section">
          <van-field
            v-model="groupName"
            label="群名称"
            placeholder="请输入群聊名称"
            maxlength="20"
            show-word-limit
          />
          
          <van-field
            v-model="groupDescription"
            label="群介绍"
            type="textarea"
            placeholder="请输入群介绍"
            rows="3"
            maxlength="100"
            show-word-limit
          />
          
          <div class="avatar-upload">
            <div class="avatar-label">群头像</div>
            <van-uploader
              v-model="groupAvatar"
              :max-count="1"
              :after-read="afterAvatarRead"
            />
          </div>
        </div>
        
        <div class="select-members">
          <div class="section-title">选择好友</div>
          
          <van-search
            v-model="searchText"
            placeholder="搜索好友"
            shape="round"
            clearable
          />
          
          <div class="friend-selection">
            <van-checkbox-group v-model="selectedMembers">
              <div
                v-for="friend in filteredFriends"
                :key="friend.id"
                class="friend-item"
              >
                <van-checkbox 
                  :name="friend.id"
                  shape="square"
                  icon-size="18px"
                >
                  <div class="friend-item-content">
                    <van-image
                      round
                      width="40"
                      height="40"
                      :src="friend.avatar"
                      fit="cover"
                    >
                      <template #error>
                        <div class="avatar-fallback-sm">{{ getInitials(friend.name) }}</div>
                      </template>
                    </van-image>
                    
                    <div class="friend-name-sm">{{ friend.name }}</div>
                  </div>
                </van-checkbox>
              </div>
            </van-checkbox-group>
          </div>
        </div>
        
        <div class="btn-section">
          <van-button 
            type="primary" 
            block 
            :disabled="!isFormValid"
            :loading="creating"
            @click="createGroupChat"
          >
            创建群聊
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import { getGroupList, createGroup, getFriendList } from '@/api/im'

const router = useRouter()
const groups = ref([])
const loading = ref(false)
const refreshing = ref(false)
const showCreateGroup = ref(false)
const groupName = ref('')
const groupDescription = ref('')
const groupAvatar = ref([])
const searchText = ref('')
const selectedMembers = ref([])
const creating = ref(false)
const friends = ref([])

// 默认群头像
const defaultGroupAvatar = 'https://api.dicebear.com/6.x/identicon/svg?seed=group'

// 导航返回
const onClickLeft = () => {
  router.back()
}

// 过滤好友列表
const filteredFriends = computed(() => {
  if (!searchText.value) return friends.value
  
  return friends.value.filter(friend => 
    friend.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 表单验证
const isFormValid = computed(() => {
  return groupName.value.trim() !== '' && selectedMembers.value.length > 0
})

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 加载群聊列表
const loadGroups = async () => {
  loading.value = true
  
  try {
    const response = await getGroupList()
    
    if (response.code === 200) {
      groups.value = response.data
    } else {
      showToast(response.message || '获取群聊列表失败')
    }
  } catch (error) {
    console.error('获取群聊列表失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载好友列表
const loadFriends = async () => {
  try {
    const response = await getFriendList()
    
    if (response.code === 200) {
      friends.value = response.data
    } else {
      showToast(response.message || '获取好友列表失败')
    }
  } catch (error) {
    console.error('获取好友列表失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

// 刷新数据
const onRefresh = () => {
  loadGroups()
}

// 进入群聊
const enterGroup = (group) => {
  router.push(`/im/group/${group.id}?name=${encodeURIComponent(group.name)}`)
}

// 头像上传后处理
const afterAvatarRead = (file) => {
  // 图片大小限制（2MB）
  if (file.file.size > 2 * 1024 * 1024) {
    showToast('图片大小不能超过2MB')
    groupAvatar.value = []
    return
  }
  
  // 本地预览处理
  // 实际项目中可能需要调用上传API并处理响应
}

// 创建群聊
const createGroupChat = async () => {
  if (!isFormValid.value) return
  
  creating.value = true
  const loadingToast = showLoadingToast({
    message: '创建中...',
    forbidClick: true
  })
  
  try {
    // 构建请求数据
    const data = {
      name: groupName.value,
      description: groupDescription.value,
      memberIds: selectedMembers.value
    }
    
    // 如果有上传头像，这里需要处理头像上传
    // 此处简化处理，实际项目中可能需要先上传图片获取URL
    
    const response = await createGroup(data)
    
    if (response.code === 200) {
      showSuccessToast('群聊创建成功')
      
      // 重置表单
      groupName.value = ''
      groupDescription.value = ''
      groupAvatar.value = []
      selectedMembers.value = []
      
      // 关闭弹窗并刷新列表
      showCreateGroup.value = false
      loadGroups()
      
      // 进入新建的群聊
      router.push(`/im/group/${response.data.id}?name=${encodeURIComponent(response.data.name)}`)
    } else {
      showToast(response.message || '创建群聊失败')
    }
  } catch (error) {
    console.error('创建群聊失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    creating.value = false
    closeToast(loadingToast)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadGroups()
  loadFriends()
})
</script>

<style scoped>
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.group-list-container {
  flex: 1;
  overflow: hidden;
}

.group-list {
  padding: 1rem;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: white;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  font-size: 1.2rem;
}

.avatar-fallback-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #e1e1e1;
  color: #666;
  font-weight: bold;
  font-size: 1rem;
}

.group-info {
  margin-left: 1rem;
  flex: 1;
}

.group-name {
  font-weight: 500;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.group-data {
  font-size: 0.8rem;
  color: #999;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.popup-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 1rem;
  border-bottom: 1px solid #f5f5f5;
}

.popup-title {
  font-size: 1rem;
  font-weight: bold;
}

.close-icon {
  position: absolute;
  right: 1rem;
  top: 1rem;
  font-size: 1.2rem;
}

.popup-content {
  height: calc(100% - 3.5rem);
  overflow-y: auto;
  padding: 1rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.avatar-upload {
  display: flex;
  align-items: center;
  padding: 1rem 0;
}

.avatar-label {
  margin-right: 1rem;
  width: 6.2em;
  color: #646566;
}

.select-members {
  margin-bottom: 1.5rem;
}

.section-title {
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: #323233;
}

.friend-selection {
  max-height: 250px;
  overflow-y: auto;
  background-color: #f7f8fa;
  border-radius: 8px;
  padding: 0.5rem;
}

.friend-item {
  padding: 0.5rem;
}

.friend-item-content {
  display: flex;
  align-items: center;
}

.friend-name-sm {
  margin-left: 0.75rem;
}

.btn-section {
  margin-top: 2rem;
}
</style>