# AddFriend.vue 文件说明文档

## 📄 文件概述

`AddFriend.vue` 是校园交换平台中的添加好友页面组件，提供了多种添加好友的方式，包括搜索用户、扫描二维码等功能。该页面负责用户搜索和好友申请的交互流程，是社交功能的重要组成部分。

## 📦 所属包

该文件位于 `src/pages/social` 目录下，是社交功能模块的主要页面组件之一。它提供添加好友的用户界面和交互逻辑。

## 🔍 核心结构

### 模板结构 (template)

1. **页面布局**：
   - 头部导航：显示标题和返回按钮
   - 搜索区域：搜索框和搜索类型选择
   - 扫码添加：扫一扫和我的二维码入口
   - 搜索结果：用户列表和添加按钮
   - 底部导航：应用通用导航栏

2. **主要组件**：
   - `HeaderNav`：顶部导航组件
   - `FooterNav`：底部导航组件
   - `van-search`：搜索框组件
   - `van-dialog`：添加好友确认弹窗
   - `van-empty`：空状态提示组件
   - `van-list`：列表加载组件

### 脚本结构 (script)

1. **状态管理**：
   - `searchKeyword`：搜索关键词
   - `searchType`：搜索类型（用户名/学号/邮箱）
   - `searchResults`：搜索结果列表
   - `hasSearched`：是否已执行搜索
   - `loading`：加载状态控制
   - `requestMessage`：好友申请验证消息

2. **方法**：
   - 搜索相关：`searchUsers`、`loadMoreResults`、`clearSearch`
   - 好友申请：`sendFriendRequest`、`confirmSendRequest`
   - 二维码相关：`scanQRCode`、`showMyQRCode`、`generateQRCode`
   - 用户交互：`viewUserProfile`、`getInitials`

## 🔁 主要逻辑流程

1. **用户搜索流程**：
   - 用户选择搜索类型（用户名/学号/邮箱）
   - 输入搜索关键词后点击搜索
   - 发送API请求搜索用户
   - 展示搜索结果列表

2. **添加好友流程**：
   - 从搜索结果中选择用户点击添加
   - 弹出添加好友对话框
   - 输入验证消息
   - 提交好友申请

3. **二维码添加流程**：
   - 点击"扫一扫添加"调用设备相机扫描
   - 点击"我的二维码"生成并显示当前用户的社交二维码
   - 其他用户扫描后直接发起好友申请

## 📌 特别说明

1. **搜索策略**：
   - 支持多种搜索方式：用户名、学号、邮箱
   - 搜索结果分页加载，支持滚动加载更多
   - 搜索结果包含用户当前好友状态

2. **好友申请限制**：
   - 已是好友的用户不能重复添加
   - 已发送申请的用户显示"请求已发送"状态
   - 验证消息限制最大50个字符

3. **二维码功能**：
   - 使用 `qrcodejs2-fix` 库生成二维码
   - 二维码内容包含用户ID和验证信息
   - 二维码关闭时自动清理DOM节点，避免内存泄漏

4. **用户体验优化**：
   - 提供友好的空状态提示
   - 加载状态反馈清晰
   - 用户头像加载失败时显示首字母占位符
   - 搜索结果中显示学校、学号等辅助识别信息