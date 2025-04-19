# social.js (Pinia Store) 文件说明文档

## 📄 文件概述

`social.js` 是校园交换平台中使用 Pinia 实现的社交功能状态管理模块，主要负责管理好友列表、在线好友状态、好友请求等社交数据，为前端组件提供集中式的数据管理和共享能力。

## 📦 所属包

该文件位于 `src/store` 目录下，是项目状态管理层的一部分。它基于 Pinia 状态管理库，与其他 store 模块一起构成了应用的全局状态管理系统。

## 🔍 核心结构

### 状态 (state)

1. **`friendList`**：用户的好友列表
2. **`onlineFriends`**：当前在线的好友列表
3. **`loading`**：好友列表加载状态标识
4. **`friendRequestCount`**：未处理的好友请求数量
5. **`lastUpdateTime`**：数据最后更新时间戳

### 计算属性 (getters)

1. **`allFriends`**：获取所有好友列表
2. **`onlineFriendsList`**：获取在线好友列表
3. **`friendCount`**：获取好友总数
4. **`onlineFriendCount`**：获取在线好友数量
5. **`hasNewFriendRequests`**：判断是否有新的好友请求

### 动作 (actions)

1. **数据加载类**：
   - **`loadFriendList(force)`**：加载好友列表数据
   - **`loadOnlineFriends()`**：加载在线好友列表
   - **`loadFriendRequestCount()`**：加载好友请求未读数量

2. **数据操作类**：
   - **`setFriendRequestCount(count)`**：设置好友请求未读数量
   - **`updateFriendStatus(friendId, isOnline)`**：更新好友在线状态
   - **`addFriend(friend)`**：添加新好友到列表
   - **`removeFriend(friendId)`**：从列表中移除好友
   - **`updateFriendInfo(friendId, updates)`**：更新好友信息
   - **`resetState()`**：重置状态到初始值

## 🔁 主要逻辑流程

1. **数据初始化流程**：
   - 组件初始化时调用 `loadFriendList` 加载好友数据
   - 组件初始化时调用 `loadOnlineFriends` 加载在线好友数据
   - 组件初始化时调用 `loadFriendRequestCount` 加载好友请求数量
   - 数据加载完成后，通过 getters 访问处理后的数据

2. **数据更新流程**：
   - 好友状态变化时调用 `updateFriendStatus` 更新状态
   - 新增好友时调用 `addFriend` 更新列表
   - 删除好友时调用 `removeFriend` 更新列表
   - 好友信息变更时调用 `updateFriendInfo` 更新信息
   - 用户登出时调用 `resetState` 清空数据

3. **数据缓存机制**：
   - 通过 `lastUpdateTime` 记录数据更新时间
   - `loadFriendList` 支持 force 参数强制刷新
   - 非强制刷新时，5分钟内不重复加载数据

## 📌 特别说明

1. **数据结构**：
   - 好友对象结构包含 id、username、avatar、isOnline 等属性
   - 好友列表使用数组形式存储，方便遍历和过滤

2. **性能优化**：
   - 实现了数据缓存机制，避免频繁请求后端
   - 通过更新单个好友信息而非整个列表，提高性能

3. **数据一致性**：
   - 同步更新 `friendList` 和 `onlineFriends` 数据
   - 确保在线状态变化时，两个列表的数据保持一致

4. **错误处理**：
   - 所有 API 调用都有错误捕获和日志记录
   - API 调用失败不会影响本地状态的更新

5. **扩展性**：
   - 该模块设计为可扩展结构，可以方便地添加新的状态和操作
   - 所有 actions 都有清晰的功能边界，便于维护和扩展