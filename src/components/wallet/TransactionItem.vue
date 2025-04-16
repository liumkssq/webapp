<template>
  <div class="transaction-item" :class="itemClass">
    <div class="item-icon">
      <van-icon :name="itemIcon" size="24" />
    </div>
    <div class="item-details">
      <div class="item-description">{{ item.description }}</div>
      <div class="item-timestamp">{{ formattedTimestamp }}</div>
    </div>
    <div class="item-amount" :class="amountClass">{{ formattedAmount }}</div>
    <div v-if="item.status === 'pending'" class="item-status">处理中</div>
    <!-- Add more statuses if needed -->
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Icon as VanIcon } from 'vant';
import { format } from 'date-fns'; // Using date-fns for flexible date formatting

const props = defineProps({
  item: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      type: 'expense', // 'income' or 'expense'
      amount: 0,
      description: '交易描述',
      timestamp: new Date().toISOString(),
      status: 'completed' // e.g., 'completed', 'pending', 'failed'
    })
  }
});

const isIncome = computed(() => props.item.type === 'income');

const itemClass = computed(() => ({
  'transaction-item--income': isIncome.value,
  'transaction-item--expense': !isIncome.value,
  [`transaction-item--status-${props.item.status}`]: true
}));

const itemIcon = computed(() => {
  // Customize icons based on description or a more specific type if available
  if (props.item.description?.includes('充值')) return 'gold-coin-o';
  if (props.item.description?.includes('提现')) return 'peer-pay';
  if (props.item.description?.includes('奖励')) return 'gem-o';
  if (isIncome.value) return 'add-o'; // Default income
  return 'records'; // Default expense or other types
});

const amountClass = computed(() => ({
  'amount--income': isIncome.value,
  'amount--expense': !isIncome.value
}));

const formattedAmount = computed(() => {
  const amount = props.item.amount;
  const sign = isIncome.value ? '+' : ''; // Expense amount should already be negative
  return `${sign}${(amount).toFixed(2)}`;
});

const formattedTimestamp = computed(() => {
  try {
    return format(new Date(props.item.timestamp), 'yyyy-MM-dd HH:mm');
  } catch (e) {
    return '无效日期';
  }
});

</script>

<style scoped>
.transaction-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #fff;
  border-bottom: 1px solid #f7f8fa; /* Light separator */
}

.transaction-item:last-child {
  border-bottom: none;
}

.item-icon {
  margin-right: 12px;
  color: #323233;
  flex-shrink: 0;
}

.transaction-item--income .item-icon {
  color: #07c160; /* Green for income */
}

.transaction-item--expense .item-icon {
   color: #ff976a; /* Orange/Red for expense */
}

.item-details {
  flex-grow: 1;
  margin-right: 10px;
  overflow: hidden; /* Prevent long text overflow */
}

.item-description {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-timestamp {
  font-size: 12px;
  color: #969799;
}

.item-amount {
  font-size: 16px;
  font-weight: 500;
  text-align: right;
   flex-shrink: 0;
}

.amount--income {
  color: #07c160;
}

.amount--expense {
  color: #323233; /* Standard color for expense amount */
}

.item-status {
    font-size: 12px;
    color: #ff976a; /* Orange for pending */
    margin-left: 8px;
     flex-shrink: 0;
}

.transaction-item--status-failed .item-status {
    color: #ee0a24; /* Red for failed */
}
</style>
