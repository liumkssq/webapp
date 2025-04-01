import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'
import { formatRedirectPath } from '../utils/redirect'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue'),
    meta: {
      title: '首页',
      showNavBar: false,
      keepAlive: true,
      scrollPosition: 0
    }
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
    path: '/user/me',
    name: 'UserMe',
    component: () => import('../pages/user/Profile.vue'),
    meta: {
      requiresAuth: true,
      title: '我的主页',
      description: '我的个人资料'
    },
    beforeEnter: (to, from, next) => {
      console.log('拦截/user/me路由，重定向到/mine');
      next('/mine');
    }
  },
  {
    path: '/user/profile',
    name: 'UserProfile',
    component: () => import('../pages/user/Profile.vue'),
    meta: {
      requiresAuth: true,
      title: '个人主页',
      description: '查看和编辑自己的个人资料'
    },
    beforeEnter: (to, from, next) => {
      console.log('拦截/user/profile路由，重定向到/mine');
      next('/mine');
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
  {
    path: '/user/:id',
    name: 'UserHomepage',
    component: () => import('../pages/user/Profile.vue'),
    props: true,
    meta: {
      title: '用户主页',
      description: '查看其他用户的资料'
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
  
  // 添加"我的"页面路由
  {
    path: '/mine',
    name: 'Mine',
    component: () => import('../pages/user/Mine.vue'),
    meta: {
      requiresAuth: false, // 临时关闭认证要求，方便测试
      title: '我的',
      description: '个人中心'
    }
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
  
  console.log(`路由导航完成: ${from.path} -> ${to.path}`);
  
  // 根据导航方向设置页面过渡名称（用于Vant组件）
  if (to.meta.transition !== false) {
    to.meta.transitionName = toDepth < fromDepth ? 'van-slide-right' : 'van-slide-left'
  }
})

// 全局路由守卫，处理登录验证
router.beforeEach((to, from, next) => {
  console.log('路由守卫处理: ', to.path, '来自', from.path);
  
  const userStore = useUserStore()
  // 检查token存在性
  const isLoggedIn = !!localStorage.getItem('token')
  console.log('当前登录状态:', isLoggedIn, '访问路径:', to.path);
  
  // 特殊处理 - 如果是从登录页跳转到个人中心，直接放行
  if (from.path.includes('/login') && to.path === '/mine') {
    console.log('从登录页到个人中心，跳过验证直接放行');
    next();
    return;
  }
  
  // 将当前路由信息记录到localStorage，方便恢复
  localStorage.setItem('lastRoute', JSON.stringify({
    path: to.path,
    query: to.query
  }))

  // 处理需要登录的路由
  if (to.matched.some(record => record.meta.requiresAuth)) {
    console.log(`路由${to.path}需要登录权限，当前登录状态:`, isLoggedIn)
    
    if (!isLoggedIn) {
      console.log('用户未登录，重定向到登录页面')
      
      // 构建重定向路径，避免URL编码带来的问题
      const redirectPath = formatRedirectPath(to.fullPath);
      console.log('重定向到:', `/login?redirect=${redirectPath}`);
      
      // 直接使用原始路径，避免Vue Router的自动转义
      window.location.href = `/login?redirect=${redirectPath}`;
      return;
    } else {
      // 用户已登录但可能没有完整的用户信息，这里不阻塞导航
      // 让页面组件在挂载时处理用户信息获取
      console.log('用户已登录，允许访问', to.path)
      next()
      
      // 后台异步验证token有效性，不阻塞导航
      userStore.getUserInfo().catch(error => {
        console.warn('获取用户信息失败，可能需要重新登录:', error)
      })
    }
  } else {
    // 不需要登录的路由直接放行
    next()
  }
  
  // 设置页面标题
  document.title = to.meta.title || '校园二手交易平台'
})

export default router