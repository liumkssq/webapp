# 校园信息平台

校园信息平台是一个基于Vue 3和Vite构建的综合性校园服务平台，旨在为校园生活提供便捷的信息交流、商品交易、失物招领等服务。

## 功能特点

- 用户管理：注册、登录、个人信息管理
- 二手交易：发布、搜索、购买二手商品
- 失物招领：发布、查找失物和招领信息
- 校园资讯：发布、浏览校园热门话题和活动
- 即时通讯：
  - 一对一聊天、群组聊天
  - 好友管理（添加好友、删除好友、好友备注）
  - 群聊管理（创建群聊、退出群聊、群成员管理）
  - 消息推送和未读消息提醒
- 位置服务：基于百度地图的位置选择和展示

## 技术栈

- **前端框架**：Vue 3 + Composition API
- **构建工具**：Vite
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **UI组件库**：Vant UI
- **HTTP请求**：Axios
- **地图服务**：百度地图JavaScript API

## 项目结构

```
Webapp/
├── public/               # 静态资源
├── src/
│   ├── api/              # API接口定义
│   │   ├── user.js       # 用户相关API
│   │   ├── chat.js       # 聊天相关API
│   │   ├── im.js         # 即时通讯相关API
│   │   ├── product.js    # 商品相关API
│   │   ├── article.js    # 文章相关API
│   │   └── lostFound.js  # 失物招领相关API
│   ├── assets/           # 项目资源文件
│   ├── components/       # 公共组件
│   │   ├── common/       # 通用组件
│   │   ├── product/      # 商品相关组件
│   │   ├── article/      # 文章相关组件
│   │   ├── lostFound/    # 失物招领相关组件
│   │   ├── map/          # 地图相关组件
│   │   ├── im/           # 即时通讯相关组件
│   │   └── user/         # 用户相关组件
│   ├── mock/             # 模拟数据
│   │   ├── index.js      # 模拟数据入口
│   │   └── modules/      # 模拟数据模块
│   ├── pages/            # 页面组件
│   │   ├── auth/         # 认证相关页面
│   │   ├── product/      # 商品相关页面
│   │   ├── article/      # 文章相关页面
│   │   ├── lostFound/    # 失物招领相关页面
│   │   ├── im/           # 即时通讯相关页面
│   │   └── user/         # 用户相关页面
│   ├── router/           # 路由配置
│   ├── store/            # 状态管理
│   ├── utils/            # 工具函数
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── .env                  # 环境变量
├── .eslintrc.js          # ESLint配置
├── index.html            # HTML模板
├── package.json          # 项目依赖
└── vite.config.js        # Vite配置
```

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 生产环境构建

```bash
npm run build
```

## 即时通讯功能

项目的即时通讯功能实现了以下特性：

### 1. 好友管理
- 搜索并添加好友
- 接受/拒绝好友申请
- 删除好友
- 设置好友备注
- 查看好友资料

### 2. 私聊功能
- 发送文本消息
- 发送图片消息
- 发送语音消息
- 发送位置信息
- 撤回消息
- 消息已读状态
- 未读消息提醒

### 3. 群聊功能
- 创建群聊
- 邀请好友加入群聊
- 群聊消息
- 退出群聊
- 解散群聊（群主）

### 4. 会话管理
- 会话列表分页加载
- 下拉刷新会话列表
- 左滑快捷动作（标记已读、删除会话）
- 新聊天弹出菜单

### 5. 其他功能
- 会话置顶
- 消息免打扰
- 清空聊天记录
- 在线状态显示
- iOS风格滑动手势和视觉反馈

## 模拟数据

项目使用Mock.js模拟后端API数据，便于前端开发和测试。模拟数据位于`src/mock`目录下，分为以下模块：

- user.js：用户相关数据
- product.js：商品相关数据
- article.js：文章相关数据
- lostFound.js：失物招领相关数据
- chat.js：聊天相关数据
- im.js：即时通讯相关数据

## API接口

项目API接口位于`src/api`目录下，分为以下模块：

- user.js：用户相关接口
- product.js：商品相关接口
- article.js：文章相关接口
- lostFound.js：失物招领相关接口
- chat.js：基础聊天相关接口
- im.js：完整即时通讯相关接口

## 地图功能

项目使用百度地图JavaScript API实现地图相关功能，包括：

- 位置选择
- 地址搜索
- 定位功能
- 距离计算

## 贡献指南

1. Fork本项目
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个Pull Request

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 联系方式

如有任何问题或建议，请通过以下方式联系我们：

- 邮箱：example@example.com
- GitHub Issues