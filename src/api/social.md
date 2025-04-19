# social.js 文件说明文档

## 📄 文件概述

`social.js` 是校园交换平台中负责社交功能的API模块，主要提供好友管理、社交互动相关的接口封装。该模块封装了与后端社交功能相关的所有API调用，为前端组件提供数据交互能力。

## 📦 所属包

该文件位于 `src/api` 目录下，是前端API模块的重要组成部分。它基于项目的HTTP请求工具进行封装，提供友好的接口供前端组件调用。

## 🔍 核心结构

### 好友管理接口

1. **`getFriendList(params)`**：获取好友列表，支持分页
2. **`getOnlineFriends()`**：获取当前在线的好友列表
3. **`getFriendProfile(params)`**：获取指定好友的详细资料
4. **`deleteFriend(data)`**：删除好友关系
5. **`setFriendRemark(data)`**：设置好友备注
6. **`blockFriend(data)`**：屏蔽指定好友
7. **`getBlockList(params)`**：获取已屏蔽用户列表
8. **`unblockUser(data)`**：解除对指定用户的屏蔽

### 好友请求接口

1. **`sendFriendRequest(data)`**：发送好友请求
2. **`handleFriendRequest(data)`**：处理（接受/拒绝）好友请求
3. **`cancelFriendRequest(data)`**：撤回已发送的好友请求
4. **`getFriendRequests(params)`**：获取收到的好友请求列表
5. **`getSentFriendRequests(params)`**：获取已发送的好友请求列表
6. **`getFriendRequestCount()`**：获取未处理的好友请求数量

### 用户搜索接口

1. **`searchUsers(params)`**：根据关键词搜索用户，支持按用户名、学号或邮箱搜索
2. **`getUserQRCode()`**：获取当前用户的社交二维码信息

### 社交互动接口

1. **`getFriendActivities(params)`**：获取好友动态列表
2. **`getRecommendedFriends(params)`**：获取好友推荐列表
3. **`reportUser(data)`**：举报用户行为

## 🔁 主要逻辑流程

1. **好友添加流程**：
   - 用户通过 `searchUsers` 搜索其他用户
   - 通过 `sendFriendRequest` 发送好友请求
   - 对方通过 `getFriendRequests` 获取请求列表
   - 对方通过 `handleFriendRequest` 接受或拒绝请求
   - 请求发送方可通过 `cancelFriendRequest` 撤回请求

2. **好友管理流程**：
   - 通过 `getFriendList` 获取好友列表
   - 通过 `setFriendRemark` 设置好友备注
   - 通过 `deleteFriend` 删除好友关系
   - 通过 `blockFriend` 屏蔽不想交互的好友

3. **社交互动流程**：
   - 通过 `getFriendActivities` 查看好友的最新动态
   - 通过 `getRecommendedFriends` 获取系统推荐的可能认识的用户

## 📌 特别说明

1. **参数格式**：
   - `params` 参数用于GET请求，通常包含分页信息（page、limit）
   - `data` 参数用于POST请求，包含操作所需的必要数据

2. **错误处理**：
   - 所有API都返回Promise对象，调用方需要处理可能的异常
   - 接口返回的数据格式统一为 `{code, message, data}`

3. **安全性**：
   - 所有接口都通过request工具自动附加认证信息
   - 敏感操作（如删除好友）需要二次确认

4. **扩展性**：
   - 该模块设计为可扩展的结构，新的社交功能可以方便地添加新接口
   - 所有接口都有完善的JSDoc注释，便于维护和扩展