<template>
  <div class="image-analyzer" :class="{ 'is-active': isActive }">
    <div class="analyzer-button" @click="toggleAnalyzer">
      <van-icon name="bulb-o" :color="isActive ? '#1989fa' : '#969799'" size="20" />
      <span>AI 助手</span>
    </div>

    <div class="analyzer-panel" v-if="isActive">
      <div class="panel-header">
        <div class="panel-title">AI 图片分析</div>
        <van-icon name="cross" @click="isActive = false" />
      </div>

      <div class="panel-content">
        <div v-if="isAnalyzing" class="analyzing-state">
          <van-loading type="spinner" color="#1989fa" />
          <span>图片分析中...</span>
        </div>

        <div v-else-if="!hasImage" class="no-image-state">
          <van-icon name="photo-o" size="48" color="#c8c9cc" />
          <p>请先上传图片以获取AI分析</p>
        </div>

        <div v-else-if="analysisResult" class="result-state">
          <div class="result-section">
            <div class="section-title">图片描述</div>
            <div class="description-content">{{ analysisResult.description }}</div>
          </div>

          <div class="result-section">
            <div class="section-title">推荐标题</div>
            <div class="title-suggestions">
              <div 
                v-for="(title, index) in analysisResult.titleSuggestions" 
                :key="index"
                class="title-item"
                @click="selectTitle(title)"
              >
                {{ title }}
              </div>
            </div>
          </div>

          <div class="result-section">
            <div class="section-title">推荐标签</div>
            <div class="tag-suggestions">
              <div 
                v-for="(tag, index) in analysisResult.tags" 
                :key="index"
                class="tag-item"
                @click="selectTag(tag)"
              >
                {{ tag }}
              </div>
            </div>
          </div>

          <div class="result-section" v-if="analysisResult.priceEstimate">
            <div class="section-title">参考价格</div>
            <div class="price-estimate">
              ¥{{ analysisResult.priceEstimate.min }} - ¥{{ analysisResult.priceEstimate.max }}
            </div>
          </div>
        </div>

        <div v-else class="error-state">
          <van-icon name="warning-o" size="48" color="#ee0a24" />
          <p>图片分析失败，请重试</p>
          <van-button size="small" type="primary" @click="analyzeImages">重新分析</van-button>
        </div>
      </div>

      <div class="panel-footer" v-if="analysisResult">
        <van-button block type="primary" @click="applyAllSuggestions">
          一键应用所有建议
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  active: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:active',
  'select-title', 
  'select-tag', 
  'select-price',
  'apply-all'
])

const isActive = ref(props.active)
const isAnalyzing = ref(false)
const analysisResult = ref(null)
const error = ref(null)

// 监听active属性变化
watch(() => props.active, (newValue) => {
  isActive.value = newValue
})

// 监听isActive变化，向父组件同步
watch(isActive, (newValue) => {
  emit('update:active', newValue)
  if (newValue && props.images.length > 0 && !analysisResult.value) {
    analyzeImages()
  }
})

// 监听图片变化
watch(() => props.images, (newImages) => {
  if (newImages.length > 0 && isActive.value) {
    analyzeImages()
  } else if (newImages.length === 0) {
    // 重置分析结果
    analysisResult.value = null
  }
}, { deep: true })

const hasImage = computed(() => props.images && props.images.length > 0)

// 切换分析器显示状态
const toggleAnalyzer = () => {
  isActive.value = !isActive.value
}

// 分析图片
const analyzeImages = async () => {
  if (!hasImage.value) {
    showToast('请先上传图片')
    return
  }

  try {
    isAnalyzing.value = true
    error.value = null

    // 模拟AI分析过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟分析结果
    const firstImageUrl = props.images[0].url
    analysisResult.value = mockAnalysisResult(firstImageUrl)

    isAnalyzing.value = false
  } catch (err) {
    console.error('图片分析失败:', err)
    error.value = err.message || '分析失败'
    isAnalyzing.value = false
  }
}

// 选择推荐标题
const selectTitle = (title) => {
  emit('select-title', title)
  showToast('已应用标题')
}

// 选择推荐标签
const selectTag = (tag) => {
  emit('select-tag', tag)
  showToast('已添加标签')
}

// 应用所有建议
const applyAllSuggestions = () => {
  if (!analysisResult.value) return

  emit('apply-all', {
    title: analysisResult.value.titleSuggestions[0],
    tags: analysisResult.value.tags,
    price: analysisResult.value.priceEstimate ? 
      Math.floor((analysisResult.value.priceEstimate.min + analysisResult.value.priceEstimate.max) / 2) : 
      undefined,
    description: analysisResult.value.description
  })

  showToast('已应用所有建议')
}

// 模拟分析结果（实际项目中应替换为真实API调用）
const mockAnalysisResult = (imageUrl) => {
  const results = {
    description: '这是一款状态良好的二手iPhone手机，机身无明显划痕，边框轻微磨损，显示屏完好。配有原装充电器和耳机，适合追求性价比的用户。',
    titleSuggestions: [
      '95新 Apple iPhone 二手手机 外观完好 功能正常',
      '二手iPhone 128G 深空灰 成色新 无拆修',
      '低价转让 iPhone 二手机 原装配件齐全'
    ],
    tags: ['手机', 'iPhone', '二手电子', '95新', '原装配件'],
    priceEstimate: {
      min: 1800,
      max: 2500
    }
  }

  // 根据图片URL模拟不同的结果（实际项目中应删除此逻辑）
  if (imageUrl.includes('book') || imageUrl.includes('text')) {
    return {
      description: '这是一本品相良好的二手书籍，书角略有磨损，内页干净无笔记，适合爱书人士收藏。',
      titleSuggestions: [
        '九成新 畅销小说 无划线无笔记',
        '二手图书 经典文学作品 品相佳',
        '特价处理 正版书籍 仅阅读一次'
      ],
      tags: ['书籍', '二手书', '文学', '小说', '品相好'],
      priceEstimate: {
        min: 15,
        max: 45
      }
    }
  } else if (imageUrl.includes('clothing') || imageUrl.includes('wear')) {
    return {
      description: '这是一件时尚的二手服装，面料舒适，款式新颖，仅穿着过几次，无明显瑕疵，非常适合日常搭配。',
      titleSuggestions: [
        '95新 时尚服饰 男女可穿 尺码M',
        '仅穿几次 品牌服装 原价299',
        '闲置服饰 面料舒适 无瑕疵'
      ],
      tags: ['服装', '二手衣物', '时尚', '舒适', '九成新'],
      priceEstimate: {
        min: 50,
        max: 120
      }
    }
  }

  return results
}
</script>