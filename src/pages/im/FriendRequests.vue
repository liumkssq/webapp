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
      <van-empty v-if="requests.length === 0 && !loading" description="暂无好友请求" />
      <van-list
        v-else
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMoreRequests"
        error-text="请求失败，点击重新加载"
        :error="hasError"
        @error="refreshRequests"
      >
        <div v-for="req in requests" :key="req.id" class="request-item">
          <div class="avatar" @click="viewUserProfile(req.user_id)">
            <img :src="req.avatar || defaultAvatar" alt="头像">
          </div>
          <div class="info" @click="viewUserProfile(req.user_id)">
            <div class="name">{{ req.username || '未知用户' }}</div>
            <div class="msg">{{ req.req_msg || '请求添加你为好友' }}</div>
            <div class="time">{{ formatTime(req.req_time) }}</div>
          </div>
          <div class="actions">
            <!-- 未处理且非处理中状态 -->
            <template v-if="!req.handle_result && !req.processing">
              <van-button 
                size="small" 
                type="primary" 
                class="accept" 
                :loading="acceptingId === req.id"
                @click="handleRequest(req.id, 'accept', requests.value.findIndex(r => r.id === req.id))"
              >接受</van-button>
              <van-button 
                size="small" 
                class="reject" 
                :loading="rejectingId === req.id"
                @click="handleRequest(req.id, 'reject', requests.value.findIndex(r => r.id === req.id))"
              >拒绝</van-button>
            </template>
            
            <!-- 处理中状态 -->
            <div v-else-if="req.processing" class="status processing">
              <van-loading size="16px" type="spinner" color="#1989fa" />
              <span>处理中...</span>
            </div>
            
            <!-- 已处理状态 -->
            <div v-else class="status">
              <span v-if="req.handle_result === 2" class="accepted">已接受</span>
              <span v-else-if="req.handle_result === 3" class="rejected">已拒绝</span>
              <span v-else class="handled">已处理</span>
            </div>
          </div>
        </div>
      </van-list>
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
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { closeToast, showLoadingToast, showSuccessToast, showToast } from 'vant'
import { onMounted, ref, watchEffect } from 'vue'
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
const hasError = ref(false)

/**
 * 解析用户ID，处理可能的格式问题
 * @param {any} userId - 可能是数字、字符串或Unicode控制字符
 * @returns {number|string|null} 解析后的用户ID
 */
const parseUserId = (userId) => {
  try {
    // 输出原始ID的类型和值
    console.log(`解析用户ID - 原始值类型: ${typeof userId}`);
    
    // 如果是undefined或null，返回null
    if (userId === undefined || userId === null) {
      console.log('用户ID为空');
      return null;
    }
    
    // 如果已经是数字类型，直接返回
    if (typeof userId === 'number') {
      console.log(`用户ID已是数字: ${userId}`);
      return userId;
    }
    
    // 如果是字符串，进行更详细的处理
    if (typeof userId === 'string') {
      // 输出字符串的详细信息
      console.log(`用户ID字符串表示: ${JSON.stringify(userId)}`);
      console.log(`用户ID字符串长度: ${userId.length}`);
      
      if (userId.length === 0) {
        console.log('用户ID为空字符串');
        return null;
      }
      
      // 检查是否是Unicode控制字符（如\u0001表示数字1）
      if (userId.length === 1) {
        const charCode = userId.charCodeAt(0);
        console.log(`字符ASCII码: ${charCode}`);
        
        // 如果是控制字符（ASCII 0-31）
        if (charCode <= 31) {
          console.log(`检测到Unicode控制字符: \\u${charCode.toString(16).padStart(4, '0')}`);
          console.log(`将其转换为数字: ${charCode}`);
          return charCode;
        }
      }
      
      // 尝试按数字解析
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed)) {
        console.log(`成功解析为数字: ${parsed}`);
        return parsed;
      }
      
      // 如果不是数字，可能是其他格式的ID，直接返回原字符串
      console.log(`无法解析为数字，保留原字符串: ${userId}`);
      return userId;
    }
    
    // 如果是对象或其他类型，尝试转换为字符串后解析
    if (typeof userId === 'object') {
      console.log(`用户ID是对象类型: ${JSON.stringify(userId)}`);
      // 尝试使用toString()方法
      const strId = userId.toString();
      console.log(`对象转换为字符串: ${strId}`);
      return parseUserId(strId); // 递归调用自身来解析转换后的字符串
    }
    
    // 其他类型，直接转换为字符串并返回
    console.log(`未知类型用户ID: ${typeof userId}, 值: ${userId}`);
    return String(userId);
  } catch (err) {
    console.error(`解析用户ID时出错:`, err);
    // 出错时返回null
    return null;
  }
};

// 加载好友请求列表
const loadRequests = async () => {
  loading.value = true;
  hasError.value = false;
  
  try {
    console.log('正在加载好友请求...');
    const response = await getFriendRequests();
    console.log('好友请求响应:', JSON.stringify(response, null, 2));
    
    if (response && response.list) {
      // 处理每个请求数据并获取用户信息
      const requestsWithProfiles = await Promise.all(response.list.map(async (req, idx) => {
        // 标记处理状态
        req.processing = false;
        
        try {
          // 显示原始用户ID用于调试
          console.log(`请求 #${idx+1} 原始用户ID:`, req.user_id);
          console.log(`用户ID类型: ${typeof req.user_id}`);
          console.log(`用户ID JSON表示: ${JSON.stringify(req.user_id)}`);
          
          // 解析用户ID
          const userId = parseUserId(req.user_id);
          console.log(`解析后的用户ID: ${userId} (${typeof userId})`);
          
          // 构建请求URL并记录
          const requestUrl = `/api/user/profile/${userId}`;
          console.log(`获取用户资料请求URL: ${requestUrl}`);
          
          // 获取用户资料
          const userProfile = await getUserProfile(userId);
          console.log(`用户 ${userId} 资料响应:`, userProfile);
          
          if (userProfile) {
            // 提取用户名和头像
            const username = userProfile.username || userProfile.nickname || '未知用户';
            const avatar = userProfile.avatar || '';
            
            console.log(`成功获取用户资料: 用户名=${username}, 头像=${avatar}`);
            
            // 合并用户资料到请求数据中
            return {
              ...req,
              username,
              avatar,
              userId: userId,
              user_id: userId // 统一用户ID格式
            };
          } else {
            console.warn(`未能获取用户 ${userId} 的有效资料`);
            return req;
          }
        } catch (error) {
          console.error(`获取用户 ${req.user_id} 资料失败:`, error);
          // 返回带默认值的请求数据
          return {
            ...req,
            username: '未知用户',
            avatar: '',
            error: true
          };
        }
      }));
      
      requests.value = requestsWithProfiles;
      console.log('处理后的请求数据:', JSON.stringify(requests.value, null, 2));
      
      finished.value = requestsWithProfiles.length < pageSize.value;
    } else {
      console.error('获取好友请求失败:', response);
      requests.value = [];
      finished.value = true;
      
      // 如果没有请求数据但API没有返回错误，显示空状态
      if (response && response.code === 200) {
        console.log('没有待处理的好友请求');
      } else {
        // API返回了错误
        hasError.value = true;
        error.value = extractFriendlyErrorMessage(response);
      }
    }
  } catch (error) {
    console.error('加载好友请求错误:', error);
    hasError.value = true;
    error.value = extractFriendlyErrorMessage(error);
  } finally {
    loading.value = false;
  }
};

const refreshRequests = () => {
  page.value = 1;
  hasError.value = false;
  finished.value = false;
  requests.value = [];
  loadRequests();
};

const loadMoreRequests = () => {
  // 如果已经加载完所有数据，不再请求
  if (finished.value) return;
  
  page.value++;
  loadRequests();
};

// 处理好友请求
const handleRequest = async (requestId, action, index) => {
  // 设置当前处理的请求为loading状态
  if (!requests.value[index]) return;
  requests.value[index].processing = true;
  
  try {
    // 使用handleFriendRequest函数处理请求
    await handleFriendRequest({
      requestId,
      action
    });
    
    // 直接更新请求的状态
    requests.value[index].handle_result = action === 'accept' ? 2 : 3;
    Toast.success(action === 'accept' ? '已添加为好友' : '已拒绝请求');
    
    // 重要：强制更新数组，确保Vue能检测到变化
    requests.value = [...requests.value];
    
    console.log(`请求处理完成，ID: ${requestId}, 动作: ${action}, 新状态: ${requests.value[index].handle_result}`);
  } catch (error) {
    console.error('处理好友请求失败:', error);
    const errorMsg = extractFriendlyErrorMessage(error);
    Toast.fail(errorMsg || '处理请求失败，请重试');
  } finally {
    // 无论成功或失败，都移除处理中状态
    if (requests.value[index]) {
      requests.value[index].processing = false;
      
      // 再次强制更新数组
      requests.value = [...requests.value];
    }
  }
}

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

// 添加获取用户显示名称的方法
const getUserDisplayName = (req) => {
  if (!req || !req.user) {
    return `用户${parseUserId(req.user_id)}`;
  }
  
  // 优先级：nickname > username > 默认名称
  return req.user.nickname || req.user.username || `用户${parseUserId(req.user_id)}`;
}

// 添加调试日志
console.log('所有请求数据:', requests);

// 每当请求数组发生变化时，监听并打印
watchEffect(() => {
  console.log('请求数组变化:', requests.value.map(req => ({
    id: req.id,
    status: req.handle_result,
    user: req.user?.nickname
  })));
});

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

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.info {
  flex: 1;
}

.name {
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 4px;
}

.msg {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.time {
  font-size: 12px;
  color: #999;
}

.actions {
  display: flex;
  align-items: center;
}

.accept, .reject {
  margin-left: 8px;
}

.status {
  margin-left: 16px;
}

.processing {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f0f0f0;
}

.accepted {
  color: #67c23a;
}

.rejected {
  color: #f56c6c;
}

.handled {
  color: #909399;
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

.processing-tag {
  padding: 4px 8px;
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  border-radius: 4px;
}
</style>