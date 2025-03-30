<template>
  <div class="publish-lost-found-page">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">{{ isLost ? '发布失物寻找' : '发布拾物归还' }}</div>
      <div class="publish-btn" @click="publishLostFound" :class="{ disabled: !isFormValid }">
        发布
      </div>
    </div>
    
    <!-- AI助手按钮 -->
    <div class="ai-assistant-btn" @click="showContentGenerator = true">
      <i class="icon-ai"></i>
      <span>AI文案助手</span>
    </div>
    
    <!-- 表单类型切换 -->
    <div class="form-type-switch">
      <div 
        class="type-option"
        :class="{ active: formType === 'lost' }"
        @click="formType = 'lost'"
      >
        <div class="option-icon lost-icon"></div>
        <div class="option-label">寻物启事</div>
      </div>
      
      <div 
        class="type-option"
        :class="{ active: formType === 'found' }"
        @click="formType = 'found'"
      >
        <div class="option-icon found-icon"></div>
        <div class="option-label">招领启事</div>
      </div>
    </div>
    
    <!-- 表单内容 -->
    <div class="form-container">
      <!-- 标题 -->
      <div class="form-section">
        <div class="section-title">标题 <span class="required">*</span></div>
        <div class="input-container">
          <input 
            type="text" 
            v-model="lostFoundForm.title" 
            :placeholder="formType === 'lost' ? '请输入物品名称，如：寻找一支黑色钢笔' : '请输入物品名称，如：捡到一支黑色钢笔'" 
            class="text-input"
            maxlength="30"
          >
          <div class="input-counter">{{ lostFoundForm.title.length }}/30</div>
        </div>
      </div>
      
      <!-- 物品分类 -->
      <div class="form-section">
        <div class="section-title">物品分类 <span class="required">*</span></div>
        <div class="category-select" @click="showCategoryPicker = true">
          <div class="selected-category">
            {{ lostFoundForm.category || '请选择分类' }}
          </div>
          <i class="icon-arrow-right"></i>
        </div>
      </div>
      
      <!-- 物品图片 -->
      <div class="form-section">
        <div class="section-title">物品图片</div>
        <div class="images-grid">
          <div
            v-for="(image, index) in lostFoundForm.images"
            :key="index"
            class="image-item"
          >
            <img :src="image.url" :alt="`图片${index+1}`" class="preview-image">
            <div class="delete-image" @click="removeImage(index)">
              <i class="icon-close"></i>
            </div>
          </div>
          
          <div class="add-image-btn" v-if="lostFoundForm.images.length < 4" @click="addImage">
            <i class="icon-camera"></i>
            <span>{{ lostFoundForm.images.length }}/4</span>
          </div>
        </div>
        <div class="images-tip">最多上传4张图片，可以帮助对方更快找到你</div>
      </div>
      
      <!-- 描述 -->
      <div class="form-section">
        <div class="section-title">物品描述 <span class="required">*</span></div>
        <div class="textarea-container">
          <textarea 
            v-model="lostFoundForm.description" 
            :placeholder="formType === 'lost' ? '请详细描述物品特征、丢失经过、时间等信息，以便他人辨认' : '请详细描述物品特征、拾取经过、时间等信息，以便失主辨认'" 
            class="text-textarea"
            rows="4"
          ></textarea>
          <div class="textarea-counter">{{ lostFoundForm.description.length }}/500</div>
        </div>
      </div>
      
      <!-- 丢失/拾取地点 -->
      <div class="form-section">
        <div class="section-title">
          {{ formType === 'lost' ? '丢失地点' : '拾取地点' }} 
          <span class="required">*</span>
        </div>
        <location-field
          v-model="locationData"
          :placeholder="formType === 'lost' ? '在哪里丢失的？' : '在哪里拾取的？'"
          :required="true"
          @update:model-value="handleLocationUpdate"
        />
      </div>
      
      <!-- 丢失/拾取时间 -->
      <div class="form-section">
        <div class="section-title">
          {{ formType === 'lost' ? '丢失时间' : '拾取时间' }} 
          <span class="required">*</span>
        </div>
        <div class="date-time-select" @click="showDatePicker = true">
          <div class="selected-date-time">
            {{ lostFoundForm.lostFoundTime || '请选择时间' }}
          </div>
          <i class="icon-arrow-right"></i>
        </div>
      </div>
      
      <!-- 悬赏 (仅丢失物品时显示) -->
      <div class="form-section" v-if="formType === 'lost'">
        <div class="section-title">悬赏 <span class="optional">(选填)</span></div>
        <div class="reward-input-container">
          <div class="reward-input-wrapper">
            <span class="reward-symbol">¥</span>
            <input 
              type="number" 
              v-model="lostFoundForm.reward" 
              placeholder="0" 
              class="reward-input"
              min="0"
              step="1"
            >
          </div>
          <div class="reward-tip">设置悬赏可提高找回几率</div>
        </div>
      </div>
      
      <!-- 联系方式 -->
      <div class="form-section">
        <div class="section-title">联系方式 <span class="required">*</span></div>
        <div class="contact-selection">
          <div 
            v-for="method in contactMethods" 
            :key="method.value" 
            class="contact-method"
            :class="{ active: lostFoundForm.contactWay === method.value }"
            @click="lostFoundForm.contactWay = method.value"
          >
            <div class="method-icon">
              <i :class="`icon-${method.value}`"></i>
            </div>
            <div class="method-label">{{ method.label }}</div>
          </div>
        </div>
        
        <div class="contact-input-container">
          <input 
            type="text" 
            v-model="lostFoundForm.contactInfo" 
            :placeholder="`请输入${getContactMethodLabel(lostFoundForm.contactWay)}`" 
            class="contact-input"
          >
        </div>
      </div>
    </div>
    
    <!-- 分类选择器弹窗 -->
    <div class="category-picker" v-if="showCategoryPicker">
      <div class="picker-mask" @click="showCategoryPicker = false"></div>
      <div class="picker-content">
        <div class="picker-header">
          <div class="picker-title">选择分类</div>
          <div class="picker-close" @click="showCategoryPicker = false">
            <i class="icon-close"></i>
          </div>
        </div>
        
        <div class="picker-body">
          <div 
            v-for="category in categoryOptions" 
            :key="category" 
            class="picker-item"
            @click="selectCategory(category)"
          >
            {{ category }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 日期选择器弹窗 -->
    <div class="date-picker" v-if="showDatePicker">
      <div class="picker-mask" @click="showDatePicker = false"></div>
      <div class="picker-content">
        <div class="picker-header">
          <div class="picker-title">选择时间</div>
          <div class="picker-close" @click="showDatePicker = false">
            <i class="icon-close"></i>
          </div>
        </div>
        
        <div class="date-selection">
          <!-- 日期选择器模拟 -->
          <div class="date-input-group">
            <input 
              type="date" 
              v-model="dateInput" 
              class="date-input"
            >
            <input 
              type="time" 
              v-model="timeInput" 
              class="time-input"
            >
          </div>
          
          <div class="quick-dates">
            <div class="quick-date-title">快速选择：</div>
            <div class="quick-date-options">
              <div 
                v-for="option in quickDateOptions" 
                :key="option.value" 
                class="quick-date-option"
                @click="selectQuickDate(option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
          
          <button class="confirm-date-btn" @click="confirmDateTime">确认</button>
        </div>
      </div>
    </div>
    
    <!-- 提示信息 -->
    <div class="toast" v-if="toast.show">{{ toast.message }}</div>
    
    <!-- AI图片分析弹出层 -->
    <van-popup
      v-model:show="showImageAnalyzer"
      position="bottom"
      round
      :style="{ height: '75%' }"
    >
      <image-analyzer
        :images="lostFoundForm.images"
        @select-title="handleSelectTitle"
        @select-tag="handleSelectTag"
        @apply-all="handleApplyAllSuggestions"
      />
    </van-popup>
    
    <!-- AI内容生成弹出层 -->
    <van-popup
      v-model:show="showContentGenerator"
      position="bottom"
      round
      :style="{ height: '85%' }"
    >
      <content-generator
        :product-info="lostFoundForm"
        :initial-prompt="generateInitialPrompt()"
        @close="showContentGenerator = false"
        @use-content="handleUseGeneratedContent"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'
import ImageAnalyzer from '@/components/ai/ImageAnalyzer.vue'
import ContentGenerator from '@/components/ai/ContentGenerator.vue'
import LocationField from '@/components/form/LocationField.vue'

const router = useRouter()
const userStore = useUserStore()

// 表单类型：lost（丢失）或 found（拾获）
const formType = ref('lost')

// 表单数据
const lostFoundForm = reactive({
  title: '',
  category: '',
  images: [],
  description: '',
  location: '',
  locationCoords: null,
  lostFoundTime: '',
  reward: 0,
  contactWay: 'phone',
  contactInfo: ''
})

// 物品分类选项
const categoryOptions = [
  '证件', '电子产品', '书籍', '钱包/钥匙', '服装', '生活用品', '其他'
]

// 地点选项
const locationOptions = [
  '图书馆', '教学楼', '食堂', '宿舍楼', '操场', '校门口', '其他'
]

// 联系方式选项
const contactMethods = [
  { label: '手机号', value: 'phone' },
  { label: '微信', value: 'wechat' },
  { label: '邮箱', value: 'email' },
  { label: 'QQ', value: 'qq' }
]

// 快速日期选项
const quickDateOptions = [
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '前天', value: 'beforeYesterday' },
  { label: '一周内', value: 'lastWeek' }
]

// 各种选择器状态
const showCategoryPicker = ref(false)
const showLocationPicker = ref(false)
const showDatePicker = ref(false)

// 自定义地点
const customLocation = ref('')

// 日期时间选择
const dateInput = ref('')
const timeInput = ref('')

// 提示信息
const toast = reactive({
  show: false,
  message: ''
})

// 表单是否有效
const isFormValid = computed(() => {
  return (
    lostFoundForm.title.trim() !== '' &&
    lostFoundForm.category !== '' &&
    lostFoundForm.description.trim() !== '' &&
    lostFoundForm.location !== '' &&
    lostFoundForm.lostFoundTime !== '' &&
    lostFoundForm.contactInfo.trim() !== ''
  )
})

// 获取联系方式的标签
const getContactMethodLabel = (method) => {
  const found = contactMethods.find(m => m.value === method)
  return found ? found.label : ''
}

// 添加图片
const addImage = () => {
  // 在实际应用中，这里应该调用文件选择器
  if (lostFoundForm.images.length >= 4) {
    showToast('最多上传4张图片')
    return
  }
  
  // 模拟上传图片
  const mockImage = {
    id: Date.now(),
    url: `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 1000)}`
  }
  
  lostFoundForm.images.push(mockImage)
}

// 移除图片
const removeImage = (index) => {
  lostFoundForm.images.splice(index, 1)
}

// 选择分类
const selectCategory = (category) => {
  lostFoundForm.category = category
  showCategoryPicker.value = false
}

// 选择地点
const selectLocation = (location) => {
  lostFoundForm.location = location
  showLocationPicker.value = false
}

// 确认自定义地点
const confirmCustomLocation = () => {
  if (customLocation.value.trim()) {
    lostFoundForm.location = customLocation.value
    showLocationPicker.value = false
    customLocation.value = ''
  } else {
    showToast('请输入地点')
  }
}

// 选择快速日期
const selectQuickDate = (option) => {
  const now = new Date()
  let date = new Date()
  
  switch (option) {
    case 'today':
      // 今天，不需要改变日期
      break
    case 'yesterday':
      // 昨天
      date.setDate(now.getDate() - 1)
      break
    case 'beforeYesterday':
      // 前天
      date.setDate(now.getDate() - 2)
      break
    case 'lastWeek':
      // 一周内
      date.setDate(now.getDate() - 7)
      break
  }
  
  dateInput.value = formatDate(date)
  timeInput.value = formatTime(now)
}

// 确认日期时间
const confirmDateTime = () => {
  if (!dateInput.value) {
    showToast('请选择日期')
    return
  }
  
  if (!timeInput.value) {
    showToast('请选择时间')
    return
  }
  
  const selectedDate = new Date(`${dateInput.value}T${timeInput.value}`)
  
  // 验证所选日期是否合法（不超过当前时间）
  if (selectedDate > new Date()) {
    showToast('时间不能超过当前时间')
    return
  }
  
  // 格式化显示
  lostFoundForm.lostFoundTime = `${formatDate(selectedDate, true)} ${timeInput.value}`
  showDatePicker.value = false
}

// 格式化日期为 yyyy-MM-dd 格式
const formatDate = (date, display = false) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return display ? `${year}年${month}月${day}日` : `${year}-${month}-${day}`
}

// 格式化时间为 HH:mm 格式
const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${hours}:${minutes}`
}

// 初始化日期时间输入
const initDateTimeInput = () => {
  const now = new Date()
  dateInput.value = formatDate(now)
  timeInput.value = formatTime(now)
}

// 发布失物招领信息
const publishLostFound = async () => {
  if (!isFormValid.value) {
    if (lostFoundForm.title.trim() === '') {
      showToast('请输入标题')
    } else if (lostFoundForm.category === '') {
      showToast('请选择物品分类')
    } else if (lostFoundForm.description.trim() === '') {
      showToast('请填写物品描述')
    } else if (lostFoundForm.location === '') {
      showToast(`请选择${formType.value === 'lost' ? '丢失' : '拾取'}地点`)
    } else if (lostFoundForm.lostFoundTime === '') {
      showToast(`请选择${formType.value === 'lost' ? '丢失' : '拾取'}时间`)
    } else if (lostFoundForm.contactInfo.trim() === '') {
      showToast('请填写联系方式')
    }
    return
  }
  
  // 验证用户是否登录
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    showToast('发布中...')
    
    // 模拟API请求
    setTimeout(() => {
      showToast('发布成功')
      
      // 跳转到首页
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }, 1500)
  } catch (error) {
    console.error('发布失物招领信息失败', error)
    showToast('发布失败，请重试')
  }
}

// AI助手相关状态
const showImageAnalyzer = ref(false)
const showContentGenerator = ref(false)

// 计算是否是"失物"类型
const isLost = computed(() => formType.value === 'lost')

// 生成初始提示词
const generateInitialPrompt = () => {
  const type = isLost.value ? '失物寻找' : '拾物归还'
  const category = lostFoundForm.category || ''
  
  return `帮我生成一个${type}的${category}描述`
}

// 处理AI图片分析结果
const handleSelectTitle = (title) => {
  lostFoundForm.title = title
}

const handleSelectTag = (tag) => {
  if (!lostFoundForm.tags) {
    lostFoundForm.tags = []
  }
  if (!lostFoundForm.tags.includes(tag)) {
    lostFoundForm.tags.push(tag)
  }
}

const handleApplyAllSuggestions = (suggestions) => {
  if (suggestions.title) {
    lostFoundForm.title = suggestions.title
  }
  
  if (suggestions.description) {
    lostFoundForm.description = suggestions.description
  }
  
  if (suggestions.tags && suggestions.tags.length > 0) {
    lostFoundForm.tags = [...suggestions.tags]
  }
}

// 处理AI内容生成结果
const handleUseGeneratedContent = (data) => {
  const { content, type } = data
  
  if (type === 'description') {
    lostFoundForm.description = content
  } else if (type === 'title') {
    lostFoundForm.title = content
  } else if (type === 'tags') {
    const tags = content.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    lostFoundForm.tags = tags
  }
  
  showContentGenerator.value = false
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 位置数据
const locationData = ref(null);

// 处理位置更新
const handleLocationUpdate = (location) => {
  if (location) {
    lostFoundForm.location = location.address;
    lostFoundForm.locationCoords = {
      lng: location.point.lng,
      lat: location.point.lat
    };
  } else {
    lostFoundForm.location = '';
    lostFoundForm.locationCoords = null;
  }
};

// 在onMounted中初始化数据
onMounted(() => {
  // 初始化日期时间
  initDateTimeInput();
  
  // 设置初始位置数据（如果已有）
  if (lostFoundForm.location && lostFoundForm.locationCoords) {
    locationData.value = {
      point: {
        lng: lostFoundForm.locationCoords.lng,
        lat: lostFoundForm.locationCoords.lat
      },
      address: lostFoundForm.location
    };
  }
});
</script>