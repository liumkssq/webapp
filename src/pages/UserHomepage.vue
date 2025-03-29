<template>
  <div class="user-homepage-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 用户信息 -->
    <div class="user-info">
      <div class="user-avatar">
        <!-- 头像区域 -->
      </div>
      
      <div class="user-details">
        <h2>{{ userProfile.nickname }}</h2>
        <p class="username">@{{ userProfile.username }}</p>
        
        <p class="bio">{{ userProfile.bio || '这个人很懒，什么都没留下' }}</p>
        
        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-value">{{ userProfile.posts }}</span>
            <span class="stat-label">发布</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-value">{{ userProfile.followers }}</span>
            <span class="stat-label">粉丝</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-value">{{ userProfile.following }}</span>
            <span class="stat-label">关注</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="action-buttons">
      <button 
        v-if="isCurrentUser" 
        class="edit-profile-btn"
        @click="goToSettings"
      >
        编辑资料
      </button>
      
      <template v-else>
        <button 
          class="follow-btn"
          :class="{ 'following': userProfile.isFollowing }"
          @click="handleFollowAction"
        >
          {{ userProfile.isFollowing ? '已关注' : '关注' }}
        </button>
        
        <button class="message-btn" @click="goToChat">
          发消息
        </button>
      </template>
    </div>
    
    <!-- 内容选项卡 -->
    <div class="content-tabs">
      <div 
        class="tab-item" 
        :class="{ 'active': activeTab === 'posts' }"
        @click="activeTab = 'posts'"
      >
        发布
      </div>
      
      <div 
        class="tab-item" 
        :class="{ 'active': activeTab === 'products' }"
        @click="activeTab = 'products'"
      >
        商品
      </div>
      
      <div 
        class="tab-item" 
        :class="{ 'active': activeTab === 'lostfound' }"
        @click="activeTab = 'lostfound'"
      >
        失物招领
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="tab-content">
      <!-- 发布内容 -->
      <div v-if="activeTab === 'posts'" class="content-list">
        <div 
          v-for="item in userPosts" 
          :key="item.id" 
          class="item-card"
          @click="goToDetail(item.id, 'article')"
        >
          <div class="item-image">
            <!-- 图片区域 -->
          </div>
          
          <div class="item-info">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span>{{ item.date }}</span>
              <span>{{ item.views }} 浏览</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 商品内容 -->
      <div v-if="activeTab === 'products'" class="content-list">
        <div 
          v-for="item in userProducts" 
          :key="item.id" 
          class="item-card"
          @click="goToDetail(item.id, 'product')"
        >
          <div class="item-image">
            <!-- 图片区域 -->
          </div>
          
          <div class="item-info">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-price">¥{{ item.price }}</div>
            <div class="item-meta">
              <span>{{ item.date }}</span>
              <span>{{ item.status }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 失物招领内容 -->
      <div v-if="activeTab === 'lostfound'" class="content-list">
        <div 
          v-for="item in userLostFound" 
          :key="item.id" 
          class="item-card"
          @click="goToDetail(item.id, 'lostfound')"
        >
          <div class="item-image">
            <!-- 图片区域 -->
          </div>
          
          <div class="item-info">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span>{{ item.location }}</span>
              <span>{{ item.date }}</span>
              <span>{{ item.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部导航栏 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="goToPath('/home')">
        <div class="nav-icon">首页</div>
        <div class="nav-name">首页</div>
      </div>
      <div class="nav-item" @click="goToPath('/article/list')">
        <div class="nav-icon">发现</div>
        <div class="nav-name">发现</div>
      </div>
      <div class="nav-item" @click="goToPath('/publish')">
        <div class="nav-icon">发布</div>
        <div class="nav-name">发布</div>
      </div>
      <div class="nav-item" @click="goToPath('/chat')">
        <div class="nav-icon">消息</div>
        <div class="nav-name">消息</div>
      </div>
      <div class="nav-item active">
        <div class="nav-icon">我的</div>
        <div class="nav-name">我的</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getUserProfile, followUser, unfollowUser } from '@/api/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 获取用户ID
const userId = computed(() => route.params.id)

// 判断是否为当前登录用户
const isCurrentUser = computed(() => userId.value === userStore.userId)

// 活动选项卡
const activeTab = ref('posts')

// 用户资料
const userProfile = reactive({
  id: '',
  username: '',
  nickname: '',
  avatar: '',
  bio: '',
  followers: 0,
  following: 0,
  posts: 0,
  isFollowing: false
})

// 用户发布的文章
const userPosts = ref([
  {
    id: '1',
    title: '校园生活分享',
    date: '2023-03-15',
    views: 158
  },
  {
    id: '2',
    title: '考研经验总结',
    date: '2023-02-20',
    views: 324
  },
  {
    id: '3',
    title: '校园美食推荐',
    date: '2023-01-05',
    views: 205
  }
])

// 用户发布的商品
const userProducts = ref([
  {
    id: '1',
    title: '九成新 MacBook Pro 2021',
    price: '8999',
    date: '2023-03-10',
    status: '在售'
  },
  {
    id: '2',
    title: '全新未拆封 iPad Air',
    price: '3899',
    date: '2023-02-28',
    status: '在售'
  },
  {
    id: '3',
    title: 'AirPods 2代',
    price: '699',
    date: '2023-02-15',
    status: '已售出'
  }
])

// 用户发布的失物招领
const userLostFound = ref([
  {
    id: '1',
    title: '捡到一把钥匙',
    location: '教学楼',
    date: '2023-03-12',
    status: '未认领'
  },
  {
    id: '2',
    title: '丢失学生证',
    location: '图书馆',
    date: '2023-03-05',
    status: '已找回'
  }
])

// 页面挂载时获取用户资料
onMounted(async () => {
  try {
    const { data } = await getUserProfile(userId.value)
    Object.assign(userProfile, data)
  } catch (error) {
    console.error('获取用户资料失败', error)
  }
})

// 关注/取消关注
const handleFollowAction = async () => {
  try {
    if (userProfile.isFollowing) {
      await unfollowUser(userId.value)
      userProfile.isFollowing = false
      userProfile.followers--
    } else {
      await followUser(userId.value)
      userProfile.isFollowing = true
      userProfile.followers++
    }
  } catch (error) {
    console.error('操作失败', error)
  }
}

// 跳转到设置页面
const goToSettings = () => {
  router.push('/profile/settings')
}

// 跳转到聊天页面
const goToChat = () => {
  router.push(`/chat/private/${userId.value}`)
}

// 跳转到详情页
const goToDetail = (id, type) => {
  if (type === 'product') {
    router.push(`/product/${id}`)
  } else if (type === 'lostfound') {
    router.push(`/lost-found/${id}`)
  } else {
    router.push(`/article/${id}`)
  }
}

// 导航到指定路径
const goToPath = (path) => {
  router.push(path)
}
</script>