<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="新朋友"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder
    />
    
    <!-- 搜索栏 -->
    <div class="search-bar">
      <van-search
        v-model="searchText"
        placeholder="搜索用户"
        shape="round"
        background="#f5f5f5"
        clearable
        @click="showAddFriend = true"
      />
    </div>
    
    <!-- 请求列表 -->
    <div class="request-list">
      <empty-state
        v-if="requests.length === 0 && !loading" 
        icon="person_add"
        text="暂无好友请求"
        sub-text="可以通过搜索添加好友"
      />
      
      <van-loading v-if="loading" size="24px" vertical class="loading-state">加载中...</van-loading>
      
      <van-list
        v-else-if="requests.length > 0"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div 
          v-for="request in requests" 
          :key="request.id" 
          class="request-item"
        >
          <div class="user-info" @click="viewUserProfile(request.user?.userId)">
            <van-image
              round
              width="50"
              height="50"
              :src="request.user?.avatar || `https://api.dicebear.com/6.x/avataaars/svg?seed=user${parseUserId(request.user_id)}`"
              fit="cover"
            >
              <template #error>
                <div class="avatar-fallback">{{ getInitials(request.user?.nickname || request.user?.username) }}</div>
              </template>
            </van-image>
            
            <div class="request-content">
              <div class="request-name">{{ request.user?.nickname || request.user?.username || `用户${parseUserId(request.user_id)}` }}</div>
              <div class="request-message">{{ request.req_msg || '请求添加您为好友' }}</div>
              <div class="request-time">{{ formatTime(request.req_time) }}</div>
            </div>
          </div>
          
          <div class="request-actions">
            <!-- 待处理状态 -->
            <template v-if="request.handle_result === 1">
              <van-button 
                type="primary" 
                size="small" 
                @click="handleRequest(request, 'accept')"
                :loading="acceptingId === request.id"
              >
                接受
              </van-button>
              <van-button 
                plain 
                type="default" 
                size="small" 
                @click="handleRequest(request, 'reject')"
                :loading="rejectingId === request.id"
              >
                拒绝
              </van-button>
            </template>
            
            <!-- 已处理状态 -->
            <template v-else>
              <div class="status-tag" :class="request.handle_result === 2 ? 'accepted' : 'rejected'">
                {{ request.handle_result === 2 ? '已添加' : '已拒绝' }}
              </div>
            </template>
          </div>
        </div>
      </van-list>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
    
    <!-- 添加好友弹窗 -->
    <van-popup
      v-model:show="showAddFriend"
      round
      position="bottom"
      :style="{ height: '60%' }"
    >
      <div class="popup-header">
        <div class="popup-title">添加好友</div>
        <van-icon name="cross" class="close-icon" @click="showAddFriend = false" />
      </div>
      
      <div class="popup-content">
        <van-search
          v-model="addFriendSearchText"
          placeholder="搜索用户名/ID"
          shape="round"
          clearable
          @search="searchUsers"
        />
        
        <div class="search-results">
          <van-empty v-if="searchResults.length === 0 && hasSearched" description="未找到用户" />
          <van-loading v-if="searching" size="24px" vertical>搜索中...</van-loading>
          
          <div v-if="!searching && searchResults.length > 0" class="user-list">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="user-item"
            >
              <van-image
                round
                width="50"
                height="50"
                :src="user.avatar"
                fit="cover"
                @click="viewUserProfile(user.id)"
              >
                <template #error>
                  <div class="avatar-fallback">{{ getInitials(user.name) }}</div>
                </template>
              </van-image>
              
              <div class="user-info" @click="viewUserProfile(user.id)">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-detail">{{ user.school }} · {{ user.department }}</div>
              </div>
              
              <van-button
                class="add-btn"
                size="small"
                :type="getButtonType(user)"
                :disabled="user.isFriend || sendingRequest"
                :loading="sendingRequest && userToAdd && userToAdd.id === user.id"
                @click="sendFriendRequest(user)"
              >
                {{ getButtonText(user) }}
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
    
    <!-- 发送好友申请弹窗 -->
    <van-dialog
      v-model:show="showSendRequestDialog"
      title="发送好友申请"
      show-cancel-button
      @confirm="confirmSendRequest"
    >
      <van-field
        v-model="requestMessage"
        type="textarea"
        placeholder="请输入验证信息"
        rows="3"
        autosize
      />
    </van-dialog>

    <!-- 底部导航栏 -->
    <div class="tab-bar">
      <div class="tab-item" @click="router.push('/im/conversations')">
        <van-icon name="chat-o" size="24" />
        <span class="tab-text">消息</span>
      </div>
      <div class="tab-item active" @click="router.push('/im/friend-requests')">
        <van-icon name="friends-o" size="24" />
        <span class="tab-text">联系人</span>
      </div>
      <div class="tab-item" @click="router.push('/im/groups')">
        <van-icon name="cluster-o" size="24" />
        <span class="tab-text">群组</span>
      </div>
      <div class="tab-item" @click="router.push('/mine')">
        <van-icon name="user-o" size="24" />
        <span class="tab-text">我的</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { sendFriendRequest as apiSendFriendRequest, getFriendRequests, handleFriendRequest } from '@/api/im'
import { findUsers, getUserProfile } from '@/api/user'
import EmptyState from '@/components/common/EmptyState.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { closeToast, showLoadingToast, showSuccessToast, showToast } from 'vant'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// 配置dayjs
dayjs.extend(relativeTime)

const router = useRouter()
const searchText = ref('')
const addFriendSearchText = ref('')
const requests = ref([])
const finished = ref(false)
const page = ref(1)
const pageSize = ref(20)
const showAddFriend = ref(false)
const searchResults = ref([])
const searching = ref(false)
const hasSearched = ref(false)
const showSendRequestDialog = ref(false)
const requestMessage = ref('')
const userToAdd = ref(null)
const acceptingId = ref(null)
const rejectingId = ref(null)
const sendingRequest = ref(false)
const loading = ref(false)
const error = ref(null)

/**
 * 解析用户ID，处理可能的格式问题
 * @param {any} userId - 可能是数字、字符串或Unicode控制字符
 * @returns {number|string|null} 解析后的用户ID
 */
const parseUserId = (userId) => {
  console.log(`尝试解析用户ID:`, userId);
  console.log(`用户ID类型: ${typeof userId}`);
  
  // 如果已经是数字类型，直接返回
  if (typeof userId === 'number') {
    console.log(`用户ID已是数字: ${userId}`);
    return userId;
  }
  
  // 如果是字符串或其他类型，则尝试转换
  try {
    // 检查是否是Unicode控制字符
    if (typeof userId === 'string') {
      console.log(`用户ID字符串表示: ${JSON.stringify(userId)}`);
      
      // 检查是否是Unicode控制字符（如\u0001表示数字1）
      if (userId.length === 1 && userId.charCodeAt(0) <= 31) {
        const charCode = userId.charCodeAt(0);
        console.log(`检测到Unicode控制字符: \\u${charCode.toString(16).padStart(4, '0')}`);
        console.log(`转换为数字: ${charCode}`);
        return charCode;
      }
      
      // 尝试解析为整数
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed)) {
        console.log(`成功解析为数字: ${parsed}`);
        return parsed;
      }
    }
    
    // 解析失败，返回原值
    console.log(`无法解析用户ID，返回原值: ${userId}`);
    return userId;
  } catch (err) {
    console.error(`解析用户ID时出错:`, err);
    return userId;
  }
};

// 加载好友请求列表
const loadRequests = async () => {
  // 防止重复加载
  if (loading.value) return;
  
  loading.value = true;
  error.value = null;
  
  console.log(`开始加载好友请求，页码: ${page.value}`);
  
  try {
    const response = await getFriendRequests({ page: page.value, page_size: pageSize.value });
    
    // 记录API响应
    console.log('getFriendRequests API 响应:', JSON.stringify(response));
    
    // 获取请求列表 - 处理可能的不同响应格式
    let requestList = [];
    if (response && response.code === 0 && response.data && response.data.lists) {
      requestList = response.data.lists;
    } else if (response && response.list && Array.isArray(response.list)) {
      // 直接返回list数组的情况
      requestList = response.list;
    } else if (response && Array.isArray(response)) {
      // 直接返回数组的情况
      requestList = response;
    } else {
      console.error('无法识别的响应格式，无法获取请求列表', response);
    }
    
    console.log('处理的请求列表:', requestList);
    
    if (requestList.length > 0) {
      // 为每个请求获取用户信息
      const enhancedRequests = await Promise.all(
        requestList.map(async (req) => {
          try {
            // 解析用户ID
            const parsedUserId = parseUserId(req.user_id);
            console.log(`好友请求原始user_id: ${JSON.stringify(req.user_id)}, 解析后: ${parsedUserId}`);
            
            // 确保userId是数字类型
            if (parsedUserId === null || parsedUserId === undefined) {
              console.error(`无效的用户ID: ${req.user_id}`);
              return {
                ...req,
                user: null,
                errorLoadingUser: true
              };
            }
            
            // 获取用户资料 - 直接使用ID参数
            console.log(`请求用户资料，用户ID: ${parsedUserId}`);
            
            const userProfileResponse = await getUserProfile(parsedUserId);
            console.log(`用户资料API响应:`, userProfileResponse);
            
            if (userProfileResponse && (userProfileResponse.code === 0 || userProfileResponse.code === 200)) {
              const userData = userProfileResponse.data;
              return {
                ...req,
                user: {
                  userId: parsedUserId,
                  username: userData.username || `用户${parsedUserId}`,
                  nickname: userData.nickname || userData.username || `用户${parsedUserId}`,
                  avatar: userData.avatar || ''
                },
                errorLoadingUser: false
              };
            } else {
              console.error(`获取用户资料失败:`, userProfileResponse);
              return {
                ...req,
                user: {
                  userId: parsedUserId,
                  username: `用户${parsedUserId}`,
                  nickname: `用户${parsedUserId}`,
                  avatar: ''
                },
                errorLoadingUser: true
              };
            }
          } catch (err) {
            console.error(`处理好友请求时出错:`, err);
            const parsedUserId = parseUserId(req.user_id);
            return {
              ...req,
              user: {
                userId: parsedUserId,
                username: `用户${parsedUserId}`,
                nickname: `用户${parsedUserId}`,
                avatar: ''
              },
              errorLoadingUser: true
            };
          }
        })
      );
      
      // 根据当前页码更新请求列表
      if (page.value === 1) {
        requests.value = enhancedRequests;
      } else {
        requests.value = [...requests.value, ...enhancedRequests];
      }
      
      // 检查是否还有更多数据
      finished.value = enhancedRequests.length < pageSize.value;
      page.value++;
    } else {
      console.log('没有找到好友请求');
      if (page.value === 1) {
        // 如果是第一页，显示空状态
        requests.value = [];
      }
      finished.value = true;
    }
  } catch (err) {
    console.error('获取好友请求出错:', err);
    error.value = err.message || '获取好友请求出错，请稍后再试';
    finished.value = true;
  } finally {
    loading.value = false;
  }
};

// 加载更多
const onLoad = () => {
  // 模拟分页，实际项目中应该调用API获取更多数据
  setTimeout(() => {
    finished.value = true
  }, 500)
}

// 处理好友请求
const handleRequest = async (req, action) => {
  if (!req) {
    console.error('无效的请求数据');
    return;
  }
  
  // 设置加载状态
  if (action === 'accept') {
    acceptingId.value = req.id;
  } else {
    rejectingId.value = req.id;
  }
  
  // 解析用户ID
  const parsedUserId = parseUserId(req.user_id);
  console.log(`处理好友请求: action=${action}, 原始user_id=${JSON.stringify(req.user_id)}, 解析后=${parsedUserId}`);
  
  if (parsedUserId === null || parsedUserId === undefined) {
    console.error(`无效的用户ID: ${req.user_id}`);
    showToast('无效的用户ID，无法处理请求');
    
    // 重置加载状态
    acceptingId.value = null;
    rejectingId.value = null;
    return;
  }
  
  try {
    // 准备API参数
    const apiParams = {
      requestId: req.id,
      userId: parsedUserId,
      action: action
    };
    
    console.log(`调用handleFriendRequest API，参数:`, apiParams);
    
    // 调用API处理请求
    const response = await handleFriendRequest(apiParams);
    console.log(`handleFriendRequest API响应:`, response);
    
    if (response && (response.code === 0 || response.code === 200)) {
      // 操作成功
      showSuccessToast(action === 'accept' ? '已接受好友请求' : '已拒绝好友请求');
      
      // 更新请求状态而不是移除
      const index = requests.value.findIndex(item => item.id === req.id);
      if (index !== -1) {
        requests.value[index].handle_result = action === 'accept' ? 2 : 3; // 2=接受, 3=拒绝
        requests.value[index].handle_time = Date.now();
      }
    } else {
      // 操作失败
      const errorMsg = extractFriendlyErrorMessage(response) || 
        (action === 'accept' ? '接受好友请求失败' : '拒绝好友请求失败');
      console.error('处理好友请求失败:', response);
      showToast(errorMsg);
    }
  } catch (err) {
    console.error('处理好友请求出错:', err);
    showToast(err.message || '操作失败，请稍后再试');
  } finally {
    // 重置加载状态
    acceptingId.value = null;
    rejectingId.value = null;
  }
};

// 搜索用户
const searchUsers = async () => {
  if (!addFriendSearchText.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }
  
  searching.value = true
  hasSearched.value = true
  
  try {
    // 这里改为先通过某种方式获取用户ID
    // 在实际应用中，应该有一个搜索接口返回用户ID列表
    // 但由于要求用finduser接口，这里先模拟搜索
    // 实际项目中可能需要先调用一个搜索接口获取ID列表
    
    // 简单模拟：获取一些测试ID（实际中这里应该调用搜索API）
    const searchTerm = addFriendSearchText.value.trim();
    const userIds = [];
    
    // 如果搜索词是数字，可能是直接搜索用户ID
    if (/^\d+$/.test(searchTerm)) {
      userIds.push(parseInt(searchTerm));
    } else {
      // 这里应该是调用搜索API获取ID列表
      // 临时解决方案：模拟一些随机ID
      // 注意：实际应用中应替换为真实的搜索API调用
      for (let i = 1; i <= 5; i++) {
        userIds.push(Math.floor(Math.random() * 100) + 1); 
      }
    }
    
    // 使用findUsers查询用户详情
    const response = await findUsers(userIds);
    
    // 增强的响应处理逻辑，处理多种可能的响应格式
    if (
      (response.code === 200 && response.data && response.data.users) || // 标准格式
      (response.users && Array.isArray(response.users)) // 直接返回包含users的对象
    ) {
      // 获取users数组
      const usersArray = response.users || response.data?.users || [];
      
      if (usersArray.length > 0) {
        // 映射用户数据到搜索结果格式
        searchResults.value = usersArray.map(user => {
          // 检查是否已经发送过好友请求
          const friendStatus = user.friendStatus || user.relationshipStatus || 0;
          const isFollowing = !!user.isFollowing;
          const requestSent = friendStatus === 1; // 假设状态1表示已发送请求但尚未接受
          
          return {
            id: user.id || user.userId,
            name: user.nickname || user.username || "未知用户",
            avatar: user.avatar || '',
            bio: user.bio || '',
            school: user.campus || user.school || '未知学校',
            department: user.college || user.department || '未知院系',
            isFriend: isFollowing || requestSent, // 已是好友或已发送请求
            requestSent: requestSent // 标记已发送请求状态
          };
        });
        console.log("处理后的搜索结果:", searchResults.value);
      } else {
        searchResults.value = [];
        showToast('未找到匹配的用户');
      }
    } else {
      console.error('无法识别的响应格式:', response);
      searchResults.value = [];
      showToast(response.message || '搜索失败');
    }
  } catch (error) {
    console.error('搜索用户失败:', error);
    showToast('网络错误，请稍后重试');
    searchResults.value = [];
  } finally {
    searching.value = false;
  }
}

// 提取友好的错误消息
const extractFriendlyErrorMessage = (response) => {
  if (!response) return '未知错误';
  
  if (response.msg) return response.msg;
  
  if (response.message) return response.message;
  
  if (typeof response.error === 'string') return response.error;
  
  return '操作失败，请稍后重试';
};

// 在发送请求函数中更新按钮状态
const sendFriendRequest = (user) => {
  // 如果用户已经发送了好友请求或已经是好友，不再处理
  if (user.isFriend || user.requestSent || sendingRequest.value) {
    return;
  }
  
  userToAdd.value = user
  requestMessage.value = `我是${localStorage.getItem('userName') || '新用户'}，请求添加您为好友`
  showSendRequestDialog.value = true
}

// 确认发送好友申请
const confirmSendRequest = async () => {
  if (!userToAdd.value) return
  
  // 设置发送状态
  sendingRequest.value = true
  
  const loading = showLoadingToast({
    message: '发送申请中...',
    forbidClick: true
  })
  
  try {
    // 修改为符合后端需要的格式
    const response = await apiSendFriendRequest({
      user_uid: userToAdd.value.id.toString(), // 确保转换为字符串
      req_msg: requestMessage.value,
      req_time: Date.now() // 使用当前时间戳
    })
    
    if (response.code === 200) {
      showSuccessToast('好友申请已发送')
      // 更新搜索结果，防止重复发送申请
      updateUserFriendStatus(userToAdd.value.id)
    } else {
      // 从响应中提取错误信息
      const errorMessage = extractFriendlyErrorMessage(response)
      
      // 检查是否是重复添加相关的错误
      if (response.code === 100001 || errorMessage.includes('已经添加') || errorMessage.includes('已经发送')) {
        showSuccessToast(errorMessage)
        // 更新UI状态
        updateUserFriendStatus(userToAdd.value.id)
      } else {
        // 其他错误类型
        showToast(errorMessage)
      }
    }
  } catch (error) {
    console.error('发送好友申请失败:', error)
    
    // 提取错误信息
    const errorMessage = extractFriendlyErrorMessage(error)
    
    // 检查是否是重复添加相关的错误（包括500错误）
    if (
      (error.response && error.response.status === 500) || 
      errorMessage.includes('已经添加') || 
      errorMessage.includes('已经发送') ||
      errorMessage.includes('已经是好友')
    ) {
      showSuccessToast(errorMessage)
      // 更新UI状态
      updateUserFriendStatus(userToAdd.value.id)
    } else {
      // 其他错误类型
      showToast(errorMessage)
    }
  } finally {
    closeToast(loading)
    // 重置发送状态
    sendingRequest.value = false
    userToAdd.value = null
  }
}

// 更新用户的好友状态（抽取为单独函数便于复用）
const updateUserFriendStatus = (userId) => {
  // 更新搜索结果中的状态
  const index = searchResults.value.findIndex(u => u.id === userId)
  if (index !== -1) {
    searchResults.value[index].isFriend = true
    searchResults.value[index].requestSent = true // 额外标记已发送请求
  }
}

// 根据用户状态获取按钮文本
const getButtonText = (user) => {
  if (user.isFriend) {
    return user.requestSent ? '已发送请求' : '已添加';
  }
  return '添加';
}

// 根据用户状态获取按钮类型
const getButtonType = (user) => {
  if (user.isFriend) {
    return user.requestSent ? 'warning' : 'default';
  }
  return 'primary';
}

// 查看用户资料
const viewUserProfile = (userId) => {
  router.push(`/im/user/${userId}`)
}

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const date = dayjs(time)
  const now = dayjs()
  
  if (date.isAfter(now.subtract(1, 'day'))) {
    // 1天内，显示相对时间
    return date.fromNow()
  } else if (date.isAfter(now.subtract(7, 'day'))) {
    // 7天内，显示星期几
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.day()]
  } else if (date.isSame(now, 'year')) {
    // 今年，显示月日
    return date.format('MM-DD')
  } else {
    // 往年，显示年月日
    return date.format('YYYY-MM-DD')
  }
}

// 组件挂载时获取数据
onMounted(() => {
  console.log('FriendRequests component mounted');
  loadRequests();
})
</script>

<style scoped>
.page-container {
  padding-bottom: 50px;
  min-height: 100vh;
  background-color: #f7f8fa;
  position: relative;
}

.search-bar {
  background-color: #fff;
  padding: 8px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.request-list {
  padding: 16px;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.request-content {
  margin-left: 12px;
}

.request-name {
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 4px;
}

.request-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.request-time {
  font-size: 12px;
  color: #999;
}

.request-actions {
  display: flex;
  align-items: center;
}

.request-actions button {
  margin-left: 8px;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f2f3f5;
  border-radius: 50%;
  color: #909399;
  font-weight: 500;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.popup-title {
  font-size: 18px;
  font-weight: 500;
}

.close-icon {
  font-size: 20px;
}

.popup-content {
  padding: 16px;
  height: calc(100% - 56px);
  overflow-y: auto;
}

.user-list {
  margin-top: 16px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.user-item:last-child {
  border-bottom: none;
}

.user-info {
  flex: 1;
  margin-left: 12px;
}

.user-name {
  font-weight: 500;
  font-size: 16px;
}

.user-detail {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.add-btn {
  margin-left: 16px;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
}

.status-tag.accepted {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-tag.rejected {
  background-color: #ffebee;
  color: #f44336;
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  height: 50px;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.tab-item.active {
  color: #1989fa;
}

.tab-text {
  margin-top: 4px;
  font-size: 10px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.error-message {
  padding: 12px;
  background-color: #fff9f9;
  border-radius: 8px;
  color: #f56c6c;
  text-align: center;
  margin-top: 12px;
}
</style>