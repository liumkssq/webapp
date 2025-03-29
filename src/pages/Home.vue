<template>
  <div class="home-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 搜索栏 -->
    <div class="search-bar" @click="goToSearch">
      <span>搜索商品、失物、用户...</span>
    </div>
    
    <!-- 轮播图区域 -->
    <div class="banner-area">
      <div class="banner-item">
        <!-- 这里将来会放轮播图 -->
        <div class="banner-placeholder">热门推荐</div>
      </div>
    </div>
    
    <!-- 分类导航 -->
    <div class="category-nav">
      <div class="category-item" @click="handleCategoryClick('secondhand')">
        <div class="category-icon">二手</div>
        <div class="category-name">二手市场</div>
      </div>
      <div class="category-item" @click="handleCategoryClick('lostfound')">
        <div class="category-icon">失物</div>
        <div class="category-name">失物招领</div>
      </div>
      <div class="category-item" @click="handleCategoryClick('group')">
        <div class="category-icon">群组</div>
        <div class="category-name">交流群组</div>
      </div>
      <div class="category-item" @click="handleCategoryClick('ai')">
        <div class="category-icon">AI</div>
        <div class="category-name">AI助手</div>
      </div>
    </div>
    
    <!-- 内容列表 -->
    <div class="content-list">
      <div class="list-header">
        <h3>最新发布</h3>
        <span @click="viewMore('latest')">查看更多</span>
      </div>
      
      <div class="list-content">
        <div 
          v-for="item in latestItems" 
          :key="item.id" 
          class="item-card"
          @click="goToDetail(item.id, item.type)"
        >
          <div class="item-image">
            <!-- 图片占位区域 -->
          </div>
          <div class="item-info">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-price" v-if="item.price">¥{{ item.price }}</div>
            <div class="item-meta">
              <span>{{ item.author }}</span>
              <span>{{ item.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 热门失物 -->
    <div class="content-list">
      <div class="list-header">
        <h3>热门失物</h3>
        <span @click="viewMore('lostfound')">查看更多</span>
      </div>
      
      <div class="list-content">
        <div 
          v-for="item in lostFoundItems" 
          :key="item.id" 
          class="item-card"
          @click="goToDetail(item.id, 'lostfound')"
        >
          <div class="item-image">
            <!-- 图片占位区域 -->
          </div>
          <div class="item-info">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span>{{ item.location }}</span>
              <span>{{ item.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部导航栏 -->
    <div class="bottom-nav">
      <div class="nav-item active">
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
      <div class="nav-item" @click="goToPath('/user/' + userId)">
        <div class="nav-icon">我的</div>
        <div class="nav-name">我的</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 获取用户ID
const userId = computed(() => userStore.userId || '1')

// 最新发布商品数据
const latestItems = ref([
  {
    id: '1',
    title: '九成新 iPhone 13 Pro Max',
    price: '4999',
    author: '用户1',
    date: '10分钟前',
    type: 'product'
  },
  {
    id: '2',
    title: '全新未拆封 AirPods Pro 2',
    price: '1599',
    author: '用户2',
    date: '30分钟前',
    type: 'product'
  },
  {
    id: '3',
    title: 'iPad Pro 2021款 95新',
    price: '3999',
    author: '用户3',
    date: '1小时前',
    type: 'product'
  }
])

// 失物招领数据
const lostFoundItems = ref([
  {
    id: '1',
    title: '在图书馆丢失一张学生卡',
    location: '中心图书馆',
    date: '2小时前'
  },
  {
    id: '2',
    title: '捡到一个黑色钱包',
    location: '教学楼',
    date: '3小时前'
  },
  {
    id: '3',
    title: '丢失蓝牙耳机',
    location: '食堂',
    date: '5小时前'
  }
])

// 页面挂载时获取数据
onMounted(() => {
  // 这里可以调用API获取数据
  console.log('页面已挂载，可以获取数据')
})

// 跳转到搜索页
const goToSearch = () => {
  router.push('/search')
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

// 查看更多
const viewMore = (type) => {
  if (type === 'lostfound') {
    router.push('/lost-found/list')
  } else {
    router.push('/article/list')
  }
}

// 点击分类
const handleCategoryClick = (category) => {
  switch (category) {
    case 'secondhand':
      router.push('/article/list')
      break
    case 'lostfound':
      router.push('/lost-found/list')
      break
    case 'group':
      router.push('/group/list')
      break
    case 'ai':
      router.push('/ai/chat')
      break
    default:
      break
  }
}

// 导航到指定路径
const goToPath = (path) => {
  router.push(path)
}
</script>