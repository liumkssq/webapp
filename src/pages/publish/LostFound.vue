<template>
  <div class="publish-lost-found-page">
    <IosTop />
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">{{ isLost ? '发布失物寻找' : '发布拾物归还' }}</div>
      <div class="publish-btn" @click="publishLostFound" :class="{ disabled: !isFormValid }">
        {{ isPublishing ? '发布中...' : '发布' }}
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
        <div class="option-icon">
          <span class="icon-lost">🔍</span>
        </div>
        <div class="option-label">寻物启事</div>
      </div>
      
      <div 
        class="type-option"
        :class="{ active: formType === 'found' }"
        @click="formType = 'found'"
      >
        <div class="option-icon">
          <span class="icon-found">💪</span>
        </div>
        <div class="option-label">招领启事</div>
      </div>
    </div>
    
    <!-- 表单内容 -->
    <transition name="form-fade" mode="out-in">
    <div class="form-container" :key="formType">
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
        <div class="section-title">物品图片 <span class="optional">(选填)</span></div>
        <div class="images-upload-container">
          <div class="images-grid">
            <div
              v-for="(image, index) in lostFoundForm.images"
              :key="index"
              class="image-item"
            >
              <img :src="image.url" :alt="`图片${index+1}`" class="preview-image">
              <div class="image-index">{{ index + 1 }}</div>
              <div class="delete-image" @click="removeImage(index)">
                <i class="icon-close"></i>
              </div>
            </div>
            
            <div class="add-image-btn" v-if="lostFoundForm.images.length < 4" @click="addImage">
              <i class="icon-camera"></i>
              <span>上传图片</span>
            </div>
          </div>
          <div class="image-counter" v-if="lostFoundForm.images.length > 0">
            {{ lostFoundForm.images.length }}/4
          </div>
          <div class="images-tip">添加图片可以帮助对方更快找到你的物品</div>
          
          <div class="ai-image-analysis" v-if="lostFoundForm.images.length > 0" @click="analyzeImages">
            <i class="icon-ai"></i>
            <span>AI分析物品特征</span>
          </div>
        </div>
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
        
        <!-- 预设地点选项 -->
        <div class="location-options">
          <div 
            v-for="option in locationOptions" 
            :key="option"
            class="location-option"
            :class="{ active: lostFoundForm.location === option }"
            @click="selectLocation(option)"
          >
            {{ option }}
          </div>
        </div>
        
        <!-- 自定义地点输入 -->
        <div class="custom-location-input" v-if="showCustomLocationInput">
          <div class="input-container">
            <input 
              type="text" 
              v-model="customLocation" 
              placeholder="请输入详细地点" 
              class="text-input"
            >
          </div>
          <div class="location-actions">
            <button class="cancel-btn" @click="cancelCustomLocation">取消</button>
            <button class="confirm-btn" @click="confirmCustomLocation">确认</button>
          </div>
        </div>
        
        <!-- 地图选择按钮 -->
        <div class="map-selection" v-if="!showCustomLocationInput">
          <div 
            class="map-select-btn"
            @click="navigateToLocationPicker"
          >
            <i class="icon-map"></i>
            <span>{{ lostFoundForm.location ? '修改地点' : '在地图上选择位置' }}</span>
          </div>
          
          <div 
            class="custom-location-btn"
            @click="showCustomLocationInput = true"
          >
            <i class="icon-edit"></i>
            <span>手动输入</span>
          </div>
        </div>
        
        <!-- 已选位置信息展示 -->
        <div class="selected-location-display" v-if="lostFoundForm.location && !showCustomLocationInput">
          <i class="icon-location"></i>
          <div class="location-text">{{ lostFoundForm.location }}</div>
          <div class="clear-location" @click="clearLocation">
            <i class="icon-close"></i>
          </div>
        </div>
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
    </transition>
    
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
          <div class="picker-options">
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
          <!-- 日期时间选择 -->
          <div class="date-input-container">
            <div class="date-label">选择日期</div>
            <div class="date-input-group">
              <input 
                type="date" 
                v-model="dateInput" 
                class="date-input"
              >
            </div>
            
            <div class="date-label">选择时间</div>
            <div class="date-input-group">
              <input 
                type="time" 
                v-model="timeInput" 
                class="time-input"
              >
            </div>
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
          
          <button class="confirm-date-btn" @click="confirmDateTime">确认选择</button>
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
      :style="{ height: '85%', width: '100%', boxSizing: 'border-box' }"
    >
      <content-generator
        :product-info="lostFoundForm"
        :initial-prompt="generateInitialPrompt()"
        context-type="lostfound"
        @close="showContentGenerator = false"
        @use-content="handleUseGeneratedContent"
      />
    </van-popup>
  </div>
</template>

<script setup>
import ContentGenerator from '@/components/ai/ContentGenerator.vue'
import ImageAnalyzer from '@/components/ai/ImageAnalyzer.vue'
import IosTop from '@/components/Ios/IosTop.vue'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

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
  '图书馆', '自习室', '实验室', '教学楼', '食堂', '宿舍楼', '操场', '校门口', '体育馆', '会议室', '办公楼', '其他'
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

// 发布状态
const isPublishing = ref(false)

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

// 修改addImage方法
const addImage = async () => {
  // 检查图片数量限制
  if (lostFoundForm.images.length >= 4) {
    showToast('最多上传4张图片')
    return
  }
  
  // 创建文件输入元素
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.style.display = 'none'
  document.body.appendChild(fileInput)
  
  // 监听文件选择事件
  fileInput.addEventListener('change', async (event) => {
    try {
      const file = event.target.files[0]
      if (!file) {
        document.body.removeChild(fileInput)
        return
      }
      
      // 验证文件类型和大小
      if (!file.type.includes('image')) {
        showToast('请选择图片文件')
        document.body.removeChild(fileInput)
        return
      }
      
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        showToast('图片大小不能超过10MB')
        document.body.removeChild(fileInput)
        return
      }
      
      // 显示上传中的提示
      showToast('上传中...')
      
      // 更新导入上传方法
      const { smartUploadImage } = await import('@/api/upload')
      
      // 上传图片到OSS
      const result = await smartUploadImage(file, 'lostfound')
      
      // 添加图片到表单
      if (result && result.url) {
        lostFoundForm.images.push({
          id: Date.now(),
          url: result.url
        })
        showToast('上传成功')
      } else {
        showToast('上传失败，请重试')
      }
    } catch (error) {
      console.error('图片上传出错:', error)
      showToast('上传失败: ' + (error.message || '请重试'))
    } finally {
      // 移除文件输入元素
      document.body.removeChild(fileInput)
    }
  })
  
  // 触发文件选择对话框
  fileInput.click()
}

// 移除图片
const removeImage = (index) => {
  lostFoundForm.images.splice(index, 1)
}

// AI分析图片
const analyzeImages = async () => {
  if (lostFoundForm.images.length === 0) {
    showToast('请先上传图片');
    return;
  }

  showToast('AI正在分析图片...');
  
  try {
    // 导入AI图片分析函数
    const { analyzeImages } = await import('@/utils/aiAssist');
    
    // 显示加载中状态
    showImageAnalyzer.value = true;
    
    // 调用AI图片分析，传入图片数组、上下文类型和已有表单信息
    const analysisResult = await analyzeImages(lostFoundForm.images, {
      contextType: 'lostfound',
      existingTitle: lostFoundForm.title,
      existingDescription: lostFoundForm.description
    });
    
    // 检查是否有错误
    if (analysisResult.error) {
      showToast('分析失败：' + analysisResult.error);
      showImageAnalyzer.value = false;
      return;
    }
    
    // 如果没有现有描述，可以直接应用分析结果
    if (!lostFoundForm.description && analysisResult.description) {
      lostFoundForm.description = analysisResult.description;
    }
    
    // 如果没有标题，使用推荐标题
    if (!lostFoundForm.title && analysisResult.title) {
      lostFoundForm.title = analysisResult.title;
    }
    
    showToast('AI分析完成');
  } catch (error) {
    console.error('AI图片分析出错:', error);
    showToast('分析失败: ' + (error.message || '未知错误'));
    showImageAnalyzer.value = false;
  }
}

// 选择分类
const selectCategory = (category) => {
  lostFoundForm.category = category
  showCategoryPicker.value = false
}

// 选择预设地点
const selectLocation = (location) => {
  lostFoundForm.location = location
  // 清空坐标，因为预设地点没有确切坐标
  lostFoundForm.locationCoords = null
}

// 显示自定义地点输入标志
const showCustomLocationInput = ref(false)

// 自定义地点输入内容
// customLocation 变量已在上面声明过

// 清除选择的地点
const clearLocation = () => {
  lostFoundForm.location = ''
  lostFoundForm.locationCoords = null
}

// 确认自定义地点
const confirmCustomLocation = () => {
  if (customLocation.value.trim()) {
    lostFoundForm.location = customLocation.value.trim()
    lostFoundForm.locationCoords = null // 清空坐标
    showCustomLocationInput.value = false
    customLocation.value = ''
  } else {
    showToast('请输入地点')
  }
}

// 取消自定义地点输入
const cancelCustomLocation = () => {
  showCustomLocationInput.value = false
  customLocation.value = ''
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
  
  // 防止重复点击
  if (isPublishing.value) {
    return
  }
  
  isPublishing.value = true
  
  try {
    // 验证用户是否登录
    if (!userStore.isLoggedIn) {
      router.push('/login')
      return
    }
    
    showToast('发布中...')
    
    // 打印完整的表单数据
    console.log('完整的表单数据:', JSON.stringify(lostFoundForm, null, 2))
    
    // 转换分类为ID (临时解决方案)
    let categoryId = 1;
    const categoryMapping = {
      '证件': 1,
      '电子产品': 2,
      '书籍': 3,
      '钱包/钥匙': 4,
      '服装': 5,
      '生活用品': 6,
      '其他': 7
    };
    
    if (lostFoundForm.category && categoryMapping[lostFoundForm.category]) {
      categoryId = categoryMapping[lostFoundForm.category];
    }
    
    console.log('分类映射:', lostFoundForm.category, '->', categoryId);
    
    // 准备API请求数据
    const lostFoundData = {
      title: lostFoundForm.title,
      description: lostFoundForm.description,
      type: formType.value, // lost 或 found
      categoryId: categoryId,
      category: lostFoundForm.category,
      images: lostFoundForm.images.map(img => img.url),
      location: lostFoundForm.location,
      locationCoords: lostFoundForm.locationCoords,
      eventTime: lostFoundForm.lostFoundTime,
      reward: formType.value === 'lost' ? Number(lostFoundForm.reward) || 0 : 0,
      contactWay: lostFoundForm.contactWay,
      contactInfo: lostFoundForm.contactInfo,
      tags: lostFoundForm.tags || []
    }
    
    console.log('准备发送的失物招领数据:', JSON.stringify(lostFoundData, null, 2))
    
    // 导入API函数
    const { publishLostFound } = await import('@/api/lostFound')
    
    // 调用发布失物招领API
    console.log('开始调用publishLostFound API...')
    const response = await publishLostFound(lostFoundData)
    
    console.log('发布失物招领API响应:', response)
    
    // 检查响应
    if (!response) {
      console.error('API响应为空')
      showToast('发布失败：服务器响应为空')
      isPublishing.value = false
      return
    }
    
    if (response && (response.code === 200 || response.success)) {
      showToast('发布成功')
      
      // 发布成功，清除草稿
      clearFormDataStorage();
      
      // 打印成功信息
      console.log('失物招领发布成功，准备跳转...')
      
      // 延迟跳转到首页或详情页
      setTimeout(() => {
        if (response.data && response.data.id) {
          // 如果返回了ID，跳转到详情页
          const itemId = response.data.id
          console.log('跳转到失物招领详情页:', itemId)
          // 跳转到详情页
          router.push(`/lostFound/detail/${itemId}`)
        } else {
          // 否则返回列表页
          console.log('跳转到失物招领列表页')
          router.push('/lostFound')
        }
      }, 1000)
    } else {
      // 显示错误信息
      const errorMsg = response?.message || '发布失败，请重试'
      console.error('发布失败:', errorMsg, response)
      showToast(errorMsg)
    }
  } catch (error) {
    console.error('发布失物招领异常:', error)
    showToast('发布失败：' + (error.message || '请重试'))
  } finally {
    isPublishing.value = false
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

// 存储表单数据到本地存储
const saveFormDataToStorage = () => {
  localStorage.setItem('lostfound_form_draft', JSON.stringify({
    title: lostFoundForm.title,
    category: lostFoundForm.category,
    description: lostFoundForm.description,
    images: lostFoundForm.images,
    contactWay: lostFoundForm.contactWay,
    contactInfo: lostFoundForm.contactInfo,
    reward: lostFoundForm.reward,
    // 不保存位置信息，因为位置信息会从URL中获取
  }));
  console.log('已保存失物招领表单数据到本地存储');
};

// 从本地存储中恢复表单数据
const restoreFormDataFromStorage = () => {
  const savedData = localStorage.getItem('lostfound_form_draft');
  if (!savedData) return false;
  
  try {
    const formData = JSON.parse(savedData);
    console.log('从本地存储恢复失物招领表单数据:', formData);
    
    // 恢复表单数据
    if (formData.title) lostFoundForm.title = formData.title;
    if (formData.category) lostFoundForm.category = formData.category;
    if (formData.description) lostFoundForm.description = formData.description;
    if (formData.images && formData.images.length) lostFoundForm.images = formData.images;
    if (formData.contactWay) lostFoundForm.contactWay = formData.contactWay;
    if (formData.contactInfo) lostFoundForm.contactInfo = formData.contactInfo;
    if (formData.reward) lostFoundForm.reward = formData.reward;
    
    return true;
  } catch (error) {
    console.error('恢复失物招领表单数据失败:', error);
    return false;
  }
};

// 清除本地存储的表单数据
const clearFormDataStorage = () => {
  localStorage.removeItem('lostfound_form_draft');
  console.log('已清除失物招领表单数据本地存储');
};

// 在onMounted中初始化数据
onMounted(() => {
  // 初始化日期时间
  initDateTimeInput();
  
  // 先尝试恢复表单数据
  const restored = restoreFormDataFromStorage();
  console.log('表单数据恢复状态:', restored);
  
  // 检查是否有地图选择的回调数据
  let locationDataFromUrl = null;
  const fullPath = window.location.href;
  console.log('URL完整路径:', fullPath);
  
  // 1. 先尝试常规方式获取
  locationDataFromUrl = router.currentRoute.value.query.location;
  console.log('Router查询参数:', router.currentRoute.value.query);
  
  // 2. 如果没有获取到，检查URL中是否有格式问题
  if (!locationDataFromUrl) {
    console.log('尝试从URL直接提取位置数据');
    
    // 使用正则表达式提取location参数，支持各种URL格式
    const locationMatch = fullPath.match(/[?&]location=([^&]+)/);
    if (locationMatch && locationMatch[1]) {
      locationDataFromUrl = decodeURIComponent(locationMatch[1]);
      console.log('从URL中提取的位置数据:', locationDataFromUrl);
    }
  }
  
  if (locationDataFromUrl) {
    try {
      console.log('接收到位置数据:', locationDataFromUrl);
      // 如果已经是对象，则不需要解析
      let location = typeof locationDataFromUrl === 'string' ? 
                    JSON.parse(decodeURIComponent(locationDataFromUrl)) : 
                    locationDataFromUrl;
      console.log('解析后的位置数据:', location);
      
      // 确保有address属性
      if (location.address) {
        lostFoundForm.location = location.address;
        lostFoundForm.locationCoords = {
          lng: location.lng,
          lat: location.lat
        };
        
        showToast('已自动填入地点');
        console.log('已设置位置信息:', lostFoundForm.location, lostFoundForm.locationCoords);
      } else {
        console.error('位置数据缺少address属性:', location);
        showToast('位置数据不完整，请重新选择');
      }
      
      // 清除URL中的location参数
      router.replace({
        path: router.currentRoute.value.path
      });
    } catch (e) {
      console.error('解析位置信息失败', e);
      showToast('位置信息解析失败');
    }
  } else {
    console.log('未检测到位置数据');
  }
  
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
  
  // 设置自动保存草稿
  window.addEventListener('beforeunload', saveFormDataToStorage);
});

// 在组件销毁时移除事件监听
onUnmounted(() => {
  window.removeEventListener('beforeunload', saveFormDataToStorage);
});

// 跳转到地图选择页面
const navigateToLocationPicker = () => {
  // 先保存当前表单内容
  saveFormDataToStorage();
  
  // 将当前地址传递给地图选择页面（如果有）
  const query = lostFoundForm.locationCoords ? 
    { location: JSON.stringify(lostFoundForm.locationCoords) } : 
    {};
  
  // 导航到地图选择页面，并设置回调
  router.push({
    path: '/map/picker',
    query: {
      ...query,
      callback: '/publish/lostFound'
    }
  });
};
</script>

<style scoped>
/* iOS风格全局样式 */
.publish-lost-found-page {
  background-color: #f2f2f7;
  min-height: 100vh;
  padding-bottom: 100px; /* 增加底部边距，确保内容可以完全滚动 */
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  color: #1c1c1e;
  position: relative;
  overflow-y: auto; /* 确保页面可滚动 */
  -webkit-overflow-scrolling: touch; /* 添加iOS平滑滚动 */
}

/* iOS风格状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 16px;
  background-color: #f2f2f7;
  height: 24px;
  font-weight: 600;
}

.status-icons {
  display: flex;
  gap: 8px;
}

/* iOS风格导航栏 */
.navigation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
  position: sticky;
  top: 24px;
  z-index: 100;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #007aff;
}

.icon-back::before {
  content: "\2190";
  font-size: 18px;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.publish-btn {
  padding: 6px 12px;
  background-color: #007aff;
  color: white;
  font-weight: 500;
  border-radius: 18px;
  font-size: 15px;
  transition: opacity 0.2s;
}

.publish-btn.disabled {
  opacity: 0.6;
}

/* AI助手按钮 */
.ai-assistant-btn {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  margin: 16px;
  border-radius: 16px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.ai-assistant-btn:active {
  transform: scale(0.98);
  background-color: rgba(0, 122, 255, 0.15);
}

.icon-ai::before {
  content: "\2728";
  font-size: 16px;
}

/* 表单类型切换 */
.form-type-switch {
  display: flex;
  background-color: #f2f2f7;
  border-radius: 12px;
  margin: 16px;
  padding: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.type-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  gap: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  font-size: 15px;
  font-weight: 500;
  color: #8e8e93;
}

.type-option.active {
  background-color: #fff;
  color: #007aff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.option-icon {
  width: 20px;
  height: 20px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

/* 表单容器样式 */
.form-container {
  padding: 0 16px;
}

.form-section {
  margin-bottom: 24px;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1c1c1e;
  display: flex;
  align-items: center;
}

.required {
  color: #ff3b30;
  margin-left: 4px;
}

.optional {
  color: #8e8e93;
  font-size: 14px;
  font-weight: normal;
}

/* 图片上传相关样式 */
.images-upload-container {
  display: flex;
  flex-direction: column;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.image-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* 保持宽高比为1:1 */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.image-index {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.delete-image {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-close {
  font-size: 16px;
  color: white;
}

.add-image-btn {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background-color: #f2f2f7;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px dashed #c7c7cc;
  transition: all 0.2s;
}

.add-image-btn:active {
  background-color: #e5e5ea;
}

.icon-camera {
  position: absolute;
  top: 35%;
  width: 24px;
  height: 24px;
  color: #8e8e93;
}

.icon-camera::before {
  content: "📷";
  font-size: 20px;
}

.add-image-btn span {
  position: absolute;
  top: 60%;
  font-size: 12px;
  color: #8e8e93;
}

.image-counter {
  font-size: 13px;
  color: #8e8e93;
  margin-top: 4px;
  margin-bottom: 8px;
  text-align: right;
}

.images-tip {
  font-size: 13px;
  color: #8e8e93;
  margin-top: 8px;
  margin-bottom: 16px;
}

.ai-image-analysis {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
  border-radius: 8px;
  background-color: rgba(0, 122, 255, 0.05);
  color: #007aff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-image-analysis:active {
  background-color: rgba(0, 122, 255, 0.1);
}

/* 位置选择相关样式 */
.location-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  padding: 3px 0;
}

.location-option {
  padding: 10px 14px;
  border-radius: 16px;
  background-color: #f2f2f7;
  font-size: 14px;
  color: #8e8e93;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.location-option:active {
  transform: scale(0.97);
}

.location-option.active {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
  border: 1px solid rgba(0, 122, 255, 0.2);
  box-shadow: 0 1px 3px rgba(0, 122, 255, 0.1);
}

.map-selection {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}

.map-select-btn, .custom-location-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
  border-radius: 12px;
  background-color: rgba(0, 122, 255, 0.05);
  color: #007aff;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.25s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 122, 255, 0.15);
}

.map-select-btn:active, .custom-location-btn:active {
  background-color: rgba(0, 122, 255, 0.1);
  transform: scale(0.98);
}

.map-select-btn {
  margin-right: 10px;
}

.icon-map::before {
  content: "🗺️";
  font-size: 16px;
}

.icon-edit::before {
  content: "✏️";
  font-size: 16px;
}

.icon-location::before {
  content: "📍";
  font-size: 18px;
  color: #007aff;
}

.custom-location-input {
  margin-top: 12px;
}

.location-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.cancel-btn, .confirm-btn {
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  outline: none;
  cursor: pointer;
  transition: all 0.25s;
}

.cancel-btn {
  background-color: #f2f2f7;
  color: #8e8e93;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.cancel-btn:active {
  background-color: #e5e5ea;
}

.confirm-btn {
  background-color: #007aff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
}

.confirm-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 122, 255, 0.2);
}

.selected-location-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 14px;
  background-color: rgba(0, 122, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(0, 122, 255, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.location-text {
  flex: 1;
  font-size: 14px;
  color: #1c1c1e;
}

.clear-location {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
}

.icon-close::before {
  content: "\00d7";
  font-size: 24px;
  color: #8e8e93;
}

/* 提示信息 */
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 15px;
  z-index: 1100;
  max-width: 80%;
  text-align: center;
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 表单切换动画 */
.form-fade-enter-active,
.form-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.form-fade-enter-from,
.form-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.form-fade-enter-to,
.form-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* 选择器样式 */
.category-picker, .date-picker {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: 1000;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  animation: fade-in 0.3s ease;
}

.picker-content {
  position: relative;
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1001;
}

.picker-header {
  padding: 16px;
  border-bottom: 1px solid rgba(209, 209, 214, 0.3);
  position: relative;
}

.picker-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.picker-close {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.picker-close:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.picker-body {
  max-height: 60vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
}

.picker-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.picker-item {
  padding: 14px 10px;
  background-color: #f2f2f7;
  border-radius: 12px;
  text-align: center;
  font-size: 15px;
  color: #1c1c1e;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.picker-item:active {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
  transform: scale(0.98);
}

/* 日期选择器样式 */
.date-selection {
  padding: 16px;
}

.date-input-container {
  margin-bottom: 20px;
}

.date-label {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1c1c1e;
}

.date-input-group {
  margin-bottom: 16px;
}

.date-input, .time-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(60, 60, 67, 0.1);
  background-color: #fff;
  font-size: 16px;
  color: #1c1c1e;
  outline: none;
  appearance: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.date-input:focus, .time-input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.25);
}

.quick-dates {
  margin-bottom: 20px;
}

.quick-date-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #1c1c1e;
}

.quick-date-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-date-option {
  padding: 10px 14px;
  background-color: #f2f2f7;
  border-radius: 12px;
  font-size: 14px;
  color: #1c1c1e;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.quick-date-option:active {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
  transform: scale(0.98);
}

.confirm-date-btn {
  width: 100%;
  padding: 14px;
  background-color: #007aff;
  color: white;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 14px;
  box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
  transition: all 0.2s;
  margin-top: 16px;
  margin-bottom: 8px; /* 添加底部边距，防止被底部安全区域遮挡 */
}

.confirm-date-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 122, 255, 0.2);
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .publish-lost-found-page {
    background-color: #1c1c1e;
    color: #ffffff;
  }
  
  .status-bar, .navigation-bar {
    background-color: #1c1c1e;
  }
  
  .navigation-bar {
    border-bottom-color: rgba(84, 84, 88, 0.65);
  }
  
  .form-section {
    background-color: #2c2c2e;
    box-shadow: none;
  }
  
  .text-input, .contact-input, .reward-input-wrapper, .category-select, .date-time-select {
    border-bottom-color: #38383a;
    color: #ffffff;
  }
  
  .text-textarea {
    background-color: #38383a;
    border-color: #38383a;
    color: #ffffff;
  }
  
  .location-option {
    background-color: #38383a;
  }
  
  .selected-category, .selected-date-time, .location-text {
    color: #ffffff;
  }
  
  .form-type-switch {
    background-color: #2c2c2e;
  }
  
  .type-option {
    color: #8e8e93;
  }
  
  .type-option.active {
    background-color: #38383a;
  }
  
  /* 选择器暗黑模式 */
  .picker-content {
    background-color: #2c2c2e;
  }
  
  .picker-mask {
    background-color: rgba(0, 0, 0, 0.7);
  }
  
  .picker-header {
    border-bottom-color: rgba(84, 84, 88, 0.65);
  }
  
  .picker-title {
    color: #ffffff;
  }
  
  .picker-item {
    background-color: #38383a;
    color: #ffffff;
    border-color: rgba(84, 84, 88, 0.65);
  }
  
  .picker-item:active {
    background-color: rgba(10, 132, 255, 0.2);
  }
  
  /* 日期选择器暗黑模式 */
  .date-label,
  .quick-date-title {
    color: #ffffff;
  }
  
  .date-input,
  .time-input {
    background-color: #38383a;
    border-color: rgba(84, 84, 88, 0.65);
    color: #ffffff;
  }
  
  .quick-date-option {
    background-color: #38383a;
    color: #ffffff;
    border-color: rgba(84, 84, 88, 0.65);
  }
}
</style>