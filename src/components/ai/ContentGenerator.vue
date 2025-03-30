<template>
  <div class="content-generator">
    <div class="generator-header">
      <div class="title">AI内容生成器</div>
      <van-icon name="cross" @click="$emit('close')" />
    </div>

    <div class="generator-body">
      <div class="generator-input">
        <div class="input-label">生成提示</div>
        <div class="input-wrapper">
          <textarea
            v-model="prompt"
            placeholder="描述你想要生成的内容，例如：'生成一段二手MacBook Pro的详细描述，强调其性能和成色'"
            rows="3"
          ></textarea>
        </div>
      </div>

      <div class="generation-type">
        <div class="type-label">生成类型</div>
        <div class="type-options">
          <div 
            class="type-option" 
            :class="{ active: type === 'description' }" 
            @click="type = 'description'"
          >
            <van-icon name="description" :color="type === 'description' ? '#1989fa' : '#969799'" />
            <span>商品描述</span>
          </div>
          <div 
            class="type-option" 
            :class="{ active: type === 'title' }" 
            @click="type = 'title'"
          >
            <van-icon name="label-o" :color="type === 'title' ? '#1989fa' : '#969799'" />
            <span>商品标题</span>
          </div>
          <div 
            class="type-option" 
            :class="{ active: type === 'tags' }" 
            @click="type = 'tags'"
          >
            <van-icon name="bookmark-o" :color="type === 'tags' ? '#1989fa' : '#969799'" />
            <span>标签生成</span>
          </div>
        </div>
      </div>

      <div class="generator-controls">
        <van-button 
          block 
          type="primary" 
          @click="generateContent" 
          :loading="isGenerating"
          :disabled="!canGenerate"
        >
          {{ isGenerating ? '生成中...' : '生成内容' }}
        </van-button>
      </div>

      <div v-if="generatedContent" class="generated-content">
        <div class="content-header">
          <div class="content-title">生成结果</div>
          <div class="content-actions">
            <van-button size="mini" plain type="primary" @click="regenerateContent">
              <van-icon name="replay" /> 重新生成
            </van-button>
            <van-button size="mini" type="primary" @click="useContent">
              <van-icon name="success" /> 使用
            </van-button>
          </div>
        </div>

        <div class="content-preview">
          <template v-if="type === 'description'">
            <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
          </template>
          
          <template v-else-if="type === 'title'">
            <div class="title-preview">{{ generatedContent }}</div>
          </template>
          
          <template v-else-if="type === 'tags'">
            <div class="tags-preview">
              <span 
                v-for="(tag, index) in tags" 
                :key="index" 
                class="tag-item"
              >
                {{ tag }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  initialPrompt: {
    type: String,
    default: ''
  },
  productInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'use-content'])

// 内容生成状态
const prompt = ref(props.initialPrompt)
const type = ref('description')
const isGenerating = ref(false)
const generatedContent = ref('')

// 计算属性
const canGenerate = computed(() => prompt.value.trim().length > 0)

const paragraphs = computed(() => {
  if (!generatedContent.value || type.value !== 'description') return []
  return generatedContent.value.split('\n').filter(p => p.trim().length > 0)
})

const tags = computed(() => {
  if (!generatedContent.value || type.value !== 'tags') return []
  return generatedContent.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
})

// 生成内容
const generateContent = async () => {
  if (!canGenerate.value) return
  
  try {
    isGenerating.value = true
    
    // 模拟AI生成过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 根据类型生成不同内容
    generatedContent.value = generateMockContent()
    
    isGenerating.value = false
  } catch (error) {
    console.error('内容生成失败:', error)
    showToast('内容生成失败，请重试')
    isGenerating.value = false
  }
}

// 重新生成内容
const regenerateContent = () => {
  generateContent()
}

// 使用生成的内容
const useContent = () => {
  emit('use-content', {
    content: generatedContent.value,
    type: type.value
  })
  showToast('内容已应用')
}

// 模拟生成内容（实际项目中应替换为真实API调用）
const generateMockContent = () => {
  const productType = props.productInfo.category || ''
  const condition = props.productInfo.condition || ''
  
  // 根据不同类型返回不同内容
  if (type.value === 'description') {
    if (productType.includes('手机') || prompt.value.includes('手机')) {
      return `这款二手手机保存完好，外观接近全新，仅有轻微使用痕迹，不影响美观。\n\n屏幕无划痕，显示效果清晰锐利，色彩还原准确。电池健康度保持在90%以上，续航能力强。\n\n系统已重置至出厂设置，运行流畅无卡顿。所有功能正常工作，包括摄像头、扬声器和各种传感器。\n\n随机附送原装充电器和数据线，保修卡和发票已遗失。出售原因是已购入新机型，特此转让给需要的朋友。`
    } else if (productType.includes('电脑') || prompt.value.includes('电脑') || prompt.value.includes('笔记本')) {
      return `这台二手笔记本电脑性能强劲，配置为i7处理器、16GB内存和512GB固态硬盘，能够流畅运行各类办公和设计软件。\n\n外观保养得当，机身干净整洁，键盘按键回弹良好，无异响。屏幕显示效果出色，色彩准确，无坏点和亮点。\n\n电池循环次数较少，单次充电可持续使用约5-6小时。系统已重装，运行稳定高效。\n\n随机附送原装电源适配器和笔记本内胆包。因工作需要升级更高配置设备，故出售此机。`
    } else {
      return `这件二手商品保存完好，外观接近${condition}，仅有极少量使用痕迹，整体状态优良。\n\n商品所有功能均正常工作，性能稳定可靠，使用感受与新品相差无几。\n\n商品曾经在正规渠道购买，质量有保证。因个人闲置，现低价转让，希望能找到合适的新主人。\n\n如有任何疑问，欢迎随时咨询，可提供更多细节图片和使用视频。`
    }
  } else if (type.value === 'title') {
    if (productType.includes('手机') || prompt.value.includes('手机')) {
      return `95新 全网通 智能手机 大内存 长续航 功能完好 无拆修`
    } else if (productType.includes('电脑') || prompt.value.includes('电脑') || prompt.value.includes('笔记本')) {
      return `9成新 高配笔记本电脑 i7处理器 16G内存 512G固态 性能强劲`
    } else {
      return `${condition}二手商品 品质保证 功能完好 低价转让 诚信交易`
    }
  } else if (type.value === 'tags') {
    if (productType.includes('手机') || prompt.value.includes('手机')) {
      return `二手手机,智能手机,高性价比,95新,全网通,大内存,长续航,无拆修`
    } else if (productType.includes('电脑') || prompt.value.includes('电脑') || prompt.value.includes('笔记本')) {
      return `二手笔记本,高配置,i7处理器,16G内存,512G固态,性能强劲,轻薄本,办公本`
    } else {
      return `二手商品,闲置转让,${condition}成色,品质保证,低价出售,功能完好,诚信交易`
    }
  }
  
  return ''
}
</script>