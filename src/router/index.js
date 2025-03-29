import { createRouter, createWebHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue')
  },
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
  {
    path: '/publish/lost-found',
    name: 'PublishLostFound',
    component: () => import('../pages/publish/LostFound.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/publish/article',
    name: 'PublishArticle',
    component: () => import('../pages/publish/Article.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/message',
    name: 'Message',
    component: () => import('../pages/Message.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../pages/chat/Index.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/chat/list',
    name: 'ChatList',
    component: () => import('../pages/chat/List.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/chat/conversation/:id',
    name: 'ChatConversation',
    component: () => import('../pages/chat/Conversation.vue'),
    props: true,
    meta: {
      requiresAuth: true
    }
  },
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
    path: '/location-picker',
    name: 'LocationPicker',
    component: () => import('../pages/common/LocationPicker.vue')
  },
  {
    path: '/ai-assist',
    name: 'AIAssist',
    component: () => import('../pages/common/AIAssist.vue'),
    meta: {
      requiresAuth: true
    }
  },
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