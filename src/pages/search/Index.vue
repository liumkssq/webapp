<template>
  <div class="search-page">
    <!-- 使用HeaderNav组件 -->
    <header-nav title="搜索" />
    
    <!-- 搜索框 -->
    <div class="search-header">
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
      
      <!-- 搜索类型选择 -->
      <div class="search-type-tabs">
        <div 
          v-for="type in searchTypes" 
          :key="type.value" 
          class="type-tab" 
          :class="{ active: searchType === type.value }"
          @click="searchType = type.value"
        >
          {{ type.label }}
        </div>
      </div>
      
      <!-- 失物招领二级分类 -->
      <div class="search-subtype-tabs" v-if="searchType === 'lostfound'">
        <div 
          v-for="type in lostFoundTypes" 
          :key="type.value" 
          class="subtype-tab" 
          :class="{ active: lostFoundType === type.value }"
          @click="lostFoundType = type.value"
        >
          {{ type.label }}
        </div>
      </div>
    </div>
    
    <div class="search-content">
      <!-- 热门搜索 -->
      <hot-search 
        v-if="!searchKeyword"
        :tags="hotTags"
        @select="searchByTag"
      />
      
      <!-- 搜索历史 -->
      <search-history 
        v-if="searchHistory.length > 0 && !searchKeyword"
        :history="searchHistory"
        @search="searchByHistory"
        @clear="clearHistory"
        @remove="removeHistory"
      />
      
      <!-- 搜索建议 -->
      <div class="search-suggestions" v-if="searchKeyword && suggestions.length > 0">
        <div 
          v-for="(suggestion, index) in suggestions" 
          :key="index" 
          class="suggestion-item"
          @click="searchBySuggestion(suggestion)"
        >
          <i class="icon-suggestion"></i>
          <div class="suggestion-text">
            <span v-html="highlightKeyword(suggestion, searchKeyword)"></span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <footer-nav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
import SearchHistory from '@/components/search/SearchHistory.vue'
import HotSearch from '@/components/search/HotSearch.vue'
import { getHotSearchKeywords, getSearchHistory, clearSearchHistory } from '@/api/search'

const router = useRouter()

// 搜索关键词
const searchKeyword = ref('')

// 搜索类型
const searchType = ref('all')

// 失物招领二级类型
const lostFoundType = ref('all')

// 搜索提示
const suggestions = ref([])

// 加载状态
const isLoading = ref(false)

// 搜索类型选项
const searchTypes = [
  { label: '全部', value: 'all' },
  { label: '商品', value: 'product' },
  { label: '文章', value: 'article' },
  { label: '失物招领', value: 'lostfound' },
  { label: '用户', value: 'user' }
]

// 失物招领类型选项
const lostFoundTypes = [
  { label: '全部', value: 'all' },
  { label: '寻物', value: 'lost' },
  { label: '招领', value: 'found' }
]

// 热门搜索标签
const hotTags = ref(['iPhone', '笔记本电脑', '自行车', '教材', '学生证', '耳机', '平板电脑', '书包', '衣服', '水杯'])

// 搜索历史
const searchHistory = ref([])

// 加载热门搜索关键词
const loadHotKeywords = async () => {
  try {
    isLoading.value = true
    const res = await getHotSearchKeywords()
    if (res.code === 0 && res.data) {
      hotTags.value = res.data.map(item => item.keyword)
    }
  } catch (error) {
    console.error('Failed to load hot keywords:', error)
  } finally {
    isLoading.value = false
  }
}

// 加载搜索历史
const loadSearchHistory = async () => {
  try {
    isLoading.value = true
    // 尝试从API获取
    const res = await getSearchHistory()
    if (res && res.code === 0 && res.data) {
      searchHistory.value = res.data
      return
    }
    
    // 如果API失败，尝试从本地获取
    const history = localStorage.getItem('searchHistory')
    if (history) {
      searchHistory.value = JSON.parse(history)
    }
  } catch (error) {
    console.error('Failed to load search history:', error)
    // 尝试从本地获取
    try {
      const history = localStorage.getItem('searchHistory')
      if (history) {
        searchHistory.value = JSON.parse(history)
      }
    } catch (e) {
      console.error('Failed to load local search history:', e)
    }
  } finally {
    isLoading.value = false
  }
}

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
  
  // 清空建议
  suggestions.value = []
  
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
  if (searchHistory.value.length > 20) {
    searchHistory.value = searchHistory.value.slice(0, 20)
  }
  
  // 保存到本地存储
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 生成搜索建议
const generateSuggestions = () => {
  if (!searchKeyword.value.trim()) {
    suggestions.value = []
    return
  }
  
  // 从历史记录和热门标签中生成建议
  const keyword = searchKeyword.value.toLowerCase().trim()
  const historyMatches = searchHistory.value
    .filter(item => item.keyword.toLowerCase().includes(keyword))
    .map(item => item.keyword)
  
  const tagMatches = hotTags.value
    .filter(tag => tag.toLowerCase().includes(keyword))
  
  // 合并去重
  const allSuggestions = [...new Set([...historyMatches, ...tagMatches])]
  suggestions.value = allSuggestions.slice(0, 10) // 限制显示10条建议
}

// 高亮关键词
const highlightKeyword = (text, keyword) => {
  if (!keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
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

// 根据建议搜索
const searchBySuggestion = (suggestion) => {
  searchKeyword.value = suggestion
  handleSearch()
}

// 清空搜索关键词
const clearSearch = () => {
  searchKeyword.value = ''
  suggestions.value = []
}

// 删除某条历史记录
const removeHistory = (index) => {
  searchHistory.value.splice(index, 1)
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 清空所有历史记录
const clearHistory = async () => {
  try {
    // 尝试从API清空
    const res = await clearSearchHistory()
    if (res && res.code === 0) {
      searchHistory.value = []
      return
    }
    
    // 如果API失败，从本地清空
    searchHistory.value = []
    localStorage.removeItem('searchHistory')
  } catch (error) {
    console.error('Failed to clear search history:', error)
    // 从本地清空
    searchHistory.value = []
    localStorage.removeItem('searchHistory')
  }
}

// 监听搜索关键词变化，更新搜索建议
watch(searchKeyword, () => {
  generateSuggestions()
})

onMounted(() => {
  loadSearchHistory()
  loadHotKeywords()
})
</script>

<style scoped>
.search-page {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.search-header {
  background-color: #ffffff;
  padding: 16px 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  z-index: 1;
}

.search-container {
  display: flex;
  margin-bottom: 16px;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: rgba(142, 142, 147, 0.12);
  border-radius: 10px;
  padding: 0 12px;
  margin-right: 10px;
  height: 36px;
  transition: all 0.2s ease;
}

.search-bar:focus-within {
  background-color: rgba(142, 142, 147, 0.18);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.icon-search {
  color: #8e8e93;
  margin-right: 8px;
  font-size: 14px;
}

.icon-search::before {
  content: "🔍";
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
  outline: none;
  font-size: 17px;
  color: #000;
}

.icon-clear {
  color: #8e8e93;
  cursor: pointer;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(142, 142, 147, 0.3);
  font-size: 12px;
}

.icon-clear::before {
  content: "✕";
}

.search-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  height: 36px;
  transition: background-color 0.2s ease;
}

.search-btn:active {
  background-color: #0062cc;
}

/* 搜索类型标签样式 */
.search-type-tabs {
  display: flex;
  overflow-x: auto;
  margin-bottom: 12px;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.search-type-tabs::-webkit-scrollbar {
  display: none; /* Chrome & Safari */
}

.type-tab {
  padding: 6px 12px;
  margin-right: 8px;
  white-space: nowrap;
  border-radius: 16px;
  font-size: 14px;
  background-color: rgba(142, 142, 147, 0.12);
  color: #8e8e93;
  transition: all 0.2s ease;
  user-select: none;
}

.type-tab.active {
  background-color: #007aff;
  color: white;
}

/* 失物招领子分类标签样式 */
.search-subtype-tabs {
  display: flex;
  margin-bottom: 12px;
  padding-bottom: 4px;
}

.subtype-tab {
  padding: 4px 10px;
  margin-right: 8px;
  border-radius: 14px;
  font-size: 13px;
  background-color: rgba(142, 142, 147, 0.08);
  color: #8e8e93;
  transition: all 0.2s ease;
  user-select: none;
}

.subtype-tab.active {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.search-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

/* 搜索建议样式 */
.search-suggestions {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 16px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.icon-suggestion {
  color: #8e8e93;
  margin-right: 12px;
  font-size: 16px;
}

.icon-suggestion::before {
  content: "🔍";
}

.suggestion-text {
  font-size: 16px;
  color: #000;
}

.highlight {
  color: #007aff;
  font-weight: 500;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .search-page {
    background-color: #1c1c1e;
  }
  
  .search-header {
    background-color: #2c2c2e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  .search-bar {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .search-bar:focus-within {
    background-color: rgba(255, 255, 255, 0.15);
  }
  
  .search-input {
    color: #ffffff;
  }
  
  .icon-clear {
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  .type-tab {
    background-color: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.7);
  }
  
  .subtype-tab {
    background-color: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
  }
  
  .subtype-tab.active {
    background-color: rgba(0, 122, 255, 0.3);
    color: #0a84ff;
  }
  
  .search-suggestions {
    background-color: #2c2c2e;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .suggestion-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .suggestion-item:active {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .suggestion-text {
    color: #ffffff;
  }
  
  .highlight {
    color: #0a84ff;
  }
}

/* 响应式适配 */
@media (min-width: 768px) {
  .search-container {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .search-type-tabs, .search-subtype-tabs {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .search-content {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>