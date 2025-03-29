<template>
  <div class="baidu-map-search">
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <i class="icon-search"></i>
      <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索地点、公交站、地铁站等"
          @input="handleInputChange"
          @keyup.enter="search"
      />
      <i v-if="searchKeyword" class="icon-close" @click="clearSearch"></i>
    </div>

    <!-- 搜索建议列表 -->
    <div v-if="showSuggestions && suggestions.length" class="search-suggestions">
      <div
          v-for="(item, index) in suggestions"
          :key="index"
          class="suggestion-item"
          @click="selectSuggestion(item)"
      >
        <div class="suggestion-icon">
          <i :class="getSuggestionIcon(item.type)"></i>
        </div>
        <div class="suggestion-content">
          <div class="suggestion-title">{{ item.title }}</div>
          <div class="suggestion-address">{{ item.address }}</div>
        </div>
      </div>
    </div>

    <!-- 搜索结果列表 -->
    <div v-if="!showSuggestions && searchResults.length" class="search-results">
      <div
          v-for="(item, index) in searchResults"
          :key="index"
          class="result-item"
          @click="selectLocation(item)"
      >
        <div class="result-icon">
          <i :class="getResultIcon(item.type)"></i>
        </div>
        <div class="result-content">
          <div class="result-title">{{ item.title }}</div>
          <div class="result-address">{{ item.address }}</div>
        </div>
      </div>
    </div>

    <!-- 搜索历史 -->
    <div v-if="!searchKeyword && searchHistory.length" class="search-history">
      <div class="history-header">
        <h3>搜索历史</h3>
        <div class="clear-history" @click="clearHistory">清除</div>
      </div>
      <div class="history-list">
        <div
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            @click="useHistoryItem(item)"
        >
          <i class="icon-history"></i>
          <span>{{ item.title }}</span>
        </div>
      </div>
    </div>

    <!-- 加载指示器 -->
    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 无结果提示 -->
    <div v-if="noResult" class="no-result">
      <i class="icon-no-result"></i>
      <p>未找到相关地点，请尝试其他关键词</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { debounce } from '../../utils/tools';
import api from '../../api';

const props = defineProps({
  defaultKeyword: String,
  city: String,
});

const emit = defineEmits(['search', 'select-location']);
const searchKeyword = ref(props.defaultKeyword || '');
const suggestions = ref([]);
const searchResults = ref([]);
const loading = ref(false);
const showSuggestions = ref(false);
const searchHistory = ref([]);
const noResult = ref(false);

const loadSearchHistory = () => {
  const savedHistory = localStorage.getItem('mapSearchHistory');
  searchHistory.value = savedHistory ? JSON.parse(savedHistory).slice(0, 10) : [];
};

const saveToHistory = (item) => {
  searchHistory.value = [item, ...searchHistory.value.filter(h => h.title !== item.title)].slice(0, 10);
  localStorage.setItem('mapSearchHistory', JSON.stringify(searchHistory.value));
};

const clearHistory = () => {
  searchHistory.value = [];
  localStorage.removeItem('mapSearchHistory');
};

const useHistoryItem = (item) => {
  searchKeyword.value = item.title;
  selectLocation(item);
};

const getSuggestionIcon = (type) => {
  const icons = {
    bus: 'icon-bus',
    subway: 'icon-subway',
    shopping: 'icon-shopping',
    restaurant: 'icon-restaurant',
    hotel: 'icon-hotel',
    school: 'icon-school',
    hospital: 'icon-hospital',
    park: 'icon-park',
  };
  return icons[type] || 'icon-location';
};

const getResultIcon = getSuggestionIcon;

const handleInputChange = debounce(() => {
  searchKeyword.value.trim() ? getSuggestions() : clearSearch();
}, 300);

const getSuggestions = async () => {
  if (!searchKeyword.value.trim()) return;
  loading.value = true;
  showSuggestions.value = true;
  try {
    const { data } = await api.map.getLocationSuggestions(searchKeyword.value, props.city || '全国');
    suggestions.value = data.suggestions.map(item => ({
      title: item.name,
      address: item.address,
      location: item.location,
      type: item.tag || 'location',
    }));
    noResult.value = suggestions.value.length === 0;
  } catch (error) {
    console.error('获取位置建议失败:', error);
    suggestions.value = [];
    noResult.value = true;
  } finally {
    loading.value = false;
  }
};

const search = async () => {
  if (!searchKeyword.value.trim()) return;
  loading.value = true;
  showSuggestions.value = false;
  try {
    const { data } = await api.map.geocode(searchKeyword.value, props.city || '');
    searchResults.value = data.results.map(item => ({
      title: item.name,
      address: item.address,
      location: item.location,
      type: item.tag || 'location',
    }));
    noResult.value = searchResults.value.length === 0;
    emit('search', { keyword: searchKeyword.value, results: searchResults.value });
  } catch (error) {
    console.error('搜索位置失败:', error);
    searchResults.value = [];
    noResult.value = true;
  } finally {
    loading.value = false;
  }
};

const selectSuggestion = (item) => {
  searchKeyword.value = item.title;
  search();
};

const selectLocation = (item) => {
  saveToHistory(item);
  emit('select-location', item);
};

const clearSearch = () => {
  searchKeyword.value = '';
  suggestions.value = [];
  searchResults.value = [];
  showSuggestions.value = false;
  noResult.value = false;
};

watch(() => props.defaultKeyword, (newVal) => {
  if (newVal) {
    searchKeyword.value = newVal;
    search();
  }
});

onMounted(loadSearchHistory);
</script>

<style scoped>
/* 样式将在后续阶段完善 */
</style>