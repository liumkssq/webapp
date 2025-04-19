# 社交功能模块说明文档

## 功能概述

社交功能模块是校园交换平台的核心组成部分之一，旨在为用户提供社交互动能力，增强用户粘性和活跃度。该模块包含好友管理、群组管理、即时通讯等功能，帮助用户建立社交网络，促进校园交流。

## 主要功能

### 1. 好友管理

- **好友列表**：查看并管理所有好友，显示在线状态
- **添加好友**：通过用户名、学号、邮箱或二维码添加好友
- **好友请求**：发送、接收和处理好友请求
- **好友操作**：设置备注、删除好友、屏蔽好友等

### 2. 群组管理

- **群组列表**：查看已加入的群组列表
- **创建群组**：创建新群组并邀请好友
- **加入群组**：通过群组ID加入群组
- **群组操作**：查看群组信息、退出群组等

### 3. 即时通讯

- **私聊**：与好友进行一对一聊天
- **群聊**：在群组内进行多人聊天
- **会话列表**：查看所有聊天会话记录
- **消息类型**：支持文本、图片等消息类型

## 技术实现

### 前端实现

1. **页面组件**：
   - `Friends.vue`：好友列表页面
   - `AddFriend.vue`：添加好友页面
   - `FriendRequests.vue`：好友请求页面
   - `Groups.vue`：群组管理页面

2. **API模块**：
   - `social.js`：好友相关API接口
   - `im.js`：即时通讯相关API接口

3. **状态管理**：
   - `social.js (Pinia Store)`：管理好友数据和群组数据的状态

### 后端接口

#### 好友相关接口

- `GET /api/social/friends`：获取好友列表
- `GET /api/social/friends/online`：获取在线好友列表
- `POST /api/social/friend-requests`：发送好友请求
- `POST /api/social/friend-requests/:id/accept`：接受好友请求
- `POST /api/social/friend-requests/:id/reject`：拒绝好友请求
- `POST /api/social/friends/delete`：删除好友
- `POST /api/social/friends/remark`：设置好友备注

#### 群组相关接口

- `GET /api/social/groups`：获取群组列表
- `POST /api/social/groups`：创建群组
- `POST /api/social/groups/join`：加入群组
- `GET /api/social/groups/:id`：获取群组详情
- `POST /api/social/groups/:id/leave`：退出群组

#### 即时通讯接口

- `GET /api/im/conversations`：获取会话列表
- `GET /api/im/chat-log`：获取聊天记录
- `POST /api/im/send-message`：发送消息
- `GET /api/im/websocket-url`：获取WebSocket连接URL

## 数据结构

### 好友对象

```javascript
{
  id: '用户ID',
  username: '用户名',
  avatar: '头像URL',
  isOnline: true, // 是否在线
  remark: '好友备注',
  bio: '个人简介',
  school: '学校名称',
  studentId: '学号',
  lastActiveTime: '最后活跃时间'
}
```

### 好友请求对象

```javascript
{
  id: '请求ID',
  senderId: '发送者ID',
  senderName: '发送者用户名',
  senderAvatar: '发送者头像',
  receiverId: '接收者ID',
  receiverName: '接收者用户名',
  receiverAvatar: '接收者头像',
  message: '验证消息',
  status: 'pending', // 状态：pending/accepted/rejected/canceled
  createdAt: '创建时间'
}
```

### 群组对象

```javascript
{
  id: '群组ID',
  name: '群组名称',
  avatar: '群头像URL',
  notice: '群公告',
  memberCount: 156, // 成员数量
  creatorId: '创建者ID',
  isAdmin: false, // 当前用户是否为管理员
  isOfficial: true, // 是否为官方群组
  unreadCount: 0 // 未读消息数
}
```

## 使用说明

1. **好友功能使用流程**：
   - 进入好友列表页面查看现有好友
   - 点击"添加好友"按钮进入添加好友页面
   - 通过用户名、学号或邮箱搜索用户
   - 发送好友请求
   - 等待对方接受请求

2. **好友请求处理流程**：
   - 进入好友请求页面查看收到的请求
   - 接受或拒绝好友请求
   - 查看已发送的请求状态

3. **群组功能使用流程**：
   - 进入群组页面查看已加入的群组
   - 点击"创建群组"创建新群组
   - 或点击"加入群组"通过群组ID加入群组
   - 点击群组进入群聊界面

## 注意事项

1. 好友数量上限为500人
2. 群组成员上限为500人
3. 创建群组需要至少邀请1位好友
4. 发送好友请求时，验证消息最多50个字符
5. 群组名称最多20个字符，群公告最多200个字符

## 后续优化计划

1. 添加好友分组功能
2. 增强群组管理功能，支持设置管理员
3. 支持更多消息类型，如语音、视频等
4. 增加社交动态功能，展示好友最新活动
5. 优化消息推送机制，提高实时性