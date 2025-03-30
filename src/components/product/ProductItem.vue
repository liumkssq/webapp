<script setup>
// Remove the unnecessary import of defineProps
// import { defineProps } from 'vue'

defineProps({
  product: {
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
  <div class="product-item">
    <div class="product-image">
      <img :src="product.imageUrl || 'https://via.placeholder.com/300'" :alt="product.title" />
    </div>
    <div class="product-info">
      <div class="product-title">{{ product.title }}</div>
      <div v-if="showDescription" class="product-description">{{ product.description }}</div>
      <div class="product-price">¥{{ product.price.toFixed(2) }}</div>
      <div class="product-meta">
        <div class="seller">{{ product.seller?.nickname }}</div>
        <div class="time">{{ product.createdAt }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-item {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.product-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.product-image {
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.product-item:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  padding: 12px;
}

.product-title {
  font-weight: 500;
  font-size: var(--font-size-headline);
  margin-bottom: 8px;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-description {
  font-size: var(--font-size-subhead);
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: var(--font-size-headline);
  font-weight: 600;
  color: var(--error-color);
  margin-bottom: 8px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-caption-1);
  color: var(--text-tertiary);
}

@media (max-width: 767px) {
  .product-image {
    height: 160px;
  }
}
</style>