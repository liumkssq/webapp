<template>
  <div class="ai-assist-page">
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
      <div class="nav-title">AI助手</div>
    </div>
    
    <!-- AI助手内容 -->
    <div class="ai-container">
      <div class="ai-header">
        <div class="ai-avatar">
          <img src="https://via.placeholder.com/80" alt="AI助手" class="avatar-img">
        </div>
        <div class="ai-title">
          <h3>智能创作助手</h3>
          <p>帮您提升内容质量，优化创作体验</p>
        </div>
      </div>
      
      <!-- 功能选择 -->
      <div class="feature-grid">
        <div class="feature-card" @click="useFeature('content-generation')">
          <div class="feature-icon">
            <i class="icon-magic"></i>
          </div>
          <div class="feature-title">内容生成</div>
          <div class="feature-desc">自动生成高质量文章、描述</div>
        </div>
        
        <div class="feature-card" @click="useFeature('image-enhance')">
          <div class="feature-icon">
            <i class="icon-image"></i>
          </div>
          <div class="feature-title">图片增强</div>
          <div class="feature-desc">优化图片效果，提升质量</div>
        </div>
        
        <div class="feature-card" @click="useFeature('text-polish')">
          <div class="feature-icon">
            <i class="icon-edit"></i>
          </div>
          <div class="feature-title">文本润色</div>
          <div class="feature-desc">提高表达质量，修正语法</div>
        </div>
        
        <div class="feature-card" @click="useFeature('title-generator')">
          <div class="feature-icon">
            <i class="icon-title"></i>
          </div>
          <div class="feature-title">标题生成</div>
          <div class="feature-desc">生成吸引人的标题</div>
        </div>
        
        <div class="feature-card" @click="useFeature('price-suggest')">
          <div class="feature-icon">
            <i class="icon-price"></i>
          </div>
          <div class="feature-title">价格建议</div>
          <div class="feature-desc">智能分析合理定价</div>
        </div>
        
        <div class="feature-card" @click="useFeature('lost-found-assistant')">
          <div class="feature-icon">
            <i class="icon-help"></i>
          </div>
          <div class="feature-title">寻物助手</div>
          <div class="feature-desc">高效描述失物招领信息</div>
        </div>
      </div>
      
      <!-- 使用记录 -->
      <div class="usage-history">
        <div class="section-title">
          <h3>最近使用</h3>
          <span class="view-all" @click="viewAllHistory">查看全部</span>
        </div>
        
        <div class="history-list" v-if="usageHistory.length > 0">
          <div 
            v-for="(item, index) in usageHistory" 
            :key="index" 
            class="history-item"
            @click="continueSession(item)"
          >
            <div class="history-icon">
              <i :class="`icon-${item.type}`"></i>
            </div>
            <div class="history-info">
              <div class="history-title">{{ item.title }}</div>
              <div class="history-time">{{ formatTime(item.time) }}</div>
            </div>
            <div class="history-arrow">
              <i class="icon-arrow-right"></i>
            </div>
          </div>
        </div>
        
        <div class="empty-history" v-else>
          <div class="empty-icon">
            <i class="icon-empty"></i>
          </div>
          <div class="empty-text">暂无使用记录</div>
        </div>
      </div>
      
      <!-- 使用提示 -->
      <div class="usage-tips">
        <div class="tip-title">使用小贴士</div>
        <div class="tip-content">
          <p>• 每日免费使用次数：5次</p>
          <p>• 内容生成后可以自由编辑</p>
          <p>• 优质的提示语能产出更好的结果</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 使用记录
const usageHistory = ref([
  {
    type: 'content-generation',
    title: '二手iPhone描述生成',
    time: new Date(Date.now() - 3600000 * 2) // 2小时前
  },
  {
    type: 'text-polish',
    title: '失物招领文本润色',
    time: new Date(Date.now() - 3600000 * 5) // 5小时前
  },
  {
    type: 'title-generator',
    title: '笔记本电脑标题优化',
    time: new Date(Date.now() - 86400000) // 1天前
  }
])

// 使用AI功能
const useFeature = (featureType) => {
  router.push(`/ai/${featureType}`)
}

// 查看全部历史
const viewAllHistory = () => {
  router.push('/ai/history')
}

// 继续上次会话
const continueSession = (sessionData) => {
  router.push(`/ai/${sessionData.type}?id=${Date.now()}`)
}

// 格式化时间
const formatTime = (time) => {
  const now = new Date()
  const diffMs = now - time
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffDay > 0) {
    return `${diffDay}天前`
  } else if (diffHour > 0) {
    return `${diffHour}小时前`
  } else if (diffMin > 0) {
    return `${diffMin}分钟前`
  } else {
    return '刚刚'
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>