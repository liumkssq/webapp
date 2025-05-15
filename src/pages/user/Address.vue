<template>
  <div class="address-page">
    <header-nav title="我的地址" back/>
    
    <div class="container mx-auto px-4 py-4">
      <div v-if="loading" class="flex justify-center items-center py-8">
        <van-loading type="spinner" />
      </div>
      
      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-500">{{ error }}</p>
        <van-button plain type="primary" @click="fetchAddresses" class="mt-4">重试</van-button>
      </div>
      
      <div v-else>
        <!-- 地址列表 -->
        <div v-if="addresses.length > 0" class="space-y-4">
          <div v-for="(address, index) in addresses" :key="address.id" 
               class="bg-white rounded-lg overflow-hidden shadow">
            <div class="p-4">
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-medium text-lg">{{ address.name }} {{ address.phone }}</div>
                  <div class="text-gray-600 mt-1">{{ getFullAddress(address) }}</div>
                  <div v-if="address.isDefault" class="mt-2">
                    <span class="bg-primary text-white text-xs px-2 py-1 rounded">默认地址</span>
                  </div>
                </div>
                <div class="ml-4 flex items-center">
                  <van-icon name="edit" class="text-primary mr-4" @click="editAddress(address)" />
                  <van-icon name="delete" class="text-gray-500" @click="deleteAddress(address.id)" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="text-center py-8">
          <van-empty description="暂无地址，请添加收货地址" />
        </div>
        
        <!-- 底部添加按钮 -->
        <div class="fixed bottom-20 inset-x-0 flex justify-center">
          <van-button type="primary" icon="plus" round @click="showAddressForm = true">
            添加新地址
          </van-button>
        </div>
      </div>
    </div>
    
    <!-- 地址表单弹窗 -->
    <van-popup v-model:show="showAddressForm" position="bottom" round 
               :style="{ height: '80%' }" closeable>
      <div class="p-4">
        <h2 class="text-center text-lg font-medium mb-4">
          {{ currentAddress ? '编辑地址' : '新增地址' }}
        </h2>
        
        <van-form @submit="submitAddress">
          <van-cell-group inset>
            <van-field
              v-model="addressForm.name"
              name="name"
              label="收货人"
              placeholder="请输入收货人姓名"
              :rules="[{ required: true, message: '请填写收货人姓名' }]"
            />
            
            <van-field
              v-model="addressForm.phone"
              name="phone"
              label="手机号码"
              placeholder="请输入手机号码"
              :rules="[
                { required: true, message: '请填写手机号码' },
                { pattern: /^1[3-9]\d{9}$/, message: '手机号码格式不正确' }
              ]"
            />
            
            <van-field
              readonly
              name="area"
              label="所在地区"
              :model-value="areaText"
              placeholder="请选择所在地区"
              @click="showAreaPicker = true"
              :rules="[{ required: true, message: '请选择所在地区' }]"
            />
            
            <van-field
              v-model="addressForm.detail"
              name="detail"
              label="详细地址"
              placeholder="请输入详细地址信息"
              :rules="[{ required: true, message: '请填写详细地址' }]"
              type="textarea"
              rows="2"
            />
            
            <van-field name="isDefault" label="设为默认地址">
              <template #input>
                <van-switch v-model="addressForm.isDefault" />
              </template>
            </van-field>
          </van-cell-group>
          
          <div class="mt-6 mx-4">
            <van-button round block type="primary" native-type="submit">保存</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
    
    <!-- 地区选择器 -->
    <van-popup v-model:show="showAreaPicker" position="bottom">
      <van-area
        :area-list="areaList"
        @confirm="onAreaConfirm"
        @cancel="showAreaPicker = false"
      />
    </van-popup>
    
    <footer-nav />
  </div>
</template>

<script setup>
import FooterNav from '@/components/FooterNav.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import { areaList } from '@vant/area-data'
import { showDialog, showToast } from 'vant'
import { computed, onMounted, reactive, ref } from 'vue'
// 已注释API导入
// import { 
//   getAddressList, 
//   addAddress, 
//   updateAddress, 
//   deleteAddress as apiDeleteAddress,
//   setDefaultAddress
// } from '@/api/address'

// 创建模拟数据
const mockAddresses = ref([
  {
    id: 1,
    name: '张三',
    phone: '13812345678',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    detail: '科技园南路XX号',
    isDefault: true
  },
  {
    id: 2,
    name: '李四',
    phone: '13987654321',
    province: '广东省',
    city: '广州市',
    district: '天河区',
    detail: '天河路123号',
    isDefault: false
  }
])

// 模拟API调用
const getAddressList = async () => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  return {
    code: 200,
    data: [...mockAddresses.value],
    message: '获取成功'
  }
}

const addAddress = async (data) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 创建新地址
  const newAddress = {
    ...data,
    id: mockAddresses.value.length + 1
  }
  
  // 如果设为默认地址，将其他地址设为非默认
  if (newAddress.isDefault) {
    mockAddresses.value.forEach(addr => {
      addr.isDefault = false
    })
  }
  
  // 添加到地址列表
  mockAddresses.value.push(newAddress)
  
  return {
    code: 200,
    message: '添加成功'
  }
}

const updateAddress = async (data) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 查找要更新的地址
  const index = mockAddresses.value.findIndex(addr => addr.id === data.id)
  if (index === -1) {
    return {
      code: 400,
      message: '地址不存在'
    }
  }
  
  // 如果设为默认地址，将其他地址设为非默认
  if (data.isDefault) {
    mockAddresses.value.forEach(addr => {
      addr.isDefault = false
    })
  }
  
  // 更新地址
  mockAddresses.value[index] = { ...mockAddresses.value[index], ...data }
  
  return {
    code: 200,
    message: '更新成功'
  }
}

const apiDeleteAddress = async (id) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 查找要删除的地址
  const index = mockAddresses.value.findIndex(addr => addr.id === id)
  if (index === -1) {
    return {
      code: 400,
      message: '地址不存在'
    }
  }
  
  // 删除地址
  mockAddresses.value.splice(index, 1)
  
  return {
    code: 200,
    message: '删除成功'
  }
}

const setDefaultAddress = async (id) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 查找要设为默认的地址
  const index = mockAddresses.value.findIndex(addr => addr.id === id)
  if (index === -1) {
    return {
      code: 400,
      message: '地址不存在'
    }
  }
  
  // 将所有地址设为非默认
  mockAddresses.value.forEach(addr => {
    addr.isDefault = false
  })
  
  // 将指定地址设为默认
  mockAddresses.value[index].isDefault = true
  
  return {
    code: 200,
    message: '设置成功'
  }
}

const loading = ref(true)
const error = ref('')
const addresses = ref([])
const showAddressForm = ref(false)
const showAreaPicker = ref(false)
const currentAddress = ref(null)

const addressForm = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

const areaText = computed(() => {
  if (!addressForm.province) return ''
  let text = addressForm.province
  if (addressForm.city) text += ' ' + addressForm.city
  if (addressForm.district) text += ' ' + addressForm.district
  return text
})

onMounted(() => {
  fetchAddresses()
})

const fetchAddresses = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const res = await getAddressList()
    addresses.value = res.data || []
  } catch (err) {
    console.error('获取地址列表失败:', err)
    error.value = '获取地址列表失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

const getFullAddress = (address) => {
  return `${address.province} ${address.city} ${address.district} ${address.detail}`
}

const resetAddressForm = () => {
  Object.assign(addressForm, {
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: false
  })
  currentAddress.value = null
}

const editAddress = (address) => {
  currentAddress.value = address
  Object.assign(addressForm, {
    name: address.name,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
    isDefault: address.isDefault
  })
  showAddressForm.value = true
}

const onAreaConfirm = (values) => {
  addressForm.province = values[0]?.name || ''
  addressForm.city = values[1]?.name || ''
  addressForm.district = values[2]?.name || ''
  showAreaPicker.value = false
}

const submitAddress = async () => {
  try {
    if (currentAddress.value) {
      // 更新地址
      await updateAddress({
        id: currentAddress.value.id,
        ...addressForm
      })
      showToast('地址更新成功')
    } else {
      // 添加地址
      await addAddress(addressForm)
      showToast('地址添加成功')
    }
    
    // 刷新地址列表
    fetchAddresses()
    // 关闭表单
    showAddressForm.value = false
    // 重置表单
    resetAddressForm()
  } catch (err) {
    console.error('保存地址失败:', err)
    showToast('保存地址失败，请稍后再试')
  }
}

const deleteAddress = (id) => {
  showDialog({
    title: '删除地址',
    message: '确定要删除该地址吗？',
    showCancelButton: true
  }).then(({ confirm }) => {
    if (confirm) {
      try {
        apiDeleteAddress(id).then(res => {
          if (res.code === 200) {
            showToast('地址删除成功')
            fetchAddresses()
          } else {
            showToast('删除地址失败：' + (res.message || '未知错误'))
          }
        })
      } catch (err) {
        showToast('删除地址失败，请稍后再试')
      }
    }
  })
}
</script>

<style scoped>
.address-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  padding-top: 46px;
  padding-bottom: 60px;
}

.container {
  flex: 1;
  margin-bottom: 80px;
}

.bg-primary {
  background-color: #007aff;
}

.text-primary {
  color: #007aff;
}
</style>