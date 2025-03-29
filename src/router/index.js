import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

// 引入页面组件
import Home from '@/pages/Home.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import ForgotPassword from '@/pages/ForgotPassword.vue'
import ArticleDetail from '@/pages/ArticleDetail.vue'
import ArticleList from '@/pages/ArticleList.vue'
import ProductDetail from '@/pages/ProductDetail.vue'
import ProductList from '@/pages/ProductList.vue'
import LostFoundDetail from '@/pages/LostFoundDetail.vue'
import LostFoundList from '@/pages/LostFoundList.vue'
import UserHomepage from '@/pages/UserHomepage.vue'
import PublishSelector from '@/pages/PublishSelector.vue'
import PublishArticle from '@/pages/PublishArticle.vue'
import PublishProduct from '@/pages/PublishProduct.vue'
import PublishLostFound from '@/pages/PublishLostFound.vue'
import Chat from '@/pages/Chat.vue'
import ChatList from '@/pages/ChatList.vue'
import Search from '@/pages/Search.vue'
import SearchResults from '@/pages/SearchResults.vue'
import Profile from '@/pages/Profile.vue'
import Settings from '@/pages/Settings.vue'
import ChangePassword from '@/pages/ChangePassword.vue'
import PrivacySettings from '@/pages/PrivacySettings.vue'
import AIAssist from '@/pages/AIAssist.vue'
import NotFound from '@/pages/NotFound.vue'

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: false,
      title: '首页'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      title: '登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      requiresAuth: false,
      title: '注册'
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      requiresAuth: false,
      title: '忘记密码'
    }
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: ArticleDetail,
    meta: {
      requiresAuth: false,
      title: '文章详情'
    }
  },
  {
    path: '/article-list',
    name: 'ArticleList',
    component: ArticleList,
    meta: {
      requiresAuth: false,
      title: '文章列表'
    }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetail,
    meta: {
      requiresAuth: false,
      title: '商品详情'
    }
  },
  {
    path: '/product-list',
    name: 'ProductList',
    component: ProductList,
    meta: {
      requiresAuth: false,
      title: '二手商品'
    }
  },
  {
    path: '/lost-found/:id',
    name: 'LostFoundDetail',
    component: LostFoundDetail,
    meta: {
      requiresAuth: false,
      title: '失物招领详情'
    }
  },
  {
    path: '/lost-found-list',
    name: 'LostFoundList',
    component: LostFoundList,
    meta: {
      requiresAuth: false,
      title: '失物招领'
    }
  },
  {
    path: '/user/:id',
    name: 'UserHomepage',
    component: UserHomepage,
    meta: {
      requiresAuth: false,
      title: '用户主页'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      requiresAuth: true,
      title: '个人资料'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      requiresAuth: true,
      title: '设置'
    }
  },
  {
    path: '/password/change',
    name: 'ChangePassword',
    component: ChangePassword,
    meta: {
      requiresAuth: true,
      title: '修改密码'
    }
  },
  {
    path: '/privacy/settings',
    name: 'PrivacySettings',
    component: PrivacySettings,
    meta: {
      requiresAuth: true,
      title: '隐私设置'
    }
  },
  {
    path: '/ai/assist',
    name: 'AIAssist',
    component: AIAssist,
    meta: {
      requiresAuth: true,
      title: 'AI助手'
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: Search,
    meta: {
      requiresAuth: false,
      title: '搜索'
    }
  },
  {
    path: '/search-results',
    name: 'SearchResults',
    component: SearchResults,
    meta: {
      requiresAuth: false,
      title: '搜索结果'
    }
  },
  {
    path: '/publish',
    name: 'PublishSelector',
    component: PublishSelector,
    meta: {
      requiresAuth: true,
      title: '发布'
    }
  },
  {
    path: '/publish-article',
    name: 'PublishArticle',
    component: PublishArticle,
    meta: {
      requiresAuth: true,
      title: '发布文章'
    }
  },
  {
    path: '/publish-product',
    name: 'PublishProduct',
    component: PublishProduct,
    meta: {
      requiresAuth: true,
      title: '发布商品'
    }
  },
  {
    path: '/publish-lost-found',
    name: 'PublishLostFound',
    component: PublishLostFound,
    meta: {
      requiresAuth: true,
      title: '发布失物招领'
    }
  },
  {
    path: '/chat/:id',
    name: 'Chat',
    component: Chat,
    meta: {
      requiresAuth: true,
      title: '聊天'
    }
  },
  {
    path: '/chat-list',
    name: 'ChatList',
    component: ChatList,
    meta: {
      requiresAuth: true,
      title: '消息列表'
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      requiresAuth: false,
      title: '页面不存在'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局导航守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 校园二手交易与失物招领平台` : '校园二手交易与失物招领平台'
  
  // 检查是否需要登录权限
  if (to.meta.requiresAuth) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  
  next()
})

export default router