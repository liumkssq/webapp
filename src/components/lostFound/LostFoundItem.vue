<script setup>
import { defineProps } from 'vue'

defineProps({
  item: {
    type: Object,
    required: true
  },
  showDescription: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <div class="lost-found-item" :class="item.type">
    <div class="item-image" v-if="item.imageUrl">
      <img :src="item.imageUrl" :alt="item.title" />
    </div>
    <div class="item-info">
      <div class="item-badge">{{ item.type === 'lost' ? '寻物启事' : '招领启事' }}</div>
      <div class="item-title">{{ item.title }}</div>
      <div v-if="showDescription" class="item-description">{{ item.description }}</div>
      <div class="item-detail">
        <div class="location">
          <svg-icon name="location" size="14" />
          {{ item.location }}
        </div>
        <div class="time">
          <svg-icon name="time" size="14" />
          {{ item.time }}
        </div>
      </div>
      <div class="item-meta">
        <div class="publisher">{{ item.publisher?.nickname }}</div>
        <div class="status" :class="item.status">{{ 
          item.status === 'open' ? '进行中' : 
          item.status === 'pending' ? '确认中' : '已完成' 
        }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lost-found-item {
  display: flex;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  border-left: 4px solid var(--info-color);
}

.lost-found-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.lost-found-item.lost {
  border-left-color: var(--warning-color);
}

.lost-found-item.found {
  border-left-color: var(--success-color);
}

.item-image {
  flex: 0 0 120px;
  height: 120px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  padding: 12px;
  position: relative;
}

.item-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 8px;
  font-size: var(--font-size-caption-2);
  color: white;
  border-radius: 10px;
  background-color: var(--info-color);
}

.lost .item-badge {
  background-color: var(--warning-color);
}

.found .item-badge {
  background-color: var(--success-color);
}

.item-title {
  font-weight: 500;
  font-size: var(--font-size-headline);
  margin-bottom: 8px;
  color: var(--text-primary);
  padding-right: 70px;
}

.item-description {
  font-size: var(--font-size-subhead);
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-detail {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: var(--font-size-footnote);
  color: var(--text-tertiary);
}

.location, .time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-caption-1);
}

.publisher {
  color: var(--text-tertiary);
}

.status {
  padding: 2px 8px;
  border-radius: 10px;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}

.status.open {
  background-color: var(--warning-color);
  color: white;
}

.status.pending {
  background-color: var(--info-color);
  color: white;
}

.status.closed {
  background-color: var(--success-color);
  color: white;
}

@media (max-width: 767px) {
  .item-image {
    flex: 0 0 100px;
    height: 100px;
  }
}
</style>