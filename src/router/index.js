import { createRouter, createWebHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue')
  },
  // 认证相关路由
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/auth/Login.vue'),
    meta: {
      requiresGuest: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../pages/auth/Register.vue'),
    meta: {
      requiresGuest: true
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../pages/auth/ForgotPassword.vue'),
    meta: {
      requiresGuest: true
    }
  },
  
  // 产品相关路由
  {
    path: '/product/list',
    name: 'ProductList',
    component: () => import('../pages/product/List.vue')
  },
  {
    path: '/product/detail/:id',
    name: 'ProductDetail',
    component: () => import('../pages/product/Detail.vue'),
    props: true
  },
  
  // 失物招领相关路由
  {
    path: '/lost-found/list',
    name: 'LostFoundList',
    component: () => import('../pages/lostFound/List.vue')
  },
  {
    path: '/lost-found/detail/:id',
    name: 'LostFoundDetail',
    component: () => import('../pages/lostFound/Detail.vue'),
    props: true
  },
  // 支持查询参数方式的详情页
  {
    path: '/lost-found/detail',
    name: 'LostFoundDetailQuery',
    component: () => import('../pages/lostFound/Detail.vue'),
    props: route => ({ id: Number(route.query.id) })
  },
  
  // 文章相关路由
  {
    path: '/article/list',
    name: 'ArticleList',
    component: () => import('../pages/article/List.vue')
  },
  {
    path: '/article/detail/:id',
    name: 'ArticleDetail',
    component: () => import('../pages/article/Detail.vue'),
    props: true
  },
  
  // 发布相关路由 - 统一格式为 /publish/xxx
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('../pages/publish/Selector.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/publish/product',
    name: 'PublishProduct',
    component: () => import('../pages/publish/Product.vue'),
    meta: {
      requiresAuth: true
    }
  },
  // 兼容性重定向
  {
    path: '/publish-product',
    redirect: '/publish/product'
  },
  {
    path: '/publish/lost-found',
    name: 'PublishLostFound',
    component: () => import('../pages/publish/LostFound.vue'),
    meta: {
      requiresAuth: true
    }
  },
  // 兼容性重定向
  {
    path: '/publish-lost-found',
    redirect: '/publish/lost-found'
  },
  {
    path: '/publish/article',
    name: 'PublishArticle',
    component: () => import('../pages/publish/Article.vue'),
    meta: {
      requiresAuth: true
    }
  },
  // 兼容性重定向
  {
    path: '/publish-article',
    redirect: '/publish/article'
  },
  
  // 消息与聊天相关路由
  {
    path: '/message',
    redirect: '/im/conversations'
  },
  {
    path: '/chat',
    redirect: '/im/conversations'
  },
  {
    path: '/chat/list',
    redirect: '/im/conversations'
  },
  {
    path: '/im/message',
    redirect: '/im/conversations'
  },
  {
    path: '/chat/conversation/:id',
    name: 'ConversationDetail',
    component: () => import('../pages/im/Chat.vue'),
    meta: {
      requiresAuth: true,
      title: '聊天'
    },
    props: route => ({
      conversationType: 'private',
      targetId: parseInt(route.params.id)
    })
  },
  
  // 搜索相关路由
  {
    path: '/search',
    name: 'Search',
    component: () => import('../pages/search/Index.vue')
  },
  {
    path: '/search/results',
    name: 'SearchResults',
    component: () => import('../pages/search/Results.vue')
  },
  {
    path: '/search-results',
    redirect: '/search/results'
  },
  
  // IM相关路由
  {
    path: '/im/message',
    name: 'ImMessage',
    component: () => import('../pages/im/ImMessagePage.vue'),
    meta: {
      requiresAuth: true,
      title: '消息'
    }
  },
  {
    path: '/im/conversations',
    name: 'ImConversations',
    component: () => import('../pages/im/Conversations.vue'),
    meta: {
      requiresAuth: true,
      title: '会话列表'
    }
  },
  {
    path: '/im/contacts',
    name: 'ContactList',
    component: () => import('../pages/im/ContactList.vue'),
    meta: {
      requiresAuth: true,
      title: '联系人'
    }
  },
  {
    path: '/im/friend-requests',
    name: 'FriendRequests',
    component: () => import('../pages/im/FriendRequests.vue'),
    meta: {
      requiresAuth: true,
      title: '新朋友'
    }
  },
  {
    path: '/im/user/:id',
    name: 'ImUserProfile',
    component: () => import('../pages/im/UserProfile.vue'),
    meta: {
      requiresAuth: true,
      title: '个人资料'
    },
    props: true
  },
  {
    path: '/im/groups',
    name: 'GroupList',
    component: () => import('../pages/im/GroupList.vue'),
    meta: {
      requiresAuth: true,
      title: '群聊列表'
    }
  },
  {
    path: '/im/group/:id',
    name: 'GroupDetail',
    component: () => import('../pages/im/Chat.vue'),
    meta: {
      requiresAuth: true,
      title: '群聊'
    },
    props: route => ({
      conversationType: 'group',
      targetId: parseInt(route.params.id)
    })
  },
  {
    path: '/im/chat/:id',
    name: 'ImConversationDetail',
    component: () => import('../pages/im/Chat.vue'),
    meta: {
      requiresAuth: true,
      title: '聊天'
    },
    props: route => ({
      conversationType: 'private',
      targetId: parseInt(route.params.id)
    })
  },
  
  // 用户相关路由
  {
    path: '/user/:id',
    name: 'UserHomepage',
    component: () => import('../pages/user/Homepage.vue'),
    props: true
  },
  {
    path: '/user/profile',
    name: 'UserProfile',
    component: () => import('../pages/user/Profile.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/user/settings',
    name: 'UserSettings',
    component: () => import('../pages/user/Settings.vue'),
    meta: {
      requiresAuth: true
    }
  },
  
  // 设置相关路由
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../pages/settings/Index.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/settings/privacy',
    name: 'PrivacySettings',
    component: () => import('../pages/settings/Privacy.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/settings/change-password',
    name: 'ChangePassword',
    component: () => import('../pages/settings/ChangePassword.vue'),
    meta: {
      requiresAuth: true
    }
  },
  
  // 地图相关路由 - 统一格式为 /map/xxx
  {
    path: '/map/picker',
    name: 'MapPicker',
    component: () => import('../pages/map/MapPickerPage.vue')
  },
  // 兼容性重定向
  {
    path: '/location-picker',
    redirect: '/map/picker'
  },
  {
    path: '/map-picker',
    redirect: '/map/picker'
  },
  {
    path: '/map/demo',
    name: 'MapDemo',
    component: () => import('../pages/map/MapDemo.vue')
  },
  
  // AI辅助相关路由
  {
    path: '/ai/assist',
    name: 'AIAssist',
    component: () => import('../pages/common/AIAssist.vue'),
    meta: {
      requiresAuth: true
    }
  },
  // 兼容性重定向
  {
    path: '/ai-assist',
    redirect: '/ai/assist'
  },
  
  // 示例页面路由
  {
    path: '/examples/map',
    name: 'MapExample',
    component: () => import('../components/examples/MapExample.vue')
  },
  {
    path: '/examples/product-publish',
    name: 'ProductPublishExample',
    component: () => import('../components/examples/ProductPublishExample.vue')
  },
  
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/NotFound.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
  // 确保保留查询参数
  parseQuery: (query) => {
    // 使用默认的查询字符串解析
    return new URLSearchParams(query)
  },
  stringifyQuery: (query) => {
    // 将查询对象转换为字符串
    const searchParams = new URLSearchParams()
    for (const key in query) {
      if (query[key] !== undefined && query[key] !== null) {
        searchParams.append(key, query[key])
      }
    }
    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }
})

// 全局导航后置钩子，用于设置页面过渡效果
router.afterEach((to, from) => {
  // 获取根路径的层级深度
  const toDepth = to.path.split('/').length
  const fromDepth = from.path.split('/').length
  
  // 根据导航方向设置页面过渡名称（用于Vant组件）
  if (to.meta.transition !== false) {
    to.meta.transitionName = toDepth < fromDepth ? 'van-slide-right' : 'van-slide-left'
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 从localStorage获取token
  const token = localStorage.getItem('token')
  
  // 需要登录的页面
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } 
  // 只有未登录用户可以访问的页面（如登录、注册）
  else if (to.matched.some(record => record.meta.requiresGuest)) {
    if (token) {
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router