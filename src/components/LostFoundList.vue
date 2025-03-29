<template>
  <div class="lost-found-list-component">
    <!-- 顶部选项卡切换 -->
    <div class="tabs-container" v-if="showTabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'all' }"
        @click="switchTab('all')"
      >
        全部
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'lost' }"
        @click="switchTab('lost')"
      >
        寻物启事
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'found' }"
        @click="switchTab('found')"
      >
        招领启事
      </div>
    </div>
    
    <!-- 过滤栏 -->
    <div class="filter-bar" v-if="showFilter">
      <div 
        v-for="filter in filters" 
        :key="filter.type"
        class="filter-item"
        :class="{ active: activeFilters[filter.type] !== filter.defaultValue }"
        @click="showFilterOptions(filter.type)"
      >
        {{ getFilterLabel(filter) }}
        <i class="icon-arrow-down"></i>
      </div>
    </div>
    
    <!-- 列表内容 -->
    <div class="list-container" v-if="items.length > 0">
      <div 
        v-for="item in items" 
        :key="item.id" 
        class="lost-found-item"
        @click="goToDetail(item.id)"
      >
        <!-- 物品图片 -->
        <div class="item-image" v-if="item.images && item.images.length > 0">
          <img 
            :src="item.images[0]" 
            :alt="item.title"
            @error="handleImageError"
          >
        </div>
        <div class="item-placeholder" v-else>
          <i :class="item.type === 'lost' ? 'icon-lost' : 'icon-found'"></i>
        </div>
        
        <!-- 物品信息 -->
        <div class="item-info">
          <!-- 物品标题 -->
          <div class="item-title-row">
            <div class="item-type-tag" :class="item.type">
              {{ item.type === 'lost' ? '寻物' : '招领' }}
            </div>
            <div class="item-title">{{ item.title }}</div>
          </div>
          
          <!-- 物品描述 -->
          <div class="item-description">{{ item.description }}</div>
          
          <!-- 物品元数据 -->
          <div class="item-meta">
            <div class="meta-item">
              <i class="icon-category"></i>
              <span>{{ item.category }}</span>
            </div>
            <div class="meta-item">
              <i class="icon-location"></i>
              <span>{{ item.location }}</span>
            </div>
            <div class="meta-item">
              <i class="icon-time"></i>
              <span>{{ formatTime(item.eventTime) }}</span>
            </div>
          </div>
          
          <!-- 悬赏信息 -->
          <div class="reward-info" v-if="item.type === 'lost' && item.reward">
            <i class="icon-reward"></i>
            <span class="reward-amount">悬赏 ¥{{ item.reward }}</span>
          </div>
          
          <!-- 物品状态 -->
          <div class="item-status-row">
            <div class="item-status" :class="getStatusClass(item.status)">
              {{ getStatusText(item.status, item.type) }}
            </div>
            <div class="item-time">{{ formatTimeAgo(item.createTime) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div class="loading-container" v-if="loading && !items.length">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <!-- 空状态 -->
    <div class="empty-state" v-if="!loading && !items.length">
      <div class="empty-icon">
        <i :class="activeTab === 'lost' ? 'icon-empty-lost' : 'icon-empty-found'"></i>
      </div>
      <div class="empty-text">{{ getEmptyText() }}</div>
      <div class="empty-action" v-if="showEmptyAction" @click="handleEmptyAction">
        {{ activeTab === 'lost' ? '发布寻物启事' : activeTab === 'found' ? '发布招领启事' : '发布启事' }}
      </div>
    </div>
    
    <!-- 上拉加载更多 -->
    <div class="load-more" v-if="items.length > 0 && hasMore">
      <div class="loading-spinner small" v-if="loadingMore"></div>
      <div class="load-more-text" v-else>上拉加载更多</div>
    </div>
    
    <!-- 没有更多数据 -->
    <div class="no-more" v-if="items.length > 0 && !hasMore && !loading">
      已经到底了~
    </div>
    
    <!-- 筛选弹窗 -->
    <div class="filter-popup" v-if="showFilterPopup">
      <div class="popup-mask" @click="hideFilterPopup"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">{{ currentFilter ? currentFilter.label : '筛选' }}</div>
          <div class="popup-close" @click="hideFilterPopup">
            <i class="icon-close"></i>
          </div>
        </div>
        
        <div class="filter-options" v-if="currentFilter">
          <div 
            v-for="option in currentFilter.options" 
            :key="option.value"
            class="filter-option"
            :class="{ active: activeFilters[currentFilter.type] === option.value }"
            @click="selectFilterOption(option.value)"
          >
            {{ option.label }}
            <i class="icon-check" v-if="activeFilters[currentFilter.type] === option.value"></i>
          </div>
        </div>
        
        <div class="filter-actions" v-if="currentFilter && currentFilter.type === 'time'">
          <div class="action-btn reset" @click="resetDateRange">重置</div>
          <div class="action-btn confirm" @click="confirmFilter">确定</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getLostFoundList } from '@/api/lostFound'

// 组件props
const props = defineProps({
  // 默认选中的标签
  defaultTab: {
    type: String,
    default: 'all' // all, lost, found
  },
  // 是否显示标签
  showTabs: {
    type: Boolean,
    default: true
  },
  // 是否显示过滤器
  showFilter: {
    type: Boolean,
    default: true
  },
  // 用户ID，获取指定用户的失物招领
  userId: {
    type: [String, Number],
    default: ''
  },
  // 每页数量
  pageSize: {
    type: Number,
    default: 10
  },
  // 是否显示空状态操作按钮
  showEmptyAction: {
    type: Boolean,
    default: false
  }
})

// 组件事件
const emit = defineEmits(['refresh', 'emptyAction', 'tabChange'])

const router = useRouter()

// 状态变量
const loading = ref(false)
const loadingMore = ref(false)
const items = ref([])
const activeTab = ref(props.defaultTab)
const page = ref(1)
const hasMore = ref(true)
const showFilterPopup = ref(false)
const currentFilter = ref(null)
const activeFilters = reactive({
  category: 'all',   // 物品类别: all-全部, electronics-电子产品, books-书籍, cards-卡片证件, clothing-衣物, other-其他
  location: 'all',   // 地点: all-全部, classroom-教室, library-图书馆, canteen-食堂, dormitory-宿舍, other-其他
  status: 'all',     // 状态: all-全部, pending-处理中, found/claimed-已找到/已认领, closed-已关闭
  time: 'all'        // 时间: all-全部, today-今天, yesterday-昨天, this_week-本周, this_month-本月, custom-自定义
})

// 筛选器配置
const filters = [
  {
    type: 'category',
    label: '物品类别',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部类别' },
      { value: 'electronics', label: '电子产品' },
      { value: 'books', label: '书籍资料' },
      { value: 'cards', label: '卡片证件' },
      { value: 'clothing', label: '衣物饰品' },
      { value: 'daily', label: '日常用品' },
      { value: 'other', label: '其他物品' }
    ]
  },
  {
    type: 'location',
    label: '丢失/拾获地点',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部地点' },
      { value: 'classroom', label: '教室' },
      { value: 'library', label: '图书馆' },
      { value: 'canteen', label: '食堂' },
      { value: 'dormitory', label: '宿舍' },
      { value: 'playground', label: '操场' },
      { value: 'other', label: '其他地点' }
    ]
  },
  {
    type: 'status',
    label: '处理状态',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部状态' },
      { value: 'pending', label: '处理中' },
      { value: 'found', label: '已找到' },
      { value: 'claimed', label: '已认领' },
      { value: 'closed', label: '已关闭' }
    ]
  },
  {
    type: 'time',
    label: '时间筛选',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部时间' },
      { value: 'today', label: '今天' },
      { value: 'yesterday', label: '昨天' },
      { value: 'this_week', label: '本周' },
      { value: 'this_month', label: '本月' },
      { value: 'custom', label: '自定义时间' }
    ]
  }
]

// 获取过滤器显示文本
const getFilterLabel = (filter) => {
  const value = activeFilters[filter.type]
  
  if (value === filter.defaultValue) {
    return filter.label
  }
  
  const option = filter.options.find(opt => opt.value === value)
  return option ? option.label : filter.label
}

// 切换标签
const switchTab = (tab) => {
  if (activeTab.value === tab) return
  
  activeTab.value = tab
  page.value = 1
  items.value = []
  hasMore.value = true
  
  // 通知父组件标签变化
  emit('tabChange', tab)
  
  fetchItems()
}

// 显示过滤器选项
const showFilterOptions = (type) => {
  currentFilter.value = filters.find(f => f.type === type)
  showFilterPopup.value = true
}

// 隐藏过滤器弹窗
const hideFilterPopup = () => {
  showFilterPopup.value = false
  currentFilter.value = null
}

// 选择过滤器选项
const selectFilterOption = (value) => {
  if (!currentFilter.value) return
  
  activeFilters[currentFilter.value.type] = value
  
  // 时间筛选需要额外处理
  if (currentFilter.value.type === 'time' && value === 'custom') {
    // 自定义时间选择逻辑
    // 在实际应用中，这里可能会显示一个日期选择器
    return
  }
  
  // 重置页码并重新获取数据
  page.value = 1
  items.value = []
  hasMore.value = true
  
  hideFilterPopup()
  fetchItems()
}

// 重置日期范围
const resetDateRange = () => {
  // 重置自定义日期范围
  // 在实际应用中，这里会重置日期选择器的值
}

// 确认筛选
const confirmFilter = () => {
  // 确认自定义日期范围
  hideFilterPopup()
  
  // 重置页码并重新获取数据
  page.value = 1
  items.value = []
  hasMore.value = true
  
  fetchItems()
}

// 获取失物招领列表
const fetchItems = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  
  try {
    // 构建查询参数
    const params = {
      page: page.value,
      limit: props.pageSize
    }
    
    // 添加类型筛选
    if (activeTab.value !== 'all') {
      params.type = activeTab.value
    }
    
    // 添加用户ID
    if (props.userId) {
      params.userId = props.userId
    }
    
    // 添加物品类别
    if (activeFilters.category !== 'all') {
      params.category = activeFilters.category
    }
    
    // 添加地点
    if (activeFilters.location !== 'all') {
      params.location = activeFilters.location
    }
    
    // 添加状态
    if (activeFilters.status !== 'all') {
      params.status = activeFilters.status
    }
    
    // 添加时间筛选
    if (activeFilters.time !== 'all') {
      const now = new Date()
      let startTime
      
      if (activeFilters.time === 'today') {
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      } else if (activeFilters.time === 'yesterday') {
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()
        const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 1
        params.endTime = endTime
      } else if (activeFilters.time === 'this_week') {
        const day = now.getDay() || 7
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1).getTime()
      } else if (activeFilters.time === 'this_month') {
        startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
      } else if (activeFilters.time === 'custom') {
        // 自定义时间范围
        // 在实际应用中，这里会获取日期选择器的值
      }
      
      if (startTime) {
        params.startTime = startTime
      }
    }
    
    const res = await getLostFoundList(params)
    
    if (res.code === 200 && res.data && res.data.list) {
      if (isLoadMore) {
        items.value = [...items.value, ...res.data.list]
      } else {
        items.value = res.data.list
      }
      
      // 更新是否有更多数据
      hasMore.value = res.data.hasMore || false
    } else {
      console.error('返回数据格式错误', res)
    }
  } catch (error) {
    console.error('获取失物招领列表失败', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const date = new Date(time)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  
  return `${month}-${day}`
}

// 格式化时间差
const formatTimeAgo = (time) => {
  if (!time) return ''
  
  const date = new Date(time)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  
  // 小于1分钟
  if (diff < 60) {
    return '刚刚'
  }
  // 小于1小时
  else if (diff < 3600) {
    return Math.floor(diff / 60) + '分钟前'
  }
  // 小于24小时
  else if (diff < 86400) {
    return Math.floor(diff / 3600) + '小时前'
  }
  // 小于30天
  else if (diff < 2592000) {
    return Math.floor(diff / 86400) + '天前'
  }
  // 超过30天
  else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
}

// 获取状态文本
const getStatusText = (status, type) => {
  if (type === 'lost') {
    if (status === 'pending') return '寻找中'
    if (status === 'found') return '已找到'
    if (status === 'closed') return '已关闭'
  } else {
    if (status === 'pending') return '待认领'
    if (status === 'claimed') return '已认领'
    if (status === 'closed') return '已关闭'
  }
  
  return '未知状态'
}

// 获取状态样式类
const getStatusClass = (status) => {
  if (status === 'pending') return 'status-pending'
  if (status === 'found' || status === 'claimed') return 'status-success'
  if (status === 'closed') return 'status-closed'
  
  return 'status-pending'
}

// 获取空状态文本
const getEmptyText = () => {
  if (activeTab.value === 'lost') {
    return '暂无寻物启事'
  } else if (activeTab.value === 'found') {
    return '暂无招领启事'
  } else {
    return '暂无失物招领信息'
  }
}

// 跳转到详情页
const goToDetail = (id) => {
  router.push(`/lost-found/detail/${id}`)
}

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = '/placeholder.png'
}

// 处理空状态操作
const handleEmptyAction = () => {
  emit('emptyAction', activeTab.value)
}

// 加载更多数据
const loadMore = () => {
  if (loading.value || loadingMore.value || !hasMore.value) return
  
  page.value++
  fetchItems(true)
}

// 刷新列表
const refresh = () => {
  page.value = 1
  items.value = []
  hasMore.value = true
  fetchItems()
}

// 监听用户ID变化，重新获取数据
watch(() => props.userId, () => {
  page.value = 1
  items.value = []
  hasMore.value = true
  fetchItems()
})

watch(() => props.defaultTab, (newVal) => {
  if (newVal !== activeTab.value) {
    switchTab(newVal)
  }
})

// 上拉加载更多处理
let scrollListener = null
const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
  const clientHeight = document.documentElement.clientHeight || window.innerHeight
  
  // 距离底部100px时加载更多
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMore()
  }
}

onMounted(() => {
  fetchItems()
  
  // 添加滚动监听
  scrollListener = window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  // 移除滚动监听
  if (scrollListener) {
    window.removeEventListener('scroll', handleScroll)
  }
})

// 暴露方法给父组件
defineExpose({
  refresh,
  switchTab
})
</script>