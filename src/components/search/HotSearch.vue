<template>
  <div class="hot-search-container">
    <div class="section-title">热门搜索</div>
    <div class="hot-tags">
      <div 
        v-for="(tag, index) in tags" 
        :key="index" 
        class="hot-tag"
        :class="{ 'top-rank': index < 3 }"
        @click="onTagClick(tag)"
      >
        <span class="tag-rank" v-if="showRank">{{ index + 1 }}</span>
        <span class="tag-text">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  showRank: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['select'])

const onTagClick = (tag) => {
  emit('select', tag)
}
</script>

<style scoped>
.hot-search-container {
  margin-bottom: 24px;
  padding: 0 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hot-tag {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 8px 14px;
  border-radius: 16px;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
  position: relative;
}

.hot-tag:active {
  opacity: 0.7;
  transform: scale(0.98);
}

.hot-tag.top-rank {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
  font-weight: 500;
}

.tag-rank {
  font-size: 12px;
  font-weight: bold;
  margin-right: 8px;
  color: #ff3b30;
}

.top-rank .tag-rank {
  color: #ff3b30;
}

/* 暗黑模式适配 */
@media (prefers-color-scheme: dark) {
  .section-title {
    color: #f0f0f0;
  }
  
  .hot-tag {
    background-color: #333;
    color: #ccc;
  }
  
  .hot-tag.top-rank {
    background-color: rgba(10, 132, 255, 0.2);
    color: #0a84ff;
  }
}
</style>