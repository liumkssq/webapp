# 社交功能模块

## 模块概述

社交功能模块是校园交换平台的核心功能之一，为用户提供了好友管理、群组交流、即时通讯等社交互动能力。该模块旨在构建校园内的社交网络，增强用户粘性并促进校园社交活动。

## 功能列表

### 好友管理

- **好友列表**：查看所有好友和在线好友
- **添加好友**：通过用户名、学号、邮箱或二维码添加好友
- **好友请求**：管理收到和发出的好友请求
- **好友设置**：设置好友备注、删除好友等操作

### 群组管理

- **群组列表**：查看已加入的群组
- **创建群组**：创建新群组并邀请好友加入
- **加入群组**：通过群组ID加入群组
- **群组互动**：群内消息、群公告等功能

### 即时通讯

- **私聊**：与好友进行一对一聊天
- **群聊**：在群组内进行多人聊天
- **消息类型**：支持文本、图片等多种消息类型

## 页面组件

| 文件名 | 功能描述 | 路由路径 |
|--------|----------|----------|
| `Friends.vue` | 好友列表页面，展示和管理好友 | `/social/friends` |
| `AddFriend.vue` | 添加好友页面，提供多种添加方式 | `/social/add-friend` |
| `FriendRequests.vue` | 好友请求页面，处理好友申请 | `/social/friend-requests` |
| `Groups.vue` | 群组管理页面，展示和管理群组 | `/social/groups` |

## 数据流

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   API模块   │ <──> │  Pinia Store │ <──> │  页面组件   │
│  social.js  │      │  social.js   │      │ *.vue files │
└─────────────┘      └──────────────┘      └─────────────┘
```

- **API模块**：负责与后端服务进行数据交互
- **Pinia Store**：负责状态管理，存储和处理社交数据
- **页面组件**：负责用户界面展示和交互逻辑

## 技术栈

- **Vue 3**：前端框架
- **Vant UI**：移动端组件库
- **Pinia**：状态管理库
- **Axios**：HTTP请求库
- **date-fns**：日期处理库
- **qrcodejs2-fix**：二维码生成库

## 开发指南

### 添加新功能

1. 在 `src/api/social.js` 中添加相应的API接口
2. 在 `src/store/social.js` 中添加状态管理逻辑
3. 在 `src/pages/social/` 目录下创建新的页面组件
4. 在 `src/router/index.js` 中添加新页面的路由配置

### 修改现有功能

1. 了解功能对应的组件和API
2. 修改相应的组件或API实现
3. 确保数据流正确，保持组件、Store和API的一致性
4. 测试修改后的功能在各种场景下的表现

## 注意事项

1. **数据一致性**：确保好友和群组数据在各个组件间保持一致
2. **错误处理**：所有API调用都要有合适的错误处理和用户提示
3. **性能优化**：大量数据时使用虚拟列表、分页加载等优化手段
4. **用户体验**：提供清晰的状态反馈和友好的空状态处理
5. **安全考虑**：敏感操作需要二次确认，防止误操作
6. **扩展性**：代码结构应支持未来功能扩展，如新的消息类型等

## 未来计划

1. 增加好友分组功能
2. 优化群组管理功能，支持设置管理员、群成员管理等
3. 支持更多消息类型，如语音、视频、文件等
4. 增加在线状态实时更新
5. 支持"摇一摇"添加好友等互动方式
6. 增加社交动态，展示好友最新活动