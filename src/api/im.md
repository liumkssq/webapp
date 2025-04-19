# im.js 文件说明文档

## 📄 文件概述
`im.js`是即时通讯(IM)系统的API模块，提供了与后端通信的多种方法，包括WebSocket连接管理、聊天记录获取、会话管理、消息发送接收等功能。该文件为前端应用提供了完整的即时通讯能力支持。

## 📦 所属包
该文件位于`@/api`目录下，属于API层，负责与后端服务进行数据交互。它引用了`@/config/index`中的WebSocket配置和`@/utils/request`工具进行HTTP请求。

## 🔍 核心结构
文件定义了多组常量和函数：

### 常量定义
- `wsActions`：WebSocket操作类型常量，包括用户上线、会话聊天、标记已读、消息推送等
- `CHAT_TYPE`：聊天类型常量，区分群聊(1)和单聊(2)
- `MESSAGE_TYPE`：消息类型常量，包括文本(0)、图片(1)、文件(2)、位置(3)
- `CONTENT_TYPE`：内容类型常量，区分聊天消息(0)和已读回执(1)

### WebSocket相关
- `getWebSocketUrl`：根据用户ID生成WebSocket连接地址

### 会话管理功能
- `getConversations`：获取用户所有会话
- `getConversationList`：分页获取会话列表
- `putConversations`：更新会话状态(已读/删除等)
- `setUpUserConversation`：创建或获取用户会话
- `getUnreadCount`：获取未读消息数量

### 消息管理功能
- `getChatLog`：获取聊天历史记录
- `sendTextMessage`：发送文本消息
- `uploadChatImage`：上传聊天图片
- `markMessageRead`：标记消息已读
- `getMessageReadStatus`：获取消息的已读状态

### 好友关系管理
- `searchUsers`：搜索用户
- `getFriendRequests`：获取好友申请列表
- `handleFriendRequest`：处理好友申请
- `sendFriendRequest`：发送好友申请
- `getFriendList`：获取好友列表
- `deleteFriend`：删除好友
- `setFriendRemark`：设置好友备注

### 内容解析
- `parseContentByType`：根据类型解析消息内容
- `buildTextContent`：构建文本消息内容

### 群聊管理
- `createGroup`：创建群组
- `getGroupInfo`：获取群组信息
- `updateGroupInfo`：更新群组信息
- `getGroupMembers`：获取群成员列表
- `inviteToGroup`：邀请用户加入群组
- `leaveGroup`：退出群组

## 🔁 主要逻辑流程
1. **WebSocket连接流程**：
   - 前端通过`getWebSocketUrl`获取连接地址
   - 建立WebSocket连接后，使用`wsActions.USER_ONLINE`通知服务器用户在线
   - 监听服务器推送的消息，根据`wsActions`判断消息类型并处理

2. **消息发送流程**：
   - 调用`sendTextMessage`等函数发送消息
   - 构建消息内容，设置消息类型
   - 通过WebSocket发送到服务器
   - 服务器推送消息到接收方

3. **会话管理流程**：
   - 应用启动时通过`getConversations`获取所有会话
   - 用户查看会话时，通过`getChatLog`获取历史消息
   - 收到新消息时，更新未读计数，调用`getUnreadCount`刷新显示
   - 用户查看消息后，调用`markMessageRead`标记已读

4. **好友管理流程**：
   - 用户搜索好友通过`searchUsers`
   - 发送好友请求通过`sendFriendRequest`
   - 处理好友请求通过`handleFriendRequest`
   - 查看好友列表通过`getFriendList`
   - 设置备注与删除好友操作

## 📌 特别说明
1. **缓存优化**：`getUnreadCount`函数实现了本地缓存机制，优先从localStorage读取会话列表计算未读数，减少不必要的API请求。

2. **Mock数据支持**：部分函数支持Mock模式，通过环境变量`VITE_USE_MOCK`控制，便于开发和测试。

3. **错误处理**：API调用包含完善的错误处理机制，确保在网络异常时也能返回格式化的响应，提高应用稳定性。

4. **WebSocket与HTTP结合**：系统采用WebSocket进行实时通讯，HTTP接口作为补充和备份机制，保证在各种网络环境下的可用性。

5. **消息格式**：消息内容采用JSON格式，通过类型字段区分不同消息，支持文本、图片、文件等多种媒体类型。