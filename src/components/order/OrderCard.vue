<template>
  <div class="order-card" @click="$emit('view-details')">
    <!-- 订单头部信息 -->
    <div class="order-header">
      <div class="order-info">
        <span class="order-number">订单号: {{ order.orderNo || order.id }}</span>
        <span class="order-time">{{ formatDate(order.createTime) }}</span>
      </div>
      <div class="order-status" :class="getStatusClass(order.status)">
        {{ getStatusText(order.status) }}
      </div>
    </div>
    
    <!-- 订单商品列表 -->
    <div class="order-items">
      <div v-for="(item, index) in order.items" :key="index" class="order-item">
        <img :src="item.image || '/placeholder.png'" alt="商品图片" class="item-image">
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-attrs" v-if="item.attributes">{{ item.attributes }}</div>
          <div class="item-price-qty">
            <span class="item-price">¥{{ item.price }}</span>
            <span class="item-qty">× {{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 订单汇总信息 -->
    <div class="order-summary">
      <div class="total-amount">
        共 {{ getTotalQuantity(order.items) }} 件商品，合计：
        <span class="price">¥{{ order.totalAmount }}</span>
      </div>
    </div>
    
    <!-- 订单操作按钮 -->
    <div class="order-actions">
      <template v-if="order.status === 1"> <!-- 待付款 -->
        <button class="action-btn secondary" @click.stop="$emit('cancel')">取消订单</button>
        <button class="action-btn primary" @click.stop="$emit('pay')">去支付</button>
      </template>
      
      <template v-else-if="order.status === 2"> <!-- 待发货 -->
        <button class="action-btn secondary" @click.stop="$emit('view-details')">查看详情</button>
      </template>
      
      <template v-else-if="order.status === 3"> <!-- 待收货 -->
        <button class="action-btn secondary" @click.stop="$emit('view-logistics')">查看物流</button>
        <button class="action-btn primary" @click.stop="$emit('confirm-receipt')">确认收货</button>
      </template>
      
      <template v-else-if="order.status === 4"> <!-- 已完成 -->
        <button class="action-btn secondary" @click.stop="$emit('view-details')">查看详情</button>
        <button class="action-btn primary" @click.stop="$emit('buy-again')">再次购买</button>
      </template>
      
      <template v-else-if="order.status === 5"> <!-- 已取消 -->
        <button class="action-btn secondary" @click.stop="$emit('view-details')">查看详情</button>
        <button class="action-btn primary" @click.stop="$emit('delete-order')">删除订单</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
});

defineEmits([
  'view-details',
  'cancel',
  'pay',
  'confirm-receipt',
  'view-logistics',
  'buy-again',
  'delete-order'
]);

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    1: '待付款',
    2: '待发货',
    3: '待收货',
    4: '已完成',
    5: '已取消'
  };
  return statusMap[status] || '未知状态';
};

// 获取状态对应的样式类
const getStatusClass = (status) => {
  const classMap = {
    1: 'status-pending',
    2: 'status-processing',
    3: 'status-shipping',
    4: 'status-completed',
    5: 'status-cancelled'
  };
  return classMap[status] || '';
};

// 计算总数量
const getTotalQuantity = (items) => {
  if (!items || !items.length) return 0;
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
};
</script>

<style scoped>
.order-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f2f2f2;
}

.order-info {
  display: flex;
  flex-direction: column;
}

.order-number {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
}

.order-time {
  font-size: 12px;
  color: #969799;
}

.order-status {
  font-size: 14px;
  font-weight: 500;
}

.status-pending {
  color: #ff9500;
}

.status-processing {
  color: #3478f6;
}

.status-shipping {
  color: #5ac8fa;
}

.status-completed {
  color: #4cd964;
}

.status-cancelled {
  color: #8e8e93;
}

.order-items {
  padding: 12px 16px;
}

.order-item {
  display: flex;
  margin-bottom: 12px;
}

.order-item:last-child {
  margin-bottom: 0;
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 12px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.item-attrs {
  font-size: 12px;
  color: #969799;
  margin-bottom: 4px;
}

.item-price-qty {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
}

.item-price {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
}

.item-qty {
  font-size: 14px;
  color: #969799;
}

.order-summary {
  padding: 12px 16px;
  border-top: 1px solid #f2f2f2;
  text-align: right;
}

.total-amount {
  font-size: 14px;
  color: #323233;
}

.price {
  font-size: 16px;
  font-weight: 500;
  color: #ff3b30;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #f2f2f2;
  gap: 12px;
}

.action-btn {
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.action-btn.primary {
  background-color: #007aff;
  color: white;
}

.action-btn.secondary {
  background-color: #f5f5f5;
  color: #323233;
  border: 1px solid #ebedf0;
}
</style>