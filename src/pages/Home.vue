<template>
  <page-container>
    <div class="home-page">
      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <input
            type="text"
            v-model="searchKeyword"
            placeholder="搜索商品、文章、失物招领..."
            @keyup.enter="handleSearch"
        />
        <button @click="handleSearch">搜索</button>
      </div>

      <!-- 轮播图 -->
      <div class="banner-swiper">
        <div class="swiper-container">
          <div
              v-for="(banner, index) in banners"
              :key="index"
              class="swiper-item"
              :class="{ active: currentBannerIndex === index }"
              :style="{ backgroundImage: `url(${banner.imageUrl})` }"
              @click="handleBannerClick(banner)"
          >
            <div class="banner-title">{{ banner.title }}</div>
          </div>
        </div>
        <div class="indicator">
          <span
              v-for="(_, index) in banners"
              :key="index"
              :class="{ active: currentBannerIndex === index }"
              @click="currentBannerIndex = index"
          ></span>
        </div>
      </div>

      <!-- 功能入口 -->
      <div class="feature-entries">
        <div
            v-for="entry in featureEntries"
            :key="entry.id"
            class="entry-item"
            @click="handleFeatureClick(entry)"
        >
          <div class="entry-icon" :style="{ backgroundColor: entry.color }">
            <svg-icon :name="entry.icon" size="24" />
          </div>
          <div class="entry-name">{{ entry.name }}</div>
        </div>
      </div>

      <!-- 内容区块 -->
      <div class="content-blocks">
        <!-- 热门商品 -->
        <div class="content-block">
          <div class="block-header">
            <h3>热门商品</h3>
            <div class="view-more" @click="router.push('/product/list')">查看更多 ></div>
          </div>
          <div class="product-list">
            <product-item
                v-for="product in hotProducts"
                :key="product.id"
                :product="product"
                :show-description="false"
                @click="router.push(`/product/detail/${product.id}`)"
            ></product-item>
          </div>
        </div>

        <!-- 最新失物招领 -->
        <div class="content-block">
          <div class="block-header">
            <h3>最新失物招领</h3>
            <div class="view-more" @click="router.push('/lost-found/list')">查看更多 ></div>
          </div>
          <div class="lost-found-list">
            <lost-found-item
                v-for="item in latestLostFound"
                :key="item.id"
                :item="item"
                :show-description="false"
                @click="router.push(`/lost-found/detail/${item.id}`)"
            ></lost-found-item>
          </div>
        </div>

        <!-- 热门话题 -->
        <div class="content-block">
          <div class="block-header">
            <h3>热门话题</h3>
            <div class="view-more" @click="router.push('/article/list')">查看更多 ></div>
          </div>
          <div class="article-list">
            <div
                v-for="article in hotArticles"
                :key="article.id"
                class="article-item"
                @click="router.push(`/article/detail/${article.id}`)"
            >
              <div class="article-info">
                <div class="article-title">{{ article.title }}</div>
                <div class="article-brief">{{ article.brief }}</div>
                <div class="article-meta">
                  <span class="author">{{ article.author.nickname }}</span>
                  <span class="dot">·</span>
                  <span class="view-count">{{ formatCount(article.viewCount) }} 阅读</span>
                  <span class="dot">·</span>
                  <span class="like-count">{{ formatCount(article.likeCount) }} 点赞</span>
                </div>
              </div>
              <div class="article-image" v-if="article.coverImage">
                <img :src="article.coverImage" alt="文章封面" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部导航 -->
      <footer-navigation :active-tab="'home'" />
    </div>
  </page-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import ProductItem from '@/components/product/ProductItem.vue'
import LostFoundItem from '@/components/lostFound/LostFoundItem.vue'
import FooterNavigation from '@/components/common/FooterNavigation.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import api from '@/api'
import '@/style/Home.css'

const router = useRouter()
const searchKeyword = ref('')
const banners = ref([
  {
    id: 1,
    title: '校园二手交易',
    imageUrl: 'https://picsum.photos/id/1018/800/400',
    link: '/product/list'
  },
  {
    id: 2,
    title: '失物招领平台',
    imageUrl: 'https://picsum.photos/id/1015/800/400',
    link: '/lost-found/list'
  },
  {
    id: 3,
    title: '校园社区交流',
    imageUrl: 'https://picsum.photos/id/1019/800/400',
    link: '/article/list'
  }
])
const currentBannerIndex = ref(0)
const featureEntries = ref([
  {
    id: 1,
    name: '二手交易',
    icon: 'shop',
    color: '#FF9500',
    route: '/product/list'
  },
  {
    id: 2,
    name: '失物招领',
    icon: 'search',
    color: '#34C759',
    route: '/lost-found/list'
  },
  {
    id: 3,
    name: '校园论坛',
    icon: 'message',
    color: '#007AFF',
    route: '/article/list'
  },
  {
    id: 4,
    name: '求助信息',
    icon: 'help',
    color: '#5856D6',
    route: '/article/list?type=help'
  },
  {
    id: 5,
    name: '校园活动',
    icon: 'calendar',
    color: '#FF2D55',
    route: '/article/list?type=activity'
  }
])
const hotProducts = ref([])
const latestLostFound = ref([])
const hotArticles = ref([])

const handleSearch = () => {
  if (!searchKeyword.value.trim()) return
  router.push({ path: '/search', query: { keyword: searchKeyword.value } })
}

const handleBannerClick = (banner) => router.push(banner.link)
const handleFeatureClick = (entry) => router.push(entry.route)
const formatCount = (count) => count < 1000 ? count : (count / 1000).toFixed(1) + 'k'

let bannerTimer = null
const startBannerAutoPlay = () => {
  bannerTimer = setInterval(() => {
    currentBannerIndex.value = (currentBannerIndex.value + 1) % banners.value.length
  }, 3000)
}

const fetchHomeData = async () => {
  try {
    hotProducts.value = (await api.product.getProductList({ sort: 'hot', limit: 4 })).data.list
    latestLostFound.value = (await api.lostFound.getLostFoundList({ sort: 'latest', limit: 3 })).data.list
    hotArticles.value = (await api.article.getArticleList({ sort: 'hot', limit: 3 })).data.list
  } catch (error) {
    console.error('获取首页数据失败:', error)
  }
}

onMounted(() => { 
  startBannerAutoPlay()
  fetchHomeData() 
})

onBeforeUnmount(() => { 
  if (bannerTimer) clearInterval(bannerTimer) 
})
</script>