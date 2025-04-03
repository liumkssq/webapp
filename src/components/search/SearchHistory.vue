<template>
  <div class="search-history-container" v-if="history.length > 0">
    <div class="history-header">
      <div class="history-title">搜索历史</div>
      <div class="clear-history" @click="clearHistory">清空</div>
    </div>
    
    <div class="history-list">
      <div 
        v-for="(item, index) in history" 
        :key="index" 
        class="history-item"
        @click="onHistoryClick(item)"
      >
        <div class="history-icon">
          <i class="icon-history"></i>
        </div>
        <div class="history-info">
          <div class="history-keyword">{{ item.keyword }}</div>
          <div class="history-type" v-if="item.type !== 'all'">
            {{ getTypeLabel(item.type) }}
            <span v-if="item.type === 'lostfound' && item.subtype !== 'all'" class="history-subtype">
              · {{ getSubtypeLabel(item.subtype) }}
            </span>
          </div>
        </div>
        <div class="delete-item" @click.stop="removeItem(index)">
          <i class="icon-delete"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search', 'clear', 'remove'])

const onHistoryClick = (item) => {
  emit('search', item)
}

const clearHistory = () => {
  emit('clear')
}

const removeItem = (index) => {
  emit('remove', index)
}

const getTypeLabel = (type) => {
  const types = {
    'all': '全部',
    'product': '商品',
    'article': '文章',
    'lostfound': '失物招领',
    'user': '用户'
  }
  return types[type] || '全部'
}

const getSubtypeLabel = (subtype) => {
  const subtypes = {
    'all': '全部',
    'lost': '寻物启事',
    'found': '招领启事'
  }
  return subtypes[subtype] || '全部'
}
</script>

<style scoped>
.search-history-container {
  margin-bottom: 24px;
  padding: 0 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.clear-history {
  color: #999;
  font-size: 14px;
  padding: 4px 8px;
}

.clear-history:active {
  opacity: 0.7;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
}

.history-icon {
  margin-right: 12px;
  color: #999;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-history::before {
  content: "⏱";
  font-size: 16px;
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.history-keyword {
  font-size: 15px;
  color: #333;
  margin-bottom: 2px;
}

.history-type {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.history-subtype {
  margin-left: 4px;
}

.delete-item {
  color: #ccc;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-delete::before {
  content: "✕";
  font-size: 14px;
}

/* 暗黑模式适配 */
@media (prefers-color-scheme: dark) {
  .history-title {
    color: #f0f0f0;
  }
  
  .history-item {
    border-bottom-color: #333;
  }
  
  .history-keyword {
    color: #f0f0f0;
  }
}
</style>