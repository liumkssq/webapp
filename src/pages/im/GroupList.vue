<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="我的群聊"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder
    />
    
    <!-- 主要内容 -->
    <div class="group-content">
      <!-- 群聊列表 -->
      <div class="group-list">
        <empty-state
          v-if="groups.length === 0"
          icon="group"
          text="暂无群聊"
          sub-text="创建或加入群聊开始交流"
          action-text="创建群聊"
          @action="showCreateGroup = true"
        />
        
        <van-cell-group v-else inset>
          <van-cell
            v-for="group in groups"
            :key="group.id"
            center
            @click="handleGroupClick(group)"
          >
            <template #icon>
              <van-image
                round
                width="40"
                height="40"
                :src="group.avatar"
                fit="cover"
                class="avatar-image"
              >
                <template #error>
                  <div class="avatar-fallback">群</div>
                </template>
              </van-image>
            </template>
            <template #title>
              <span class="group-name">{{ group.name }}</span>
            </template>
            <template #label>
              <span class="group-members">{{ group.memberCount }}人</span>
              <span v-if="group.notice" class="group-notice">{{ truncateText(group.notice, 20) }}</span>
            </template>
            <template #right-icon>
              <van-icon v-if="group.isOwner" name="manager-o" color="#ff9d00" size="18" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </div>
    
    <!-- 创建群聊按钮 -->
    <van-fab
      class="create-group-btn"
      icon="plus"
      color="#007aff"
      @click="showCreateGroup = true"
    />
    
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
        <van-form @submit="onCreateGroup">
          <van-cell-group inset>
            <van-field
              v-model="groupForm.name"
              name="name"
              label="群名称"
              placeholder="请输入群名称"
              :rules="[{ required: true, message: '请填写群名称' }]"
            />
            
            <van-field
              v-model="groupForm.notice"
              name="notice"
              label="群公告"
              type="textarea"
              placeholder="请输入群公告"
              rows="2"
              autosize
            />
          </van-cell-group>
          
          <div class="select-members">
            <div class="section-title">选择成员</div>
            
            <van-search
              v-model="memberSearchText"
              placeholder="搜索好友"
              shape="round"
              clearable
            />
            
            <div class="selected-members" v-if="selectedMembers.length > 0">
              <div class="section-subtitle">已选择 ({{ selectedMembers.length }})</div>
              <div class="member-avatars">
                <div
                  v-for="member in selectedMembers"
                  :key="member.id"
                  class="selected-member"
                >
                  <van-image
                    round
                    width="40"
                    height="40"
                    :src="member.avatar"
                    fit="cover"
                  >
                    <template #error>
                      <div class="avatar-fallback">{{ getInitials(member.name) }}</div>
                    </template>
                  </van-image>
                  <div class="member-name">{{ member.name }}</div>
                  <van-icon
                    name="cross"
                    class="remove-member"
                    @click.stop="removeMember(member)"
                  />
                </div>
              </div>
            </div>
            
            <div class="friend-list">
              <div class="section-subtitle">好友列表</div>
              <van-checkbox-group v-model="selectedMemberIds">
                <van-cell-group inset>
                  <van-cell
                    v-for="friend in filteredFriends"
                    :key="friend.id"
                    clickable
                    @click="toggleMember(friend)"
                  >
                    <template #icon>
                      <van-image
                        round
                        width="40"
                        height="40"
                        :src="friend.avatar"
                        fit="cover"
                        class="avatar-image"
                      >
                        <template #error>
                          <div class="avatar-fallback">{{ getInitials(friend.name) }}</div>
                        </template>
                      </van-image>
                    </template>
                    <template #title>
                      <span class="friend-name">{{ friend.name }}</span>
                    </template>
                    <template #right-icon>
                      <van-checkbox
                        :name="friend.id"
                        shape="square"
                        @click.stop
                      />
                    </template>
                  </van-cell>
                </van-cell-group>
              </van-checkbox-group>
            </div>
          </div>
          
          <div style="margin: 16px;">
            <van-button
              round
              block
              type="primary"
              :disabled="selectedMembers.length === 0 || !groupForm.name"
              native-type="submit"
              :loading="creating"
            >
              创建群聊
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import { getGroupList, createGroup, getFriendList } from '@/api/im'
import HeaderNav from '@/components/HeaderNav.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()

// 状态
const groups = ref([])
const showCreateGroup = ref(false)
const groupForm = ref({
  name: '',
  notice: ''
})
const creating = ref(false)
const friends = ref([])
const selectedMemberIds = ref([])
const memberSearchText = ref('')

// 计算属性：选中的成员
const selectedMembers = computed(() => {
  return friends.value.filter(friend => selectedMemberIds.value.includes(friend.id))
})

// 计算属性：过滤后的好友列表（搜索用）
const filteredFriends = computed(() => {
  if (!memberSearchText.value) return friends.value
  
  return friends.value.filter(friend => 
    friend.name.toLowerCase().includes(memberSearchText.value.toLowerCase())
  )
})

// 获取群聊列表
const fetchGroups = async () => {
  try {
    const response = await getGroupList()
    if (response.code === 200) {
      groups.value = response.data.list
    } else {
      showToast(response.message || '获取群聊列表失败')
    }
  } catch (error) {
    console.error('获取群聊列表失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

// 获取好友列表（创建群聊时选择）
const fetchFriends = async () => {
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

// 点击群聊
const handleGroupClick = (group) => {
  router.push(`/im/group/${group.id}?name=${encodeURIComponent(group.name)}`)
}

// 切换成员选择
const toggleMember = (friend) => {
  const index = selectedMemberIds.value.indexOf(friend.id)
  if (index === -1) {
    selectedMemberIds.value.push(friend.id)
  } else {
    selectedMemberIds.value.splice(index, 1)
  }
}

// 移除已选成员
const removeMember = (member) => {
  const index = selectedMemberIds.value.indexOf(member.id)
  if (index !== -1) {
    selectedMemberIds.value.splice(index, 1)
  }
}

// 创建群聊
const onCreateGroup = async () => {
  if (selectedMembers.value.length === 0) {
    showToast('请至少选择一个成员')
    return
  }
  
  creating.value = true
  const loadingToast = showLoadingToast({
    message: '创建中...',
    forbidClick: true
  })
  
  try {
    const response = await createGroup({
      name: groupForm.value.name,
      notice: groupForm.value.notice,
      memberIds: selectedMemberIds.value
    })
    
    if (response.code === 200) {
      showSuccessToast('创建成功')
      
      // 重置表单
      groupForm.value = { name: '', notice: '' }
      selectedMemberIds.value = []
      showCreateGroup.value = false
      
      // 刷新群聊列表
      fetchGroups()
      
      // 跳转到新创建的群聊
      router.push(`/im/group/${response.data.groupId}?name=${encodeURIComponent(response.data.groupName)}`)
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

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// 组件挂载时获取数据
onMounted(() => {
  fetchGroups()
  fetchFriends()
})
</script>

<style scoped>
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.group-content {
  flex: 1;
  overflow: auto;
  padding: 1rem 0;
  position: relative;
}

.group-list {
  padding: 1rem;
}

.avatar-image {
  margin-right: 0.75rem;
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

.group-name {
  font-weight: 500;
}

.group-members {
  font-size: 0.8rem;
  color: #999;
  margin-right: 0.5rem;
}

.group-notice {
  font-size: 0.8rem;
  color: #999;
}

.create-group-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 99;
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
  padding-bottom: 1rem;
}

.section-title {
  font-weight: 500;
  margin: 1rem 1rem 0.5rem;
}

.section-subtitle {
  font-size: 0.9rem;
  color: #666;
  margin: 0.8rem 1rem 0.5rem;
}

.selected-members {
  margin-top: 1rem;
}

.member-avatars {
  display: flex;
  flex-wrap: wrap;
  padding: 0 0.5rem;
}

.selected-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20%;
  margin-bottom: 1rem;
  position: relative;
}

.member-name {
  font-size: 0.8rem;
  margin-top: 0.25rem;
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-member {
  position: absolute;
  top: -5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  font-size: 0.8rem;
  padding: 2px;
}

.friend-list {
  margin-top: 1rem;
}
</style>