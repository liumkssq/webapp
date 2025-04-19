// 社交功能API模块
import request from '@/utils/request';

/**
 * 获取好友列表
 * @returns {Promise} 返回Promise对象
 */
export function getFriendList() {
  return request({
    url: '/api/social/friends',
    method: 'get'
  })
}

/**
 * 获取在线好友列表
 * @returns {Promise} 返回Promise对象
 */
export function getOnlineFriends() {
  return request({
    url: '/api/social/friends/online',
    method: 'get'
  })
}

/**
 * 搜索用户
 * @param {Object} params 请求参数
 * @param {string} params.keyword 搜索关键词
 * @param {string} params.type 搜索类型(username/student_id/email)
 * @param {number} [params.page=1] 页码
 * @param {number} [params.limit=20] 每页数量
 * @returns {Promise} 返回Promise对象
 */
export function searchUsers(params) {
  return request({
    url: '/api/social/search',
    method: 'get',
    params
  })
}

/**
 * 发送好友请求
 * @param {Object} data 请求数据
 * @param {string} data.userId 目标用户ID (前端使用)
 * @param {string} data.message 申请消息 (前端使用)
 * @returns {Promise} 返回Promise对象
 */
export function sendFriendRequest(data) {
  // 将前端参数转换为后端API所需格式
  const apiData = {
    user_uid: data.userId || data.user_uid, // 兼容两种格式
    req_msg: data.message || data.req_msg || '', // 兼容两种格式
    req_time: data.req_time || Date.now() // 如果没有提供时间，使用当前时间戳
  };

  return request({
    url: '/api/social/friend/putIn',
    method: 'post',
    data: apiData
  });
}

/**
 * 处理好友请求
 * @param {Object} data 请求数据
 * @param {number} data.friend_req_id 好友请求ID
 * @param {number} data.handle_result 处理结果(1=待处理,2=通过,3=拒绝)
 * @returns {Promise} 返回Promise对象
 */
export function handleFriendRequest(data) {
  return request({
    url: '/api/social/friend/putIn',
    method: 'put',
    data
  })
}

/**
 * 获取好友申请列表
 * @returns {Promise} 返回Promise对象
 */
export function getFriendRequests() {
  return request({
    url: '/api/social/friend/putIns',
    method: 'get'
  })
}

/**
 * 获取未处理的好友请求数量
 * @returns {Promise} 返回Promise对象，resolve值为未处理的好友请求数量
 */
export function getFriendRequestCount() {
  return new Promise((resolve, reject) => {
    request({
      url: '/api/social/friend/putIns',
      method: 'get',
      params: { status: 'pending' }
    })
      .then(response => {
        if (response.code === 200 && response.data && response.data.list) {
          // 只计算待处理的请求
          const pendingRequests = response.data.list.filter(req => req.status === 'pending' || req.status === 1 || !req.status);
          resolve(pendingRequests.length);
        } else {
          // 如果接口返回格式不符合预期，返回0
          resolve(0);
        }
      })
      .catch(error => {
        console.error('获取好友请求数量失败:', error);
        // 发生错误时返回0而不是拒绝Promise
        resolve(0);
      });
  });
}

/**
 * 获取群聊列表
 * @returns {Promise} 返回Promise对象
 */
export function getGroupList() {
  return request({
    url: '/api/social/groups',
    method: 'get'
  })
}

/**
 * 创建群聊
 * @param {Object} data 请求数据
 * @param {string} data.name 群名称
 * @param {string} data.icon 群图标
 * @returns {Promise} 返回Promise对象
 */
export function createGroup(data) {
  return request({
    url: '/api/social/group',
    method: 'post',
    data
  })
}

/**
 * 申请加入群聊
 * @param {Object} data 请求数据
 * @param {string} data.group_id 群ID
 * @param {string} data.req_msg 申请消息
 * @param {number} data.req_time 申请时间
 * @param {number} data.join_source 加入来源
 * @returns {Promise} 返回Promise对象
 */
export function applyJoinGroup(data) {
  return request({
    url: '/api/social/group/putIn',
    method: 'post',
    data
  })
}

/**
 * 处理群申请
 * @param {Object} data 请求数据
 * @param {number} data.group_req_id 群申请ID
 * @param {string} data.group_id 群ID
 * @param {number} data.handle_result 处理结果(1=待处理,2=通过,3=拒绝)
 * @returns {Promise} 返回Promise对象
 */
export function handleGroupRequest(data) {
  return request({
    url: '/api/social/group/putIn',
    method: 'put',
    data
  })
}

/**
 * 获取群申请列表
 * @param {Object} params 请求参数
 * @param {string} [params.group_id] 群ID，不传则获取所有
 * @returns {Promise} 返回Promise对象
 */
export function getGroupRequests(params) {
  return request({
    url: '/api/social/group/putIns',
    method: 'get',
    params
  })
}

/**
 * 获取群成员列表
 * @param {Object} params 请求参数
 * @param {string} params.group_id 群ID
 * @returns {Promise} 返回Promise对象
 */
export function getGroupMembers(params) {
  return request({
    url: '/api/social/group/users',
    method: 'get',
    params
  })
}

/**
 * 获取群在线用户列表
 * @param {Object} params 请求参数
 * @param {string} params.group_id 群ID
 * @returns {Promise} 返回Promise对象
 */
export function getGroupOnlineUsers(params) {
  return request({
    url: '/api/social/group/users/online',
    method: 'get',
    params
  })
}

/**
 * 删除好友
 * @param {Object} data 请求数据
 * @param {string} data.friendId 好友ID
 * @returns {Promise} 返回Promise对象
 */
export function deleteFriend(data) {
  return request({
    url: '/api/social/friends/delete',
    method: 'post',
    data
  })
}

/**
 * 设置好友备注
 * @param {Object} data 请求数据
 * @param {string} data.friendId 好友ID
 * @param {string} data.remark 好友备注
 * @returns {Promise} 返回Promise对象
 */
export function setFriendRemark(data) {
  return request({
    url: '/api/social/friends/remark',
    method: 'post',
    data
  })
}

/**
 * 获取好友资料
 * @param {Object} params 请求参数
 * @param {string} params.friendId 好友ID
 * @returns {Promise} 返回Promise对象
 */
export function getFriendProfile(params) {
  return request({
    url: '/api/social/friends/profile',
    method: 'get',
    params
  })
}

/**
 * 获取用户二维码
 * @returns {Promise} 返回Promise对象
 */
export function getUserQRCode() {
  return request({
    url: '/api/social/qrcode',
    method: 'get'
  })
}

/**
 * 获取好友动态列表
 * @param {Object} params 请求参数
 * @param {number} [params.page=1] 页码
 * @param {number} [params.limit=20] 每页数量
 * @returns {Promise} 返回Promise对象
 */
export function getFriendActivities(params = {}) {
  return request({
    url: '/api/social/activities',
    method: 'get',
    params
  })
}

/**
 * 获取好友推荐列表
 * @param {Object} params 请求参数
 * @param {number} [params.limit=10] 推荐数量
 * @returns {Promise} 返回Promise对象
 */
export function getRecommendedFriends(params = {}) {
  return request({
    url: '/api/social/friends/recommended',
    method: 'get',
    params
  })
}

/**
 * 屏蔽好友
 * @param {Object} data 请求数据
 * @param {string} data.friendId 好友ID
 * @returns {Promise} 返回Promise对象
 */
export function blockFriend(data) {
  return request({
    url: '/api/social/friends/block',
    method: 'post',
    data
  })
}

/**
 * 获取屏蔽列表
 * @param {Object} params 请求参数
 * @param {number} [params.page=1] 页码
 * @param {number} [params.limit=20] 每页数量
 * @returns {Promise} 返回Promise对象
 */
export function getBlockList(params = {}) {
  return request({
    url: '/api/social/blocked',
    method: 'get',
    params
  })
}

/**
 * 解除屏蔽
 * @param {Object} data 请求数据
 * @param {string} data.userId 用户ID
 * @returns {Promise} 返回Promise对象
 */
export function unblockUser(data) {
  return request({
    url: '/api/social/unblock',
    method: 'post',
    data
  })
}

/**
 * 举报用户
 * @param {Object} data 请求数据
 * @param {string} data.userId 用户ID
 * @param {string} data.reason 举报原因
 * @param {string[]} [data.evidences] 证据图片URL数组
 * @returns {Promise} 返回Promise对象
 */
export function reportUser(data) {
  return request({
    url: '/api/social/report',
    method: 'post',
    data
  })
}