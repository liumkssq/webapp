<template>
  <div class="order-detail">
    <header-nav title="订单详情" back/>
    
    <div class="container mx-auto px-4 py-4">
      <div v-if="loading" class="flex justify-center items-center py-8">
        <van-loading type="spinner" />
      </div>
      
      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-500">{{ error }}</p>
        <van-button plain type="primary" @click="fetchOrderDetail" class="mt-4">重试</van-button>
      </div>
      
      <div v-else-if="order" class="bg-white rounded-lg overflow-hidden shadow">
        <!-- 订单状态 -->
        <div class="ios-status-header">
          <div class="ios-status-content">
            <div class="ios-status-title">{{ getStatusText(order.status) }}</div>
            <div class="ios-status-time">{{ order.createTime }}</div>
          </div>
        </div>
        
        <!-- 订单信息 -->
        <div class="ios-section">
          <div class="ios-section-title">订单信息</div>
          <div class="ios-info-list">
            <div class="ios-info-item">
              <span class="ios-info-label">订单编号</span>
              <span class="ios-info-value">{{ order.orderNo }}</span>
            </div>
            <div class="ios-info-item">
              <span class="ios-info-label">下单时间</span>
              <span class="ios-info-value">{{ order.createTime }}</span>
            </div>
            <div class="ios-info-item">
              <span class="ios-info-label">支付方式</span>
              <span class="ios-info-value">{{ getPaymentMethodText(order.paymentMethod) }}</span>
            </div>
            <div v-if="order.payTime" class="ios-info-item">
              <span class="ios-info-label">支付时间</span>
              <span class="ios-info-value">{{ order.payTime }}</span>
            </div>
          </div>
        </div>
        
        <!-- 商品信息 -->
        <div class="ios-section">
          <div class="ios-section-title">商品信息</div>
          <div class="ios-product-list">
            <div v-for="(item, index) in order.items" :key="index" class="ios-product-item">
              <img :src="item.image || '/placeholder.png'" class="ios-product-image" alt="商品图片">
              <div class="ios-product-info">
                <div class="ios-product-name">{{ item.name }}</div>
                <div class="ios-product-desc">{{ item.description }}</div>
                <div class="ios-product-price-row">
                  <span class="ios-product-price">¥{{ item.price }}</span>
                  <span class="ios-product-quantity">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 收货信息 -->
        <div class="ios-section">
          <div class="ios-section-title">收货信息</div>
          <div class="ios-info-list">
            <div class="ios-info-item">
              <span class="ios-info-label">收货人</span>
              <span class="ios-info-value">{{ order.address?.name }}</span>
            </div>
            <div class="ios-info-item">
              <span class="ios-info-label">联系电话</span>
              <span class="ios-info-value">{{ order.address?.phone }}</span>
            </div>
            <div class="ios-info-item">
              <span class="ios-info-label">收货地址</span>
              <span class="ios-info-value">{{ getFullAddress(order.address) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 价格信息 -->
        <div class="ios-section">
          <div class="ios-section-title">价格信息</div>
          <div class="ios-info-list">
            <div class="ios-info-item">
              <span class="ios-info-label">商品总价</span>
              <span class="ios-info-value">¥{{ order.totalAmount }}</span>
            </div>
            <div class="ios-info-item">
              <span class="ios-info-label">运费</span>
              <span class="ios-info-value">¥{{ order.freight || 0 }}</span>
            </div>
            <div class="ios-divider-thin"></div>
            <div class="ios-info-item ios-total-price">
              <span class="ios-info-label">实付款</span>
              <span class="ios-info-value ios-primary-value">¥{{ order.actualAmount }}</span>
            </div>
          </div>
        </div>
        
        <!-- 底部按钮 -->
        <div class="p-4 border-t border-gray-100">
          <!-- 状态提示条 -->
          <div class="status-bar mb-4 p-3 rounded-lg" :class="getStatusBarClass()">
            <div class="flex items-center">
              <i class="van-icon mr-2 text-lg" :class="getStatusIconClass()"></i>
              <div>
                <div class="font-bold">{{ getStatusTitle() }}</div>
                <div class="text-sm mt-1 opacity-80">{{ getStatusDescription() }}</div>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮组 - iOS风格改版 -->
          <div class="ios-action-buttons">
            <!-- 待支付状态 (status: 0) -->
            <template v-if="order.status === 0">
              <div class="ios-button-container">
                <button class="ios-button ios-button-secondary" @click="cancelOrder">取消订单</button>
                <button class="ios-button ios-button-primary" @click="payOrder">去支付</button>
              </div>
            </template>
            
            <!-- 待发货状态 (status: 1) -->
            <template v-else-if="order.status === 1">
              <div class="ios-button-container ios-single-button">
                <button class="ios-button ios-button-primary" @click="remindShipment">提醒发货</button>
              </div>
            </template>
            
            <!-- 待收货状态 (status: 2) -->
            <template v-else-if="order.status === 2">
              <div class="ios-button-container ios-single-button">
                <button class="ios-button ios-button-primary" @click="confirmReceipt">确认收货</button>
              </div>
            </template>
            
            <!-- 已完成状态 (status: 3) -->
            <template v-else-if="order.status === 3">
              <div class="ios-button-container ios-single-button">
                <button class="ios-button ios-button-primary" @click="toComment">去评价</button>
              </div>
            </template>
            
            <!-- 已取消状态 (status: 4) -->
            <template v-else-if="order.status === 4">
              <div class="ios-button-container">
                <button class="ios-button ios-button-secondary" @click="deleteOrder">删除订单</button>
                <button class="ios-button ios-button-primary" @click="rebuyOrder">再次购买</button>
              </div>
            </template>
            
            <!-- 支付超时状态 (status: 5) -->
            <template v-else-if="order.status === 5">
              <div class="ios-button-container">
                <button class="ios-button ios-button-secondary" @click="deleteOrder">删除订单</button>
                <button class="ios-button ios-button-primary" @click="rebuyOrder">再次购买</button>
              </div>
            </template>
          </div>
        </div>
      </div>
      
      <div v-else class="text-center py-8">
        <p class="text-gray-500">订单信息不存在</p>
      </div>
    </div>
    
    <footer-nav />
  </div>
</template>

<script setup>
import FooterNav from '@/components/FooterNav.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import { showDialog, showToast } from 'vant'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// 已注释API导入
// import { getOrderDetail, cancelOrder as apiCancelOrder, confirmOrderReceipt } from '@/api/order'

// 导入实际API
import api from '@/api'

const route = useRoute()
const router = useRouter()
const id = ref(route.params.id)
// 从查询参数中获取订单SN
const orderSn = ref(route.query.sn)

console.log('OrderDetail页面加载，路径参数id:', id.value, '查询参数sn:', orderSn.value)

const loading = ref(true)
const error = ref('')
const order = ref(null)

onMounted(() => {
  fetchOrderDetail()
})

// 移除模拟订单数据
// 创建模拟订单数据
// const mockOrders = {
//   "1": { ... },
//   "2": { ... }
// }

// 时间戳格式化函数
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '未知时间';
  
  // 如果时间戳是秒级的，转换为毫秒级
  const date = new Date(timestamp * 1000);
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

// 解析产品图片字符串
const parseProductImage = (imageStr) => {
  if (!imageStr) return '/placeholder.png';
  
  try {
    // 尝试解析JSON字符串
    const images = JSON.parse(imageStr);
    // 返回第一张图片
    return Array.isArray(images) && images.length > 0 ? images[0] : '/placeholder.png';
  } catch (error) {
    console.error('解析产品图片失败:', error);
    return imageStr; // 如果解析失败，直接返回原字符串
  }
};

const fetchOrderDetail = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 使用orderSn查询订单详情，优先使用查询参数中的sn，如果没有则使用路径参数id作为sn
    const sn = orderSn.value || id.value
    console.log('正在获取订单详情，使用SN:', sn)
    
    // 调用API获取订单详情
    const res = await api.order.getOrderDetail(sn)
    console.log('订单详情API响应:', res)
    
    // 处理不同的响应格式
    if (res) {
      let originalOrder = null;
      
      // 情况1: 标准响应格式 {code: 200, data: {order...}}
      if (res.code === 200 && res.data) {
        originalOrder = res.data;
        console.log('从标准响应格式获取订单数据:', originalOrder);
      } 
      // 情况2: 直接返回 {order: {id, sn...}}
      else if (res.order) {
        originalOrder = res.order;
        console.log('从order对象获取订单数据:', originalOrder);
      }
      // 情况3: 直接返回订单对象 {id, sn...}
      else if (res.id && res.sn) {
        originalOrder = res;
        console.log('直接使用返回对象作为订单数据:', originalOrder);
      }
      else {
        throw new Error(res.message || '获取订单详情失败，响应格式不正确');
      }
      
      // 格式化订单数据，适配页面显示需求
      if (originalOrder) {
        // 构建格式化后的订单对象
        order.value = {
          // 基本信息
          id: originalOrder.id,
          orderNo: originalOrder.sn, // 使用sn作为订单编号
          status: originalOrder.status || 0,
          
          // 时间信息
          createTime: formatTimestamp(originalOrder.createdAt),
          payTime: originalOrder.payTime ? formatTimestamp(originalOrder.payTime) : null,
          
          // 支付信息
          paymentMethod: 'ALIPAY', // 默认支付方式
          
          // 价格信息
          totalAmount: originalOrder.totalPrice.toFixed(2), // 直接使用元为单位的价格
          freight: '0.00', // 默认运费为0
          actualAmount: originalOrder.totalPrice.toFixed(2), // 实付款
          
          // 商品信息
          items: [
            {
              id: originalOrder.productId,
              name: originalOrder.productTitle,
              description: `数量：${originalOrder.quantity}`,
              price: originalOrder.productPrice.toFixed(2),
              quantity: originalOrder.quantity,
              image: parseProductImage(originalOrder.productImage)
            }
          ],
          
          // 卖家信息
          sellerId: originalOrder.sellerId,
          sellerName: originalOrder.sellerName,
          
          // 收货信息 - 使用校园自提信息
          address: {
            name: '校园自提',
            phone: '请联系卖家',
            province: '',
            city: '',
            district: '',
            detail: '请到校园内指定位置自取商品'
          }
        };
        
        console.log('格式化后的订单数据:', order.value);
        
        // 已移除获取用户信息作为收货人信息的代码
      }
    } else {
      throw new Error('获取订单详情失败，未收到响应');
    }
  } catch (err) {
    console.error('获取订单详情失败:', err)
    error.value = err.message || '获取订单详情失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

// 取消订单
const cancelOrder = async () => {
  showDialog({
    title: '取消订单',
    message: '确定要取消该订单吗？',
    showCancelButton: true
  }).then(async ({ confirm }) => {
    if (confirm) {
      try {
        // 获取订单编号 - 适配不同字段名
        const orderSn = order.value.orderNo || order.value.sn
        
        if (!orderSn) {
          throw new Error('找不到有效的订单编号')
        }
        
        showToast('处理中...')
        const res = await api.order.cancelOrder(orderSn)
        if (res.code === 200) {
          showToast('订单已取消')
          fetchOrderDetail()
        } else {
          showToast('取消订单失败：' + (res.message || '未知错误'))
        }
      } catch (err) {
        showToast('取消订单失败，请稍后再试')
        console.error(err)
      }
    }
  })
}

// 移除模拟函数
// const confirmOrderReceipt = async (orderId) => { ... }

// 确认收货
const confirmReceipt = () => {
  showDialog({
    title: '确认收货',
    message: '确认已收到商品吗？',
    showCancelButton: true
  }).then(async ({ confirm }) => {
    if (confirm) {
      try {
        // 获取订单编号 - 适配不同字段名
        const orderSn = order.value.orderNo || order.value.sn
        
        if (!orderSn) {
          throw new Error('找不到有效的订单编号')
        }
        
        showToast('处理中...')
        // 调用确认收货API
        const res = await api.order.confirmReceipt(orderSn)
        if (res.code === 200) {
          showToast('确认收货成功')
          fetchOrderDetail()
        } else {
          showToast('确认收货失败：' + (res.message || '未知错误'))
        }
      } catch (err) {
        showToast('确认收货失败，请稍后再试')
        console.error(err)
      }
    }
  })
}

const getStatusText = (status) => {
  const statusMap = {
    0: '待付款',
    1: '待发货',
    2: '待收货',
    3: '已完成',
    4: '已取消',
    5: '支付超时'
  }
  return statusMap[status] || status
}

const getPaymentMethodText = (method) => {
  const methodMap = {
    'WECHAT': '微信支付',
    'ALIPAY': '支付宝',
    'WALLET': '钱包支付',
    'CAMPUS_CARD': '校园卡支付',
    'CASH': '线下交易'
  }
  return methodMap[method] || method
}

const getFullAddress = (address) => {
  if (!address) return '暂无地址信息';
  if (address.detail === '请到校园内指定位置自取商品') {
    return '校园自提';
  }
  return `${address.province} ${address.city} ${address.district} ${address.detail}`.trim();
}

const payOrder = async () => {
  try {
    showToast('正在创建支付...')
    
    // 获取订单编号 - 适配不同字段名
    const orderSn = order.value.orderNo || order.value.sn
    
    if (!orderSn) {
      throw new Error('找不到有效的订单编号')
    }
    
    // 调用支付接口
    const paymentData = {
      orderSn: orderSn,
      returnUrl: `${window.location.origin}/pay/result` // 支付完成后的前端跳转地址
    }
    
    console.log('创建支付数据:', paymentData)
    
    // 使用全局api对象
    const paymentRes = await api.payment.createAlipayPayment(paymentData)
    console.log('支付创建响应:', paymentRes)
    
    // 检查直接返回的结果格式
    if (paymentRes && paymentRes.paySn && paymentRes.payForm) {
      // 将支付信息存储到localStorage
      localStorage.setItem('currentPayment', JSON.stringify({
        paySn: paymentRes.paySn,
        orderSn: orderSn,
        timestamp: Date.now()
      }))
      
      // 在新窗口中打开支付链接
      window.open(paymentRes.payForm, '_blank')
      
      // 跳转到支付状态查询页面
      router.push({
        path: '/payment/status',
        query: {
          paySn: paymentRes.paySn,
          orderSn: orderSn
        }
      }).catch(err => {
        console.error('路由跳转错误:', err);
        // 如果路由跳转失败，使用window.location方式跳转
        window.location.href = `/payment/status?paySn=${encodeURIComponent(paymentRes.paySn)}&orderSn=${encodeURIComponent(orderSn)}`;
      })
      return
    }
    
    // 检查标准响应格式
    if (!paymentRes || paymentRes.code !== 200 || !paymentRes.data) {
      throw new Error(paymentRes?.message || '支付创建失败，请稍后重试')
    }
    
    // 标准格式的响应(code: 200, data: {...})
    const { paySn, payForm } = paymentRes.data;
    
    // 将支付信息存储到localStorage
    localStorage.setItem('currentPayment', JSON.stringify({
      paySn: paySn,
      orderSn: orderSn,
      timestamp: Date.now()
    }))
    
    // 在新窗口中打开支付链接
    window.open(payForm, '_blank')
    
    // 跳转到支付状态查询页面
    router.push({
      path: '/payment/status',
      query: {
        paySn: paySn,
        orderSn: orderSn
      }
    }).catch(err => {
      console.error('路由跳转错误:', err);
      // 如果路由跳转失败，使用window.location方式跳转
      window.location.href = `/payment/status?paySn=${encodeURIComponent(paySn)}&orderSn=${encodeURIComponent(orderSn)}`;
    })
  } catch (error) {
    console.error('支付过程发生错误:', error)
    showToast(error.message || '支付失败，请稍后重试')
  }
}

const remindShipment = () => {
  showToast('已提醒卖家发货')
}

const toComment = () => {
  router.push(`/comment?orderId=${id.value}`)
}

// 获取状态条的样式类
const getStatusBarClass = () => {
  const statusClasses = {
    0: 'bg-blue-50 text-blue-700', // 待付款
    1: 'bg-purple-50 text-purple-700', // 待发货
    2: 'bg-orange-50 text-orange-700', // 待收货
    3: 'bg-green-50 text-green-700', // 已完成
    4: 'bg-gray-50 text-gray-700', // 已取消
    5: 'bg-red-50 text-red-700' // 支付超时
  };
  
  return statusClasses[order.value?.status] || 'bg-gray-50 text-gray-700';
};

// 获取状态图标的样式类
const getStatusIconClass = () => {
  const iconClasses = {
    0: 'van-icon-balance-pay', // 待付款
    1: 'van-icon-logistics', // 待发货
    2: 'van-icon-send-gift', // 待收货
    3: 'van-icon-checked', // 已完成
    4: 'van-icon-close', // 已取消
    5: 'van-icon-clock' // 支付超时
  };
  
  return iconClasses[order.value?.status] || 'van-icon-question';
};

// 获取状态标题
const getStatusTitle = () => {
  const titles = {
    0: '等待付款',
    1: '等待卖家发货',
    2: '卖家已发货',
    3: '交易已完成',
    4: '订单已取消',
    5: '支付已超时'
  };
  
  return titles[order.value?.status] || '未知状态';
};

// 获取状态描述
const getStatusDescription = () => {
  const descriptions = {
    0: '请在24小时内完成支付，否则订单将自动取消',
    1: '卖家将尽快发货，请耐心等待',
    2: '等待您收到商品并确认收货',
    3: '交易已完成，感谢您的购买',
    4: '订单已取消，您可以再次购买',
    5: '支付已超时，订单已自动取消'
  };
  
  return descriptions[order.value?.status] || '无相关信息';
};

// 删除订单
const deleteOrder = () => {
  showDialog({
    title: '删除订单',
    message: '确定要删除该订单吗？删除后将无法恢复',
    showCancelButton: true
  }).then(async ({ confirm }) => {
    if (confirm) {
      try {
        showToast('处理中...');
        // 获取订单编号
        const orderSn = order.value.orderNo || order.value.sn;
        
        if (!orderSn) {
          throw new Error('找不到有效的订单编号');
        }
        
        // 目前后端可能还没有实现删除接口，这里模拟删除成功
        showToast('删除成功');
        // 返回订单列表页
        router.push('/user/orders');
      } catch (err) {
        console.error('删除订单失败:', err);
        showToast('删除订单失败，请稍后再试');
      }
    }
  });
};

// 再次购买
const rebuyOrder = () => {
  try {
    // 获取商品ID
    const productId = order.value.items?.[0]?.id || order.value.productId;
    
    if (!productId) {
      showToast('无法找到商品信息');
      return;
    }
    
    // 跳转到商品详情页
    router.push(`/product/${productId}`);
  } catch (err) {
    console.error('再次购买失败:', err);
    showToast('操作失败，请稍后再试');
  }
};
</script>

<style scoped>
.order-detail {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  padding-top: 46px;
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)); /* 添加底部安全区域 */
}

.container {
  flex: 1;
}

.bg-primary {
  background-color: #007aff;
}

.text-primary {
  color: #007aff;
}

/* 新增样式 */
.status-bar {
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid currentColor;
}

.van-button {
  transition: all 0.2s;
}

.van-button:active {
  transform: scale(0.98);
}

/* iOS风格按钮样式 */
.ios-action-buttons {
  margin-top: 16px;
  padding-bottom: env(safe-area-inset-bottom, 0px); /* 底部安全区域 */
}

.ios-button-container {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.ios-single-button {
  justify-content: flex-end;
}

.ios-button {
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  max-width: 45%; /* 限制最大宽度 */
}

/* 单按钮时的样式 */
.ios-single-button .ios-button {
  max-width: 160px;
}

.ios-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  transition: background-color 0.2s;
}

.ios-button:active::after {
  background-color: rgba(0, 0, 0, 0.1);
}

.ios-button-primary {
  background-color: #007aff;
  color: white;
}

.ios-button-secondary {
  background-color: #f5f5f5;
  color: #007aff;
  border: 1px solid #007aff;
}

/* 状态样式 */
.bg-blue-50 { background-color: #e6f2ff; }
.bg-purple-50 { background-color: #f5e8ff; }
.bg-orange-50 { background-color: #fff5e6; }
.bg-green-50 { background-color: #e6fff0; }
.bg-red-50 { background-color: #ffeded; }
.bg-gray-50 { background-color: #f5f5f5; }

.text-blue-700 { color: #0066cc; }
.text-purple-700 { color: #6600cc; }
.text-orange-700 { color: #cc6600; }
.text-green-700 { color: #00995e; }
.text-red-700 { color: #cc0000; }
.text-gray-700 { color: #4d4d4d; }

/* 价格信息突出显示 */
.text-primary {
  font-weight: 600;
}

/* 商品卡片美化 */
.rounded {
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

/* 主容器阴影 */
.shadow {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s;
}

/* 适配不同屏幕尺寸 */
@media (min-width: 640px) {
  .ios-button {
    max-width: 180px;
  }
  
  .ios-single-button .ios-button {
    max-width: 180px;
  }
}

/* 处理底部安全区域 - 支持iPhone有刘海的机型 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .ios-action-buttons {
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
  }
}

/* iOS风格价格信息 */
.ios-price-section {
  font-size: 16px;
}

.ios-price {
  font-size: 16px;
  font-weight: 500;
}

.ios-price-primary {
  color: #007aff;
  font-size: 20px;
  font-weight: 600;
}

.ios-price-label {
  font-size: 16px;
  font-weight: 600;
}

.ios-divider {
  height: 1px;
  background-color: #e8e8ed;
  margin: 4px 0;
}

/* iOS风格订单状态头部 */
.ios-status-header {
  background: linear-gradient(150deg, #007aff, #0055b3);
  color: white;
  padding: 20px 16px;
  position: relative;
  overflow: hidden;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.ios-status-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.05), transparent);
}

.ios-status-content {
  position: relative;
  z-index: 2;
}

.ios-status-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.2px;
  margin-bottom: 6px;
}

.ios-status-time {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 400;
}

/* iOS风格区域通用样式 */
.ios-section {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(60, 60, 67, 0.1);
  background-color: white;
}

.ios-section:last-child {
  border-bottom: none;
}

.ios-section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #111;
  letter-spacing: -0.2px;
}

/* 信息列表样式 */
.ios-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ios-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ios-info-label {
  font-size: 15px;
  color: #8e8e93;
}

.ios-info-value {
  font-size: 15px;
  color: #111;
  font-weight: 400;
  text-align: right;
}

.ios-primary-value {
  color: #007aff;
  font-size: 18px;
  font-weight: 600;
}

.ios-total-price {
  padding-top: 4px;
}

/* 商品项样式 */
.ios-product-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ios-product-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
}

.ios-product-image {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ios-product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ios-product-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #111;
}

.ios-product-desc {
  font-size: 14px;
  color: #8e8e93;
  margin-bottom: 6px;
}

.ios-product-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.ios-product-price {
  color: #007aff;
  font-weight: 600;
}

.ios-product-quantity {
  color: #8e8e93;
  font-size: 14px;
}

/* 分隔线 */
.ios-divider-thin {
  height: 1px;
  background-color: rgba(60, 60, 67, 0.1);
  margin: 4px 0;
}

/* 主容器样式 */
.bg-white {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
</style>