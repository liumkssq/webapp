<template>
  <div class="publish-selector-container">
    <div class="publish-header">
      <h2>选择发布类型</h2>
    </div>
    
    <div class="publish-options">
      <div class="option-item" @click="selectPublishType('product')">
        <div class="option-icon">商品</div>
        <div class="option-content">
          <h3>发布二手商品</h3>
          <p>出售您的闲置物品，让它们找到新主人</p>
        </div>
      </div>
      
      <div class="option-item" @click="selectPublishType('lost-found')">
        <div class="option-icon">失物</div>
        <div class="option-content">
          <h3>发布失物招领</h3>
          <p>寻找丢失物品或发布捡到的物品信息</p>
        </div>
      </div>
      
      <div class="option-item" @click="selectPublishType('article')">
        <div class="option-icon">文章</div>
        <div class="option-content">
          <h3>发布文章</h3>
          <p>分享您的经验、想法和故事</p>
        </div>
      </div>
    </div>
    
    <div class="ai-assistant">
      <div class="assistant-title">
        <h3>AI助手</h3>
      </div>
      <div class="assistant-content" @click="goToAIAssist">
        <p>让AI帮助您创建更优质的内容</p>
      </div>
    </div>
    
    <div class="back-btn" @click="goBack">
      <span>返回</span>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 选择发布类型
const selectPublishType = (type) => {
  switch (type) {
    case 'article':
      router.push('/publish-article')
      break
    case 'product':
      router.push('/publish-product')
      break
    case 'lost-found':
      router.push('/publish-lost-found')
      break
    default:
      // 默认发布商品
      router.push('/publish-product')
  }
}

// 跳转到AI助手
const goToAIAssist = () => {
  router.push('/ai/assist')
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>