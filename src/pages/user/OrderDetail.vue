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
        <div class="bg-primary text-white p-4">
          <div class="text-lg font-bold">{{ getStatusText(order.status) }}</div>
          <div class="text-sm mt-1 opacity-80">{{ order.createTime }}</div>
        </div>
        
        <!-- 订单信息 -->
        <div class="p-4 border-b border-gray-100">
          <div class="font-medium text-lg mb-2">订单信息</div>
          <div class="grid grid-cols-1 gap-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">订单编号</span>
              <span>{{ order.orderNo }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">下单时间</span>
              <span>{{ order.createTime }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">支付方式</span>
              <span>{{ getPaymentMethodText(order.paymentMethod) }}</span>
            </div>
            <div v-if="order.payTime" class="flex justify-between">
              <span class="text-gray-500">支付时间</span>
              <span>{{ order.payTime }}</span>
            </div>
          </div>
        </div>
        
        <!-- 商品信息 -->
        <div class="p-4 border-b border-gray-100">
          <div class="font-medium text-lg mb-2">商品信息</div>
          <div v-for="(item, index) in order.items" :key="index" class="flex items-center py-2">
            <img :src="item.image || '/placeholder.png'" class="w-16 h-16 object-cover rounded" alt="商品图片">
            <div class="ml-3 flex-1">
              <div class="font-medium">{{ item.name }}</div>
              <div class="text-sm text-gray-500">{{ item.description }}</div>
              <div class="mt-1 flex justify-between">
                <span class="text-primary">¥{{ item.price }}</span>
                <span class="text-gray-500">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 收货信息 -->
        <div class="p-4 border-b border-gray-100">
          <div class="font-medium text-lg mb-2">收货信息</div>
          <div class="grid grid-cols-1 gap-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">收货人</span>
              <span>{{ order.address?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">联系电话</span>
              <span>{{ order.address?.phone }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">收货地址</span>
              <span>{{ getFullAddress(order.address) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 价格信息 -->
        <div class="p-4">
          <div class="font-medium text-lg mb-2">价格信息</div>
          <div class="grid grid-cols-1 gap-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">商品总价</span>
              <span>¥{{ order.totalAmount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">运费</span>
              <span>¥{{ order.freight || 0 }}</span>
            </div>
            <div class="flex justify-between font-medium text-base">
              <span>实付款</span>
              <span class="text-primary">¥{{ order.actualAmount }}</span>
            </div>
          </div>
        </div>
        
        <!-- 底部按钮 -->
        <div class="p-4 flex justify-end space-x-3">
          <van-button v-if="order.status === 1" plain type="danger" @click="cancelOrder">取消订单</van-button>
          <van-button v-if="order.status === 1" type="primary" @click="payOrder">去支付</van-button>
          <van-button v-if="order.status === 2" plain type="primary" @click="remindShipment">提醒发货</van-button>
          <van-button v-if="order.status === 3" type="primary" @click="confirmReceipt">确认收货</van-button>
          <van-button v-if="order.status === 4" plain type="primary" @click="toComment">去评价</van-button>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
import { getOrderDetail, cancelOrder as apiCancelOrder, confirmOrderReceipt } from '@/api/order'

const route = useRoute()
const router = useRouter()
const id = ref(route.params.id)

const loading = ref(true)
const error = ref('')
const order = ref(null)

onMounted(() => {
  fetchOrderDetail()
})

const fetchOrderDetail = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 调用API获取订单详情
    const res = await getOrderDetail(id.value)
    order.value = res.data
  } catch (err) {
    console.error('获取订单详情失败:', err)
    error.value = '获取订单详情失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

const getStatusText = (status) => {
  const statusMap = {
    1: '待付款',
    2: '待发货',
    3: '待收货',
    4: '已完成',
    5: '已取消',
    6: '退款中',
    7: '已退款'
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
  if (!address) return '暂无地址信息'
  return `${address.province} ${address.city} ${address.district} ${address.detail}`
}

const cancelOrder = async () => {
  showDialog({
    title: '取消订单',
    message: '确定要取消该订单吗？',
    showCancelButton: true
  }).then(({ confirm }) => {
    if (confirm) {
      try {
        apiCancelOrder(id.value).then(res => {
          if (res.code === 200) {
            showToast('订单已取消')
            fetchOrderDetail()
          } else {
            showToast('取消订单失败：' + (res.message || '未知错误'))
          }
        })
      } catch (err) {
        showToast('取消订单失败，请稍后再试')
      }
    }
  })
}

const payOrder = () => {
  router.push(`/pay?orderId=${id.value}`)
}

const remindShipment = () => {
  showToast('已提醒卖家发货')
}

const confirmReceipt = () => {
  showDialog({
    title: '确认收货',
    message: '确认已收到商品吗？',
    showCancelButton: true
  }).then(({ confirm }) => {
    if (confirm) {
      // 调用确认收货API
      confirmOrderReceipt(id.value).then(res => {
        if (res.code === 200) {
          showToast('确认收货成功')
          fetchOrderDetail()
        } else {
          showToast('确认收货失败：' + (res.message || '未知错误'))
        }
      }).catch(err => {
        showToast('确认收货失败，请稍后再试')
      })
    }
  })
}

const toComment = () => {
  router.push(`/comment?orderId=${id.value}`)
}
</script>

<style scoped>
.order-detail {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  padding-top: 46px;
  padding-bottom: 60px;
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
</style>