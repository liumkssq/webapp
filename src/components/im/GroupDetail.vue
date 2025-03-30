<template>
  <div class="group-detail">
    <!-- 群组基本信息 -->
    <div class="group-header">
      <div class="avatar-container">
        <van-image
          round
          width="4rem"
          height="4rem"
          :src="group.avatar"
          fit="cover"
        >
          <template #error>
            <div class="avatar-fallback">
              <van-icon name="friends-o" size="2rem" />
            </div>
          </template>
        </van-image>
        
        <div v-if="isOwnerOrAdmin" class="avatar-edit" @click="handleAvatarEdit">
          <van-icon name="photograph" size="1.2rem" />
        </div>
      </div>
      
      <div class="group-info">
        <div class="group-name">
          <span>{{ group.name }}</span>
          <van-icon v-if="isOwnerOrAdmin" name="edit" @click="handleGroupNameEdit" />
        </div>
        <div class="group-id">群ID: {{ group.id }}</div>
        <div class="member-count">{{ group.memberCount }}人</div>
      </div>
    </div>
    
    <!-- 群公告 -->
    <div class="group-announcement">
      <div class="section-header">
        <span>群公告</span>
        <van-icon v-if="isOwnerOrAdmin" name="edit" @click="handleAnnouncementEdit" />
      </div>
      <div class="announcement-content" @click="isOwnerOrAdmin && handleAnnouncementEdit()">
        {{ group.announcement || '暂无公告，点击添加' }}
      </div>
    </div>
    
    <!-- 群组描述 -->
    <div class="group-description">
      <div class="section-header">
        <span>群介绍</span>
        <van-icon v-if="isOwnerOrAdmin" name="edit" @click="handleDescriptionEdit" />
      </div>
      <div class="description-content" @click="isOwnerOrAdmin && handleDescriptionEdit()">
        {{ group.description || '暂无介绍，点击添加' }}
      </div>
    </div>
    
    <!-- 群成员 -->
    <div class="group-members">
      <div class="section-header">
        <span>群成员 ({{ group.memberCount }})</span>
        <span class="view-all" @click="showAllMembers">查看全部 ></span>
      </div>
      
      <div class="member-grid">
        <!-- 显示前8个成员 -->
        <div
          v-for="member in displayMembers"
          :key="member.id"
          class="member-item"
          @click="handleMemberClick(member)"
        >
          <van-image
            round
            width="3rem"
            height="3rem"
            :src="member.avatar"
            fit="cover"
          >
            <template #error>
              <div class="avatar-fallback-small">{{ getInitials(member.name) }}</div>
            </template>
          </van-image>
          
          <div class="member-name">
            {{ member.name }}
            <span v-if="member.role === 'owner'" class="role owner">群主</span>
            <span v-else-if="member.role === 'admin'" class="role admin">管理员</span>
          </div>
        </div>
        
        <!-- 添加成员按钮 -->
        <div
          v-if="isOwnerOrAdmin"
          class="member-item add-member"
          @click="handleAddMember"
        >
          <div class="add-icon">
            <van-icon name="plus" size="1.5rem" />
          </div>
          <div class="member-name">邀请</div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮组 -->
    <div class="action-buttons">
      <div class="danger-zone" v-if="isOwner || isMember">
        <van-button
          v-if="isOwner"
          class="action-button danger"
          block
          @click="showTransferOwnerDialog"
        >
          转让群主
        </van-button>
        
        <van-button
          v-if="isOwner"
          class="action-button danger"
          block
          @click="showDisbandDialog"
        >
          解散群聊
        </van-button>
        
        <van-button
          v-if="isMember && !isOwner"
          class="action-button danger"
          block
          @click="showExitDialog"
        >
          退出群聊
        </van-button>
      </div>
    </div>
    
    <!-- 编辑群名对话框 -->
    <van-dialog
      v-model:show="showNameDialog"
      title="修改群聊名称"
      show-cancel-button
      @confirm="confirmEditName"
    >
      <van-field
        v-model="editName"
        placeholder="请输入群聊名称"
        maxlength="20"
        show-word-limit
      />
    </van-dialog>
    
    <!-- 编辑群公告对话框 -->
    <van-dialog
      v-model:show="showAnnouncementDialog"
      title="修改群公告"
      show-cancel-button
      @confirm="confirmEditAnnouncement"
    >
      <van-field
        v-model="editAnnouncement"
        type="textarea"
        placeholder="请输入群公告"
        :rows="4"
        maxlength="200"
        show-word-limit
      />
    </van-dialog>
    
    <!-- 编辑群介绍对话框 -->
    <van-dialog
      v-model:show="showDescriptionDialog"
      title="修改群介绍"
      show-cancel-button
      @confirm="confirmEditDescription"
    >
      <van-field
        v-model="editDescription"
        type="textarea"
        placeholder="请输入群介绍"
        :rows="4"
        maxlength="200"
        show-word-limit
      />
    </van-dialog>
    
    <!-- 成员操作菜单 -->
    <van-action-sheet
      v-model:show="showMemberActions"
      :actions="memberActions"
      cancel-text="取消"
      close-on-click-action
      @select="onMemberActionSelect"
    />
    
    <!-- 群成员列表弹窗 -->
    <van-popup
      v-model:show="showMembersPopup"
      position="bottom"
      round
      :style="{ height: '75%' }"
    >
      <div class="popup-header">
        <div class="popup-title">群成员 ({{ group.memberCount }})</div>
        <van-icon name="cross" @click="showMembersPopup = false" />
      </div>
      
      <div class="member-list">
        <van-search
          v-model="memberSearchText"
          placeholder="搜索群成员"
          shape="round"
          clearable
        />
        
        <div class="member-list-content">
          <div
            v-for="member in filteredMembers"
            :key="member.id"
            class="member-list-item"
            @click="handleMemberClick(member)"
          >
            <van-image
              round
              width="3rem"
              height="3rem"
              :src="member.avatar"
              fit="cover"
            >
              <template #error>
                <div class="avatar-fallback-small">{{ getInitials(member.name) }}</div>
              </template>
            </van-image>
            
            <div class="member-info">
              <div class="member-list-name">
                {{ member.name }}
                <span v-if="member.role === 'owner'" class="role owner">群主</span>
                <span v-else-if="member.role === 'admin'" class="role admin">管理员</span>
              </div>
              <div class="member-join-time">加入时间: {{ formatJoinTime(member.joinTime) }}</div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
    
    <!-- 转让群主弹窗 -->
    <van-dialog
      v-model:show="showTransferDialog"
      title="转让群主"
      message="请选择新群主"
      show-cancel-button
      confirm-button-text="确认转让"
      confirm-button-color="#ee0a24"
      @confirm="confirmTransferOwner"
    >
      <div class="transfer-member-list">
        <div
          v-for="member in transferCandidates"
          :key="member.id"
          class="transfer-member-item"
          :class="{ selected: selectedTransferMember === member.id }"
          @click="selectedTransferMember = member.id"
        >
          <van-image
            round
            width="2.5rem"
            height="2.5rem"
            :src="member.avatar"
            fit="cover"
          >
            <template #error>
              <div class="avatar-fallback-small">{{ getInitials(member.name) }}</div>
            </template>
          </van-image>
          
          <div class="transfer-member-name">{{ member.name }}</div>
          
          <van-icon v-if="selectedTransferMember === member.id" name="success" color="#07c160" />
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import dayjs from 'dayjs'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits([
  'update:group',
  'transfer-owner',
  'disband-group',
  'exit-group',
  'add-member',
  'remove-member',
  'set-admin'
])

const router = useRouter()

// 状态
const showNameDialog = ref(false)
const showAnnouncementDialog = ref(false)
const showDescriptionDialog = ref(false)
const showMemberActions = ref(false)
const showMembersPopup = ref(false)
const showTransferDialog = ref(false)
const showDisbandDialog = ref(false)
const showExitDialog = ref(false)

const editName = ref('')
const editAnnouncement = ref('')
const editDescription = ref('')
const memberSearchText = ref('')
const selectedMember = ref(null)
const selectedTransferMember = ref(null)

// 当前用户在群中的角色
const currentUserRole = computed(() => {
  const member = props.group.members.find(m => m.id === props.currentUserId)
  return member ? member.role : null
})

// 当前用户是否是群主
const isOwner = computed(() => currentUserRole.value === 'owner')

// 当前用户是否是管理员
const isAdmin = computed(() => currentUserRole.value === 'admin')

// 当前用户是否是群主或管理员
const isOwnerOrAdmin = computed(() => {
  return isOwner.value || isAdmin.value
})

// 当前用户是否是群成员
const isMember = computed(() => {
  return props.group.members.some(m => m.id === props.currentUserId)
})

// 显示在群组详情页的成员（最多显示8个）
const displayMembers = computed(() => {
  // 优先显示群主和管理员
  const sortedMembers = [...props.group.members].sort((a, b) => {
    if (a.role === 'owner') return -1
    if (b.role === 'owner') return 1
    if (a.role === 'admin') return -1
    if (b.role === 'admin') return 1
    return 0
  })
  
  return sortedMembers.slice(0, 8)
})

// 可以被转让为群主的成员（只能转让给非管理员）
const transferCandidates = computed(() => {
  return props.group.members.filter(m => 
    m.id !== props.currentUserId && m.role !== 'owner'
  )
})

// 根据搜索过滤群成员
const filteredMembers = computed(() => {
  if (!memberSearchText.value) return props.group.members
  
  return props.group.members.filter(member => 
    member.name.toLowerCase().includes(memberSearchText.value.toLowerCase())
  )
})

// 成员操作菜单
const memberActions = computed(() => {
  if (!selectedMember.value) return []
  
  const member = selectedMember.value
  const actions = []
  
  // 私聊选项对所有人可用
  actions.push({ name: '发起私聊', color: '#07c160' })
  
  // 群主和管理员可以管理成员
  if (isOwnerOrAdmin.value && member.id !== props.currentUserId) {
    // 群主可以设置和取消管理员
    if (isOwner.value) {
      if (member.role === 'admin') {
        actions.push({ name: '取消管理员', color: '#1989fa' })
      } else {
        actions.push({ name: '设为管理员', color: '#1989fa' })
      }
    }
    
    // 群主可以移除任何成员，管理员可以移除普通成员
    if (isOwner.value || (isAdmin.value && member.role !== 'owner' && member.role !== 'admin')) {
      actions.push({ name: '移出群聊', color: '#ee0a24' })
    }
  }
  
  return actions
})

// 获取姓名缩写
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 格式化加入时间
const formatJoinTime = (timestamp) => {
  if (!timestamp) return '未知'
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

// 处理群名称编辑
const handleGroupNameEdit = () => {
  editName.value = props.group.name
  showNameDialog.value = true
}

// 确认编辑群名称
const confirmEditName = async () => {
  if (!editName.value.trim()) {
    showToast('群名称不能为空')
    return
  }
  
  const loadingToast = showLoadingToast({
    message: '保存中...',
    forbidClick: true
  })
  
  try {
    // 在真实项目中这里应该调用API更新群名称
    // 更新本地数据
    emit('update:group', {
      ...props.group,
      name: editName.value
    })
    
    showToast('修改成功')
  } catch (error) {
    console.error('修改群名称失败:', error)
    showToast('修改失败，请重试')
  } finally {
    closeToast(loadingToast)
  }
}

// 处理群公告编辑
const handleAnnouncementEdit = () => {
  editAnnouncement.value = props.group.announcement || ''
  showAnnouncementDialog.value = true
}

// 确认编辑群公告
const confirmEditAnnouncement = async () => {
  const loadingToast = showLoadingToast({
    message: '保存中...',
    forbidClick: true
  })
  
  try {
    // 在真实项目中这里应该调用API更新群公告
    // 更新本地数据
    emit('update:group', {
      ...props.group,
      announcement: editAnnouncement.value
    })
    
    showToast('修改成功')
  } catch (error) {
    console.error('修改群公告失败:', error)
    showToast('修改失败，请重试')
  } finally {
    closeToast(loadingToast)
  }
}

// 处理群介绍编辑
const handleDescriptionEdit = () => {
  editDescription.value = props.group.description || ''
  showDescriptionDialog.value = true
}

// 确认编辑群介绍
const confirmEditDescription = async () => {
  const loadingToast = showLoadingToast({
    message: '保存中...',
    forbidClick: true
  })
  
  try {
    // 在真实项目中这里应该调用API更新群介绍
    // 更新本地数据
    emit('update:group', {
      ...props.group,
      description: editDescription.value
    })
    
    showToast('修改成功')
  } catch (error) {
    console.error('修改群介绍失败:', error)
    showToast('修改失败，请重试')
  } finally {
    closeToast(loadingToast)
  }
}

// 处理头像编辑
const handleAvatarEdit = () => {
  // 在真实项目中，这里应该打开文件选择器
  showToast('头像修改功能开发中')
}

// 显示所有成员
const showAllMembers = () => {
  memberSearchText.value = ''
  showMembersPopup.value = true
}

// 处理成员点击
const handleMemberClick = (member) => {
  selectedMember.value = member
  showMemberActions.value = true
}

// 处理成员操作选择
const onMemberActionSelect = (action) => {
  if (!selectedMember.value) return
  
  const member = selectedMember.value
  
  switch (action.name) {
    case '发起私聊':
      router.push({
        path: '/chat/conversation/new',
        query: { userId: member.id, name: member.name }
      })
      break
    case '设为管理员':
      emit('set-admin', { memberId: member.id, isAdmin: true })
      break
    case '取消管理员':
      emit('set-admin', { memberId: member.id, isAdmin: false })
      break
    case '移出群聊':
      emit('remove-member', member.id)
      break
  }
  
  selectedMember.value = null
}

// 处理添加成员
const handleAddMember = () => {
  emit('add-member')
}

// 显示转让群主对话框
const showTransferOwnerDialog = () => {
  selectedTransferMember.value = null
  showTransferDialog.value = true
}

// 确认转让群主
const confirmTransferOwner = () => {
  if (!selectedTransferMember.value) {
    showToast('请选择新群主')
    return
  }
  
  emit('transfer-owner', selectedTransferMember.value)
}

// 显示解散群聊对话框
const showDisbandDialog = () => {
  // 使用vant的Dialog组件
  this.$dialog.confirm({
    title: '解散群聊',
    message: '解散后，群的聊天记录将清空且无法恢复，确定解散该群聊吗？',
    confirmButtonText: '确认解散',
    confirmButtonColor: '#ee0a24'
  }).then(() => {
    emit('disband-group')
  }).catch(() => {
    // 取消操作
  })
}

// 显示退出群聊对话框
const showExitDialog = () => {
  // 使用vant的Dialog组件
  this.$dialog.confirm({
    title: '退出群聊',
    message: '退出后不会通知群内其他成员，且会清空群聊天记录，确定退出该群聊吗？',
    confirmButtonText: '确认退出',
    confirmButtonColor: '#ee0a24'
  }).then(() => {
    emit('exit-group')
  }).catch(() => {
    // 取消操作
  })
}
</script>

<style scoped>
.group-detail {
  padding: 1rem;
  background-color: #f5f5f5;
}

/* 群组头部 */
.group-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #fff;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.avatar-container {
  position: relative;
  margin-right: 1rem;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background-color: #f0f0f0;
  color: #909399;
  border-radius: 50%;
}

.avatar-fallback-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  color: #909399;
  border-radius: 50%;
  font-weight: bold;
}

.avatar-edit {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 1.5rem;
  height: 1.5rem;
  background-color: #1989fa;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.group-info {
  flex: 1;
}

.group-name {
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.group-name .van-icon {
  margin-left: 0.5rem;
  color: #909399;
}

.group-id, .member-count {
  font-size: 0.9rem;
  color: #909399;
  margin-bottom: 0.25rem;
}

/* 群公告和群介绍 */
.group-announcement, .group-description {
  background-color: #fff;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.section-header .van-icon {
  color: #909399;
}

.announcement-content, .description-content {
  color: #606266;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 群成员 */
.group-members {
  background-color: #fff;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.view-all {
  color: #1989fa;
  font-size: 0.9rem;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.member-name {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role {
  display: inline-block;
  font-size: 0.6rem;
  padding: 0.1rem 0.25rem;
  border-radius: 0.25rem;
  margin-left: 0.25rem;
  color: #fff;
}

.role.owner {
  background-color: #f56c6c;
}

.role.admin {
  background-color: #409eff;
}

.add-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

/* 操作按钮 */
.action-buttons {
  margin-top: 2rem;
}

.action-button {
  margin-bottom: 0.5rem;
}

.danger-zone {
  border-top: 1px solid #f5f5f5;
  padding-top: 1rem;
}

.danger {
  color: #f56c6c;
}

/* 成员列表弹窗 */
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

.popup-header .van-icon {
  position: absolute;
  right: 1rem;
  font-size: 1.2rem;
}

.member-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.member-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem;
}

.member-list-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.member-info {
  flex: 1;
  margin-left: 0.75rem;
}

.member-list-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.member-join-time {
  font-size: 0.8rem;
  color: #909399;
}

/* 转让群主弹窗 */
.transfer-member-list {
  max-height: 15rem;
  overflow-y: auto;
  padding: 0 1rem;
}

.transfer-member-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.transfer-member-item.selected {
  background-color: #f8f8f8;
}

.transfer-member-name {
  flex: 1;
  margin-left: 0.75rem;
  font-weight: 500;
}
</style> 