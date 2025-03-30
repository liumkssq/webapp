<template>
  <div class="search-page">
    <!-- 使用HeaderNav组件 -->
    <header-nav title="搜索" />
    
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-bar">
        <i class="icon-search"></i>
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="搜索商品、文章、失物招领..." 
          class="search-input"
          @keyup.enter="handleSearch"
          autofocus
        >
        <i class="icon-clear" v-if="searchKeyword" @click="clearSearch"></i>
      </div>
      
      <button class="search-btn" @click="handleSearch">搜索</button>
    </div>
    
    <!-- 热门搜索 -->
    <div class="hot-search-section" v-if="!searchKeyword">
      <div class="section-title">热门搜索</div>
      <div class="hot-tags">
        <div 
          v-for="tag in hotTags" 
          :key="tag" 
          class="hot-tag"
          @click="searchByTag(tag)"
        >
          {{ tag }}
        </div>
      </div>
    </div>
    
    <!-- 搜索历史 -->
    <div class="search-history-section" v-if="searchHistory.length > 0 && !searchKeyword">
      <div class="section-header">
        <div class="section-title">搜索历史</div>
        <div class="clear-history" @click="clearHistory">清空</div>
      </div>
      
      <div class="history-list">
        <div 
          v-for="(item, index) in searchHistory" 
          :key="index" 
          class="history-item"
          @click="searchByHistory(item)"
        >
          <div class="history-icon">
            <i class="icon-history"></i>
          </div>
          <div class="history-keyword">{{ item }}</div>
          <div class="delete-history" @click.stop="removeHistory(index)">
            <i class="icon-delete"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <footer-nav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'

const router = useRouter()

// 搜索关键词
const searchKeyword = ref('')

// 热门搜索标签
const hotTags = ref(['iPhone', '笔记本电脑', '自行车', '教材', '学生证', '耳机', '平板电脑', '书包', '衣服', '水杯'])

// 搜索历史
const searchHistory = ref([])

// 加载搜索历史
onMounted(() => {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
})

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return
  
  // 保存到搜索历史
  saveToHistory(searchKeyword.value)
  
  // 跳转到搜索结果页
  router.push({
    path: '/search/results',
    query: { keyword: searchKeyword.value }
  })
}

// 保存到搜索历史
const saveToHistory = (keyword) => {
  // 避免重复添加
  const index = searchHistory.value.findIndex(item => item === keyword)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
  
  // 添加到历史的最前面
  searchHistory.value.unshift(keyword)
  
  // 限制历史记录长度
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }
  
  // 保存到本地存储
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 通过标签搜索
const searchByTag = (tag) => {
  searchKeyword.value = tag
  handleSearch()
}

// 通过历史记录搜索
const searchByHistory = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

// 清空搜索关键词
const clearSearch = () => {
  searchKeyword.value = ''
}

// 删除某条历史记录
const removeHistory = (index) => {
  searchHistory.value.splice(index, 1)
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 清空所有历史记录
const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}
</script>