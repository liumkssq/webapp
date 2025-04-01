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
      router.push('/publish/article')
      break
    case 'product':
      router.push('/publish/product')
      break
    case 'lost-found':
      router.push('/publish/lost-found')
      break
    default:
      // 默认发布商品
      router.push('/publish/product')
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

<style scoped>
.publish-selector-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f7f8fa;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.publish-header {
  margin-bottom: 32px;
  text-align: center;
  padding-top: 12px;
}

.publish-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: #000;
  margin: 0;
  letter-spacing: -0.5px;
}

.publish-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.option-item::after {
  content: "→";
  position: absolute;
  right: 16px;
  color: #8e8e93;
  font-size: 18px;
  opacity: 0.7;
}

.option-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  background-color: #f9f9f9;
}

.option-icon {
  width: 54px;
  height: 54px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  margin-right: 16px;
  flex-shrink: 0;
}

.option-item:nth-child(1) .option-icon {
  background-color: #ffede3;
  color: #ff9500;
}

.option-item:nth-child(2) .option-icon {
  background-color: #e2f7e8;
  color: #32d74b;
}

.option-item:nth-child(3) .option-icon {
  background-color: #e5efff;
  color: #007aff;
}

.option-content {
  flex: 1;
  padding-right: 20px;
}

.option-content h3 {
  font-size: 17px;
  font-weight: 600;
  color: #000;
  margin: 0 0 4px 0;
}

.option-content p {
  font-size: 14px;
  color: #8e8e93;
  margin: 0;
  line-height: 1.4;
}

.ai-assistant {
  background-color: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.ai-assistant::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(10, 132, 255, 0.1) 100%);
  z-index: 0;
}

.ai-assistant::after {
  content: "→";
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #007aff;
  font-size: 18px;
  opacity: 0.7;
}

.assistant-title {
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.assistant-title h3 {
  font-size: 17px;
  font-weight: 600;
  color: #007aff;
  margin: 0;
  display: flex;
  align-items: center;
}

.assistant-title h3::before {
  content: "AI";
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: #007aff;
  color: white;
  font-size: 14px;
  margin-right: 8px;
}

.assistant-content {
  position: relative;
  z-index: 1;
}

.assistant-content p {
  font-size: 14px;
  color: #3a3a3c;
  margin: 0;
}

.back-btn {
  background-color: #f2f2f7;
  border-radius: 12px;
  padding: 14px 0;
  text-align: center;
  font-weight: 500;
  font-size: 16px;
  color: #007aff;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.back-btn:active {
  background-color: #e5e5ea;
}

/* 动画效果 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.option-item, .ai-assistant, .back-btn {
  animation: slideUp 0.3s ease-out forwards;
}

.option-item:nth-child(1) {
  animation-delay: 0.1s;
}

.option-item:nth-child(2) {
  animation-delay: 0.2s;
}

.option-item:nth-child(3) {
  animation-delay: 0.3s;
}

.ai-assistant {
  animation-delay: 0.4s;
}

.back-btn {
  animation-delay: 0.5s;
}

/* 暗黑模式适配 */
@media (prefers-color-scheme: dark) {
  .publish-selector-container {
    background-color: #000;
  }
  
  .publish-header h2 {
    color: #fff;
  }
  
  .option-item {
    background-color: #1c1c1e;
  }
  
  .option-item:active {
    background-color: #2c2c2e;
  }
  
  .option-content h3 {
    color: #fff;
  }
  
  .ai-assistant {
    background-color: #1c1c1e;
  }
  
  .ai-assistant::before {
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(10, 132, 255, 0.15) 100%);
  }
  
  .assistant-content p {
    color: #d1d1d6;
  }
  
  .back-btn {
    background-color: #2c2c2e;
    color: #0a84ff;
  }
  
  .back-btn:active {
    background-color: #3a3a3c;
  }
}
</style>