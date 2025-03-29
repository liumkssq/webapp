# 校园二手交易与失物招领平台

## 项目介绍
本项目是一个针对校园用户的二手交易和失物招领平台，专注于移动端体验，提供了用户身份管理、商品浏览、失物招领、即时通讯等功能。

## 技术栈
- 前端框架：Vue 3 (使用 Composition API)
- 构建工具：Vite
- UI组件：Tailwind CSS
- 状态管理：Pinia
- 路由管理：Vue Router
- HTTP请求：Axios
- 模拟数据：Mock.js

## 项目结构
```
src/
 ├─ api/                    // API封装
 │    ├─ user.js            // 用户相关接口
 │    ├─ article.js         // 文章相关接口
 │    ├─ product.js         // 商品相关接口
 │    ├─ lostFound.js       // 失物招领相关接口
 │    ├─ chat.js            // 聊天相关接口
 │    └─ swagger.json       // API文档
 ├─ assets/                 // 静态资源
 ├─ components/             // 组件
 │    ├─ common/            // 公共组件
 │    ├─ article/           // 文章相关组件
 │    ├─ product/           // 商品相关组件
 │    ├─ lostFound/         // 失物招领相关组件
 │    ├─ chat/              // 聊天相关组件
 │    └─ ui/                // UI组件
 ├─ mock/                   // Mock数据
 │    ├─ index.js           // Mock入口
 │    └─ modules/           // Mock模块
 │         ├─ user.js       // 用户相关Mock
 │         └─ article.js    // 文章相关Mock
 ├─ pages/                  // 页面
 │    ├─ Home.vue           // 首页
 │    ├─ Login.vue          // 登录页
 │    ├─ Register.vue       // 注册页
 │    ├─ ForgotPassword.vue // 忘记密码页
 │    ├─ ArticleDetail.vue  // 文章详情页
 │    └─ UserHomepage.vue   // 用户主页
 ├─ router/                 // 路由
 │    └─ index.js           // 路由配置
 ├─ store/                  // 状态管理
 │    ├─ index.js           // 状态管理入口
 │    └─ user.js            // 用户状态
 ├─ styles/                 // 样式
 │    └─ index.css          // 全局样式
 ├─ utils/                  // 工具
 │    ├─ index.js           // 工具函数
 │    └─ request.js         // 请求封装
 ├─ App.vue                 // 根组件
 └─ main.js                 // 入口文件
```

## 功能模块

### 用户身份管理
- 登录与注册
- 第三方登录（微信、QQ、微博）
- 忘记密码
- 个人资料管理

### 主页展示
- 热门商品和文章推荐
- 分类导航
- 轮播图展示

### 文章与商品
- 文章列表与详情页
- 商品列表与详情页
- 评论与点赞功能

### 失物招领
- 失物招领列表与详情页
- 地点标记
- 状态管理（已找回/未找回）

### 发布功能
- 发布商品
- 发布文章
- 发布失物招领信息
- AI辅助发布

### 即时通讯
- 私聊功能
- 群聊功能
- 消息提醒
- AI聊天

### 个人中心
- 个人资料展示
- 发布记录
- 收藏与点赞管理
- 关注与粉丝列表

## 开发进度

### 已完成
- [x] 项目基础架构搭建
- [x] 路由配置
- [x] 用户状态管理
- [x] API 接口封装
- [x] Mock 数据基础配置
- [x] 登录页面
- [x] 注册页面
- [x] 忘记密码页面
- [x] 主页基础结构
- [x] 用户主页基础结构
- [x] 文章详情页基础结构

### 待完成
- [ ] UI组件开发
- [ ] 商品列表与详情页面
- [ ] 失物招领列表与详情页面
- [ ] 发布功能页面
- [ ] 聊天功能实现
- [ ] 搜索与通知功能
- [ ] AI辅助功能
- [ ] 样式美化
- [ ] 移动端适配优化
- [ ] 性能优化

## 安装与运行

### 安装依赖
```bash
npm install
```

### 开发环境运行
```bash
npm run dev
```

### 构建生产环境
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## API 文档
API 文档使用 Swagger 格式编写，位于 `src/api/swagger.json`，可导入到 Swagger UI 查看。

## Mock 数据
项目使用 Mock.js 模拟后端接口，开发环境下自动启用 Mock 数据。如需关闭，请修改 `src/main.js` 中的导入配置。

## 前后端分离
项目采用前后端分离设计，API 接口统一封装在 `src/api` 目录下，可无缝切换 Mock 数据和真实后端接口。