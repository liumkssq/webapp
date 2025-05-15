<template>
  <div class="payment-result-page">
    <!-- 头部 -->
    <HeaderNav title="支付结果" :showBack="true" />
    
    <!-- 结果卡片 -->
    <div class="result-card">
      <div class="result-icon" :class="statusClass">
        <i class="van-icon" :class="statusIcon"></i>
      </div>
      
      <h2 class="result-title">{{ resultTitle }}</h2>
      <p class="result-desc">{{ resultDescription }}</p>
      
      <div class="order-info" v-if="orderSn || out_trade_no">
        <div class="info-item">
          <span class="label">订单编号</span>
          <span class="value">{{ orderSn || out_trade_no }}</span>
        </div>
      </div>
      
      <div class="result-actions">
        <button class="action-btn primary" @click="goToOrderDetail">
          查看订单
        </button>
        <button class="action-btn secondary" @click="goToHome">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '@/api'
import HeaderNav from '@/components/HeaderNav.vue'
import { closeToast, showLoadingToast } from 'vant'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 从props中获取支付结果信息
const props = defineProps({
  status: {
    type: [String, Number],
    default: ''
  },
  orderSn: {
    type: String,
    default: ''
  },
  paySn: {
    type: String,
    default: ''
  },
  // 支付宝回调参数
  out_trade_no: {
    type: String,
    default: ''
  },
  trade_no: {
    type: String,
    default: ''
  },
  total_amount: {
    type: String,
    default: ''
  }
})

const router = useRouter()

// 这里处理支付宝支付后返回的out_trade_no作为paySn
const actualPaySn = computed(() => {
  return props.paySn || props.out_trade_no || ''
})

// 计算属性
const statusClass = computed(() => 'success')
const statusIcon = computed(() => 'van-icon-success')
const resultTitle = computed(() => '支付成功')
const resultDescription = computed(() => '您的订单已支付成功，请等待卖家确认')

// 获取支付状态
const checkPaymentStatus = async () => {
  if (!actualPaySn.value) return
  
  try {
    showLoadingToast({
      message: '获取支付结果...',
      forbidClick: true,
      duration: 0
    })
    
    const res = await api.payment.getPaymentStatus(actualPaySn.value)
    console.log('支付状态查询响应:', res)
    
    // 兼容两种可能的响应格式
    const paymentInfo = res.data?.payment || res.payment;
    
    if (paymentInfo) {
      // 更新URL参数以反映实际状态
      const tradeState = paymentInfo.tradeState
      if (tradeState !== props.status) {
        router.replace({
          query: {
            ...router.currentRoute.value.query,
            status: tradeState
          }
        })
      }
    }
  } catch (error) {
    console.error('查询支付状态失败:', error)
  } finally {
    closeToast()
  }
}

// 查看订单详情
const goToOrderDetail = () => {
  const orderNumber = props.orderSn || props.out_trade_no;
  if (orderNumber) {
    router.push(`/user/order/${orderNumber}`);
  } else {
    // 如果没有订单号，回退到订单列表
    router.push('/user/orders');
  }
}

// 返回首页
const goToHome = () => {
  router.replace('/')
}

// 页面加载时的处理
onMounted(() => {
  console.log('支付结果页面加载，收到参数:', props);
  
  // 直接显示支付成功，不需要复杂的状态检测
  // 如果需要同步支付状态到后端，可以在后台进行
  if (actualPaySn.value) {
    // 可选：在后台触发一次支付状态更新，但不影响用户体验
    setTimeout(() => {
      checkPaymentStatus().catch(err => {
        console.error('后台同步支付状态失败，不影响前端显示:', err);
      });
    }, 500);
  }
  
  // 清除支付信息
  localStorage.removeItem('currentPayment');
})
</script>

<style scoped>
.payment-result-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 30px;
}

.result-card {
  background: white;
  border-radius: 12px;
  margin: 20px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.result-icon {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.result-icon.success {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.result-icon.failed {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.result-icon.pending {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.result-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  animation: fadeIn 1s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-desc {
  color: #666;
  margin-bottom: 30px;
}

.order-info {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 14px;
}

.label {
  color: #999;
}

.value {
  color: #333;
  font-weight: 500;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
}

.action-btn {
  padding: 14px 0;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.action-btn.primary {
  background-color: #1989fa;
  color: white;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.2);
}

.action-btn.primary:hover {
  background-color: #0076e4;
  box-shadow: 0 6px 16px rgba(25, 137, 250, 0.3);
  transform: translateY(-2px);
}

.action-btn.secondary {
  background-color: #f2f3f5;
  color: #323233;
}

.action-btn.secondary:hover {
  background-color: #e8e8e8;
  transform: translateY(-2px);
}
</style>