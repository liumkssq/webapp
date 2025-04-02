<template>
  <div class="search-page">
    <!-- 使用HeaderNav组件 -->
    <header-nav title="搜索" />
    
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-type-selector">
        <select v-model="searchType" class="search-type-dropdown">
          <option value="all">全部</option>
          <option value="product">商品</option>
          <option value="article">文章</option>
          <option value="lostfound">失物招领</option>
          <option value="user">用户</option>
        </select>
        
        <!-- 失物招领二级分类 -->
        <select v-if="searchType === 'lostfound'" v-model="lostFoundType" class="search-subtype-dropdown">
          <option value="all">全部</option>
          <option value="lost">寻物启事</option>
          <option value="found">招领启事</option>
        </select>
      </div>
      
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
          <div class="history-keyword">{{ item.keyword }}</div>
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

// 搜索类型
const searchType = ref('all')

// 失物招领二级类型
const lostFoundType = ref('all')

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
  
  // 构建查询参数
  const query = { 
    keyword: searchKeyword.value,
    type: searchType.value 
  }
  
  // 如果是失物招领类型且有选择子类型，添加子类型参数
  if (searchType.value === 'lostfound' && lostFoundType.value !== 'all') {
    query.subtype = lostFoundType.value
  }
  
  // 保存到搜索历史，包含搜索类型信息
  saveToHistory(searchKeyword.value, searchType.value, lostFoundType.value)
  
  // 跳转到搜索结果页
  router.push({
    path: '/search/results',
    query
  })
}

// 保存到搜索历史
const saveToHistory = (keyword, type = 'all', subtype = null) => {
  // 创建历史记录对象
  const historyItem = { 
    keyword,
    type,
    subtype: type === 'lostfound' ? subtype : null,
    timestamp: new Date().getTime()
  }
  
  // 避免重复添加，根据关键词和类型判断
  const index = searchHistory.value.findIndex(item => 
    item.keyword === keyword && 
    item.type === type && 
    (type !== 'lostfound' || item.subtype === subtype)
  )
  
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
  
  // 添加到历史的最前面
  searchHistory.value.unshift(historyItem)
  
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
const searchByHistory = (item) => {
  searchKeyword.value = item.keyword
  searchType.value = item.type || 'all'
  if (item.type === 'lostfound' && item.subtype) {
    lostFoundType.value = item.subtype
  }
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

<style scoped>
.search-page {
  padding: 20px 16px;
}

.search-container {
  display: flex;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-type-selector {
  margin-bottom: 10px;
  width: 100%;
  display: flex;
  gap: 8px;
}

.search-type-dropdown, .search-subtype-dropdown {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
  background-color: #ffffff;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 20px;
  padding: 0 12px;
  margin-right: 10px;
}

.icon-search {
  color: #999;
  margin-right: 8px;
}

.icon-search::before {
  content: "🔍";
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 0;
  outline: none;
  font-size: 16px;
}

.icon-clear {
  color: #ccc;
  cursor: pointer;
}

.icon-clear::before {
  content: "✕";
}

.search-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 16px;
  cursor: pointer;
}

.hot-search-section, .search-history-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.clear-history {
  color: #999;
  font-size: 14px;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  background-color: #f5f5f5;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.history-icon {
  margin-right: 12px;
  color: #999;
}

.icon-history::before {
  content: "⏱";
}

.history-keyword {
  flex: 1;
}

.delete-history {
  color: #ccc;
}

.icon-delete::before {
  content: "✕";
}
</style>