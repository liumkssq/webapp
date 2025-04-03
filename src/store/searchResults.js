// searchResults.js - 使用 Pinia 管理搜索结果状态
import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义搜索结果存储
export const useSearchResultsStore = defineStore('searchResults', () => {
  // 状态
  const results = ref([])
  const keyword = ref('')
  const currentTab = ref('product')
  const hasMore = ref(false)
  const page = ref(1)
  
  // 设置搜索结果
  function setResults(newResults) {
    results.value = newResults
  }
  
  // 设置搜索关键词
  function setKeyword(newKeyword) {
    keyword.value = newKeyword
  }
  
  // 设置当前标签
  function setCurrentTab(newTab) {
    currentTab.value = newTab
  }
  
  // 设置是否有更多
  function setHasMore(value) {
    hasMore.value = value
  }
  
  // 设置当前页码
  function setPage(value) {
    page.value = value
  }
  
  // 添加更多结果（加载更多）
  function addResults(newResults) {
    results.value = [...results.value, ...newResults]
  }
  
  // 清除搜索结果
  function clearResults() {
    results.value = []
    hasMore.value = false
    page.value = 1
  }
  
  return {
    results,
    keyword,
    currentTab,
    hasMore,
    page,
    setResults,
    setKeyword,
    setCurrentTab,
    setHasMore,
    setPage,
    addResults,
    clearResults
  }
})