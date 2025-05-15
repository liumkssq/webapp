<template>
  <div class="image-analyzer">
    <div class="analyzer-header">
      <div class="title">AI图片分析结果</div>
      <div class="close-btn" @click="$emit('close')">
        <i class="icon-close"></i>
      </div>
    </div>
    
    <div class="analyzer-content" v-if="!loading">
      <!-- 图片列表 -->
      <div class="images-preview">
        <div 
          v-for="(image, index) in images" 
          :key="index"
          class="image-item"
        >
          <img :src="image.url" :alt="`图片${index+1}`" class="preview-image">
        </div>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="hasError" class="error-message">
        <div class="error-icon">⚠️</div>
        <div class="error-text">{{ errorMessage }}</div>
        <div class="error-tip">您仍然可以查看部分结果，但准确性可能受影响</div>
      </div>
      
      <!-- 分析结果 -->
      <div class="analysis-result">
        <!-- 标题建议 -->
        <div class="result-section">
          <div class="section-header">
            <div class="section-title">推荐标题</div>
            <button class="use-btn" @click="selectTitle(analysisResult.title)">使用</button>
          </div>
          <div class="section-content">
            {{ analysisResult.title || '无法生成标题' }}
          </div>
        </div>
        
        <!-- 描述建议 -->
        <div class="result-section">
          <div class="section-header">
            <div class="section-title">推荐描述</div>
            <button class="use-btn" @click="selectDescription(analysisResult.description)">使用</button>
          </div>
          <div class="section-content description">
            {{ analysisResult.description || '无法生成描述' }}
          </div>
        </div>
        
        <!-- 标签建议 -->
        <div class="result-section">
          <div class="section-header">
            <div class="section-title">推荐标签</div>
          </div>
          <div class="section-content tags">
            <template v-if="analysisResult.tags && analysisResult.tags.length > 0">
              <div 
                v-for="(tag, index) in analysisResult.tags" 
                :key="index"
                class="tag-item"
                @click="selectTag(tag)"
              >
                {{ tag }}
              </div>
            </template>
            <div v-else class="no-tags">
              无法生成标签
            </div>
          </div>
        </div>
        
        <!-- 综合分析 -->
        <div class="result-section">
          <div class="section-header">
            <div class="section-title">综合分析</div>
          </div>
          <div class="section-content analysis">
            {{ analysisResult.analysis || '无法生成分析' }}
          </div>
        </div>
      </div>
      
      <!-- 应用全部按钮 -->
      <div class="apply-all-btn" @click="applyAll">
        应用全部建议
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <div class="loading-text">AI正在分析图片中...</div>
      <div class="loading-tip">图片分析可能需要10-15秒，请耐心等待</div>
    </div>
  </div>
</template>

<script setup>
import { showToast } from 'vant';
import { defineEmits, defineProps, onMounted, ref } from 'vue';

// 定义属性
const props = defineProps({
  images: {
    type: Array,
    default: () => []
  }
});

// 定义事件
const emit = defineEmits(['select-title', 'select-description', 'select-tag', 'apply-all', 'close']);

// 组件状态
const loading = ref(true);
const analysisResult = ref({
  title: '',
  description: '',
  tags: [],
  analysis: ''
});

// 错误状态
const hasError = ref(false);
const errorMessage = ref('');

// 方法
const selectTitle = (title) => {
  if (title) {
    emit('select-title', title);
    showToast('标题已应用');
  }
};

const selectDescription = (description) => {
  if (description) {
    emit('select-description', description);
    showToast('描述已应用');
  }
};

const selectTag = (tag) => {
  if (tag) {
    emit('select-tag', tag);
    showToast(`标签"${tag}"已添加`);
  }
};

const applyAll = () => {
  if (analysisResult.value) {
    emit('apply-all', analysisResult.value);
    showToast('已应用全部建议');
  }
};

// 图片分析过程
onMounted(async () => {
  console.log("ImageAnalyzer: 开始分析图片...", props.images);
  if (!props.images || props.images.length === 0) {
    hasError.value = true;
    errorMessage.value = '没有可用的图片进行分析';
    loading.value = false;
    return;
  }
  
  try {
    // 确保图片有URL
    if (!props.images.some(img => img.url)) {
      throw new Error('图片缺少URL');
    }
    
    loading.value = true;
    hasError.value = false;
    
    // 导入AI图片分析函数
    const { analyzeImages } = await import('@/utils/aiAssist');
    
    // 分析图片
    console.log("ImageAnalyzer: 调用analyzeImages API...");
    const result = await analyzeImages(props.images);
    console.log("ImageAnalyzer: 分析完成，结果:", result);
    
    // 检查结果是否有错误
    if (result.error) {
      throw new Error(result.error);
    }
    
    // 确保结果中包含所有必需的字段
    if (!result.title || !result.description || !Array.isArray(result.tags)) {
      console.warn("ImageAnalyzer: 分析结果格式不完整", result);
      // 补充可能缺少的字段
      result.title = result.title || "AI分析（无法识别物品）";
      result.description = result.description || "无法提取有效描述";
      result.tags = Array.isArray(result.tags) ? result.tags : [];
      result.analysis = result.analysis || "无法提供分析";
    }
    
    // 更新结果
    analysisResult.value = result;
  } catch (error) {
    console.error('ImageAnalyzer: 图片分析失败:', error);
    hasError.value = true;
    errorMessage.value = error.message || '分析图片时发生错误';
    
    // 提供备用结果，避免界面崩溃
    analysisResult.value = {
      title: '无法分析图片',
      description: '很抱歉，AI无法分析您的图片。可能是因为图片格式不支持或服务暂时不可用。',
      tags: ['分析失败'],
      analysis: `分析失败：${error.message || '未知错误'}`
    };
  } finally {
    loading.value = false;
    console.log("ImageAnalyzer: 分析过程结束，loading状态:", loading.value);
  }
});
</script>

<style scoped>
.image-analyzer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.analyzer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f5f5f5;
}

.icon-close::before {
  content: "×";
  font-size: 20px;
}

.analyzer-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.images-preview {
  display: flex;
  overflow-x: auto;
  padding-bottom: 12px;
  gap: 10px;
  margin-bottom: 16px;
}

.image-item {
  flex: 0 0 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.error-message {
  background-color: rgba(255, 59, 48, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.error-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.error-text {
  font-size: 14px;
  font-weight: 500;
  color: #ff3b30;
  margin-bottom: 4px;
}

.error-tip {
  font-size: 12px;
  color: #999;
}

.analysis-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-section {
  background-color: #f5f7fa;
  border-radius: 12px;
  padding: 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-weight: 600;
  color: #333;
}

.use-btn {
  padding: 4px 8px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.use-btn:active {
  opacity: 0.8;
}

.section-content {
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

.description, .analysis {
  max-height: 120px;
  overflow-y: auto;
  white-space: pre-line;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  padding: 6px 12px;
  background-color: rgba(var(--primary-rgb), 0.1);
  color: var(--primary-color);
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
}

.tag-item:active {
  background-color: rgba(var(--primary-rgb), 0.2);
}

.no-tags {
  font-style: italic;
  color: #999;
}

.apply-all-btn {
  margin-top: 20px;
  margin-bottom: 10px;
  padding: 12px;
  background-color: var(--primary-color);
  color: white;
  text-align: center;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.apply-all-btn:active {
  opacity: 0.9;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(var(--primary-rgb), 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.loading-tip {
  font-size: 14px;
  color: #999;
  text-align: center;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .image-analyzer {
    background-color: #1c1c1e;
  }
  
  .analyzer-header {
    border-bottom-color: #38383a;
  }
  
  .title {
    color: #fff;
  }
  
  .close-btn {
    background-color: #2c2c2e;
  }
  
  .result-section {
    background-color: #2c2c2e;
  }
  
  .section-title {
    color: #fff;
  }
  
  .section-content {
    color: #ccc;
  }
  
  .no-tags {
    color: #777;
  }
  
  .loading-text {
    color: #eee;
  }
  
  .loading-tip {
    color: #777;
  }
  
  .error-message {
    background-color: rgba(255, 59, 48, 0.15);
  }
}
</style>