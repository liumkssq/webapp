<template>
  <div class="payment-status-page">
    <!-- 头部 -->
    <HeaderNav title="支付状态查询" :showBack="true" />
    
    <!-- 支付状态卡片 -->
    <div class="status-card">
      <div class="status-icon" :class="statusClass">
        <i class="van-icon" :class="statusIcon"></i>
      </div>
      
      <h2 class="status-title">{{ statusTitle }}</h2>
      <p class="status-desc">{{ statusDescription }}</p>
      
      <div class="order-info">
        <div class="info-item">
          <span class="label">订单编号</span>
          <span class="value">{{ orderSn }}</span>
        </div>
        <div class="info-item">
          <span class="label">支付流水号</span>
          <span class="value">{{ paySn }}</span>
        </div>
      </div>
      
      <div class="payment-actions">
        <button v-if="!isSuccess && !isFailed" class="action-btn refresh" @click="checkStatus">
          手动查询
        </button>
        <button v-if="isSuccess" class="action-btn primary" @click="goToOrderDetail">
          查看订单
        </button>
        <button v-if="isFailed" class="action-btn primary" @click="retry">
          重新支付
        </button>
        <button class="action-btn secondary" @click="goBack">
          返回商品
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '@/api'
import HeaderNav from '@/components/HeaderNav.vue'
import { closeToast, showFailToast, showLoadingToast } from 'vant'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// 从props中获取支付信息
const props = defineProps({
  paySn: {
    type: String,
    required: true
  },
  orderSn: {
    type: String,
    required: true
  }
})

const router = useRouter()
const loading = ref(false)
const paymentStatus = ref(0) // 0: 未支付, 1: 已支付, 2: 支付失败

// 状态轮询间隔（毫秒）
const POLL_INTERVAL = 2000 // 改为2秒，更快检测支付状态
let statusCheckTimer = null
// 添加最大查询次数限制和计数器
let queryCount = 0
const MAX_QUERY_COUNT = 5 // 最多轮询5次

// 计算属性
const statusClass = computed(() => {
  if (paymentStatus.value === 1) return 'success'
  if (paymentStatus.value === 2) return 'failed'
  return 'pending'
})

const statusIcon = computed(() => {
  if (paymentStatus.value === 1) return 'van-icon-success'
  if (paymentStatus.value === 2) return 'van-icon-cross'
  return 'van-icon-clock-o'
})

const statusTitle = computed(() => {
  if (paymentStatus.value === 1) return '支付成功'
  if (paymentStatus.value === 2) return '支付失败'
  return '等待支付'
})

const statusDescription = computed(() => {
  if (paymentStatus.value === 1) return '您的订单已支付成功，请等待卖家确认'
  if (paymentStatus.value === 2) return '支付过程中遇到问题，请稍后重试'
  return '请在新打开的页面中完成支付，支付完成后将自动刷新状态'
})

const isSuccess = computed(() => paymentStatus.value === 1)
const isFailed = computed(() => paymentStatus.value === 2)

// 检查支付状态
const checkStatus = async () => {
  if (loading.value) return
  
  // 如果是用户点击手动查询，重置计数器（当非轮询调用时）
  const isManualCheck = !statusCheckTimer;
  if (isManualCheck) {
    console.log('用户手动查询支付状态，重置计数器');
    queryCount = 0;
  }
  
  // 达到最大查询次数后停止轮询
  if (queryCount >= MAX_QUERY_COUNT) {
    console.log(`已达到最大查询次数(${MAX_QUERY_COUNT}次)，停止轮询`);
    stopPolling();
    return;
  }
  
  // 增加查询计数
  queryCount++;
  console.log(`正在进行第${queryCount}次支付状态查询`);
  
  // 获取paySn，尝试多种来源
  let paySn = props.paySn;
  
  // 如果props中没有paySn，尝试从URL直接解析
  if (!paySn && window.location.href.includes('paySn=')) {
    const url = window.location.href;
    const paySNMatch = url.match(/[?&]paySn=([^&]+)/);
    if (paySNMatch && paySNMatch[1]) {
      paySn = decodeURIComponent(paySNMatch[1]);
      console.log('从URL直接解析到的paySn:', paySn);
    }
  }
  
  // 检查paySn是否存在
  if (!paySn) {
    console.error('缺少支付流水号(paySn)参数')
    showFailToast('无法查询支付状态：缺少支付流水号')
    stopPolling() // 停止轮询
    return
  }
  
  loading.value = true
  try {
    showLoadingToast({
      message: '查询支付状态...',
      forbidClick: true,
      duration: 0
    })
    
    console.log('开始查询支付状态，paySn:', paySn)
    
    // 确保请求正确发送，打印详细日志
    console.log('准备发送支付状态查询请求，URL:', '/payment/v1/payment/status', '参数:', { paySn })
    
    // 尝试直接使用fetch API进行POST请求，绕过可能的axios配置问题
    try {
      const directRes = await fetch('/payment/api/payment/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        },
        body: JSON.stringify({ paySn }),
      });
      
      if (directRes.ok) {
        const directData = await directRes.json();
        console.log('直接fetch请求成功:', directData);
        
        // 兼容两种可能的响应格式
        const paymentInfo = directData.data?.payment || directData.payment;
        
        if (paymentInfo) {
          console.log('获取到支付信息:', paymentInfo);
          
          // 更新支付状态
          paymentStatus.value = paymentInfo.tradeState;
          
          // 如果支付成功，重定向到支付成功页面
          if (paymentInfo.tradeState === 1) {
            console.log('支付已成功，准备重定向到结果页');
            stopPolling();
            
            // 延迟500ms显示成功状态后再跳转
            setTimeout(() => {
              // 重定向到支付结果页
              router.replace({
                path: '/payment/result',
                query: {
                  paySn: paySn,
                  orderSn: props.orderSn,
                  status: 1
                }
              });
            }, 500);
            
            loading.value = false;
            closeToast();
            return;
          }
          
          // 如果支付失败，停止轮询
          if (paymentInfo.tradeState === 2) {
            console.log('支付已失败，停止轮询');
            stopPolling();
          }
          
          // 即使是未支付状态，也停止自动轮询，用户可以点击刷新按钮手动查询
          if (paymentInfo.tradeState === 0) {
            console.log('支付状态为未支付，停止自动轮询，等待用户手动刷新');
            stopPolling();
          }
          
          loading.value = false;
          closeToast();
          return; // 使用直接fetch成功，返回
        }
      } else {
        console.warn('直接fetch请求失败:', directRes.status, await directRes.text());
      }
    } catch (fetchError) {
      console.error('直接fetch请求异常:', fetchError);
    }
    
    // 如果直接fetch失败，回退到原来的方法
    console.log('回退到axios请求');
    const res = await api.payment.getPaymentStatus(paySn)
    console.log('支付状态查询响应:', res)
    
    // 兼容两种可能的响应格式
    const paymentInfo = res.data?.payment || res.payment;
    
    if (paymentInfo) {
      console.log('获取到支付信息:', paymentInfo)
      
      // 更新支付状态
      paymentStatus.value = paymentInfo.tradeState
      
      // 如果支付成功，重定向到支付成功页面
      if (paymentInfo.tradeState === 1) {
        console.log('支付已成功，准备重定向到结果页');
        stopPolling();
        
        // 延迟500ms显示成功状态后再跳转
        setTimeout(() => {
          // 重定向到支付结果页
          router.replace({
            path: '/payment/result',
            query: {
              paySn: paySn,
              orderSn: props.orderSn,
              status: 1
            }
          });
        }, 500);
        
        loading.value = false;
        closeToast();
        return;
      }
      
      // 如果支付失败，停止轮询
      if (paymentInfo.tradeState === 2) {
        console.log('支付已失败，停止轮询');
        stopPolling();
      }
      
      // 即使是未支付状态，也停止自动轮询，用户可以点击刷新按钮手动查询
      if (paymentInfo.tradeState === 0) {
        console.log('支付状态为未支付，停止自动轮询，等待用户手动刷新');
        stopPolling();
      }
    } else {
      console.error('查询响应格式不正确:', res)
      showFailToast('查询支付状态失败')
    }
  } catch (error) {
    console.error('查询支付状态失败:', error)
    if (error.response) {
      console.error('错误响应详情:', error.response.status, error.response.data)
    }
    showFailToast('查询支付状态失败')
  } finally {
    loading.value = false
    closeToast()
  }
}

// 开始轮询
const startPolling = () => {
  // 清除可能存在的定时器
  stopPolling()
  
  // 先查询一次状态
  checkStatus()
  
  // 设置轮询
  statusCheckTimer = setInterval(() => {
    checkStatus()
  }, POLL_INTERVAL)
}

// 停止轮询
const stopPolling = () => {
  if (statusCheckTimer) {
    clearInterval(statusCheckTimer)
    statusCheckTimer = null
  }
}

// 重试支付
const retry = () => {
  // 这里可以重新发起支付请求，或跳转到订单详情页面
  router.push(`/user/order/${props.orderSn}`)
}

// 返回商品页
const goBack = () => {
  router.back()
}

// 查看订单详情
const goToOrderDetail = () => {
  router.push(`/user/order/${props.orderSn}`)
}

onMounted(() => {
  // 处理URL参数中可能存在的双问号问题
  if (window.location.href.includes('??')) {
    console.log('检测到URL格式问题，准备修复...');
    // 获取原始URL
    const rawUrl = window.location.href;
    // 找到实际的参数部分
    const paramsStartIndex = rawUrl.indexOf('??') + 2;
    if (paramsStartIndex > 2) {
      const paramsString = rawUrl.substring(paramsStartIndex);
      // 解析参数
      const searchParams = new URLSearchParams(paramsString);
      // 解析出正确的参数值
      const cleanedQuery = {};
      for (const [key, value] of searchParams.entries()) {
        cleanedQuery[key] = value;
      }
      
      // 立即使用window.location重定向，避免Vue Router可能的问题
      if (searchParams.has('paySn')) {
        console.log('修复URL双问号问题，使用window.location直接重定向');
        const queryString = new URLSearchParams(cleanedQuery).toString();
        window.location.href = `/payment/status?${queryString}`;
        return; // 不执行后续代码，等待页面重新加载
      }
    }
  }
  
  console.log('页面加载完成，进行初次支付状态检查，URL参数:', router.currentRoute.value.query);
  
  // 立即进行一次支付状态检查
  checkStatus();
  
  // 然后设置定时轮询（仅进行有限次数查询）
  statusCheckTimer = setInterval(() => {
    checkStatus();
  }, POLL_INTERVAL);
})

onBeforeUnmount(() => {
  // 停止轮询
  stopPolling()
})
</script>

<style scoped>
.payment-status-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 30px;
}

.status-card {
  background: white;
  border-radius: 12px;
  margin: 20px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.status-icon {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.status-icon.success {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.status-icon.failed {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.status-icon.pending {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.status-desc {
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

.payment-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  padding: 12px 0;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background-color: #1989fa;
  color: white;
}

.action-btn.primary:hover {
  background-color: #0076e4;
}

.action-btn.secondary {
  background-color: #f2f3f5;
  color: #323233;
}

.action-btn.secondary:hover {
  background-color: #e8e8e8;
}

.action-btn.refresh {
  background-color: #07c160;
  color: white;
}

.action-btn.refresh:hover {
  background-color: #06ad56;
}
</style>