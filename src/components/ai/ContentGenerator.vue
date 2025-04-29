<template>
  <div class="content-generator">
    <div class="generator-header">
      <div class="title">{{ headerTitle }}</div>
      <van-icon name="cross" @click="$emit('close')" />
    </div>

    <div class="generator-body">
      <!-- Group 1: Prompt Input -->
      <div class="form-group">
        <div class="input-label">生成提示</div>
        <div class="input-wrapper">
          <textarea
            v-model="prompt"
            :placeholder="promptPlaceholder"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Group 2: Generation Type -->
      <div class="form-group">
        <div class="type-label">{{ generationTypeLabel }}</div>
        <!-- Applying Segmented Control Style -->
        <div class="type-options segmented-control">
          <div 
            class="type-option segment"
            :class="{ active: type === 'description' }" 
            @click="type = 'description'"
          >
            <span>{{ descriptionOptionLabel }}</span>
          </div>
          <div 
            class="type-option segment"
            :class="{ active: type === 'title' }" 
            @click="type = 'title'"
          >
            <span>{{ titleOptionLabel }}</span>
          </div>
          <div 
            class="type-option segment"
            :class="{ active: type === 'tags' }" 
            @click="type = 'tags'"
          >
            <span>{{ tagsOptionLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="generator-controls">
        <!-- Add class for specific styling -->
        <van-button 
          block 
          type="primary" 
          @click="triggerGeneration"
          :loading="isGenerating"
          :disabled="!canGenerate"
          class="generate-button" 
        >
          {{ isGenerating ? '生成中...' : '生成内容' }}
        </van-button>
      </div>

      <!-- Results Area -->
      <div v-if="generationResults[type]" class="generated-content form-group">
        <div class="content-header">
          <div class="content-title">生成结果</div>
          <div class="content-actions">
            <van-button size="small" plain type="primary" @click="triggerGeneration">
              重新生成
            </van-button>
            <van-button size="small" type="primary" @click="useContent">
              <van-icon name="success" /> 使用
            </van-button>
          </div>
        </div>

        <div class="content-preview">
          <template v-if="type === 'description'">
            <div v-html="formattedDescription"></div>
          </template>
          <template v-else-if="type === 'title'">
            <div class="title-preview">{{ generationResults[type] }}</div>
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
import { generateContent as aiGenerateContent } from '@/utils/aiAssist.js';
import { showToast } from 'vant';
import { computed, reactive, ref } from 'vue';

const props = defineProps({
  initialPrompt: {
    type: String,
    default: ''
  },
  productInfo: {
    type: Object,
    default: () => ({})
  },
  contextType: {
    type: String,
    default: 'product'
  }
})

const emit = defineEmits(['close', 'use-content'])

// State
const prompt = ref(props.initialPrompt)
const type = ref('description') // Default type
const isGenerating = ref(false)

// NEW: Reactive object to store results for each type
const generationResults = reactive({
  description: '',
  title: '',
  tags: ''
});

// Computed properties for dynamic text (remain mostly the same)
const isProductContext = computed(() => props.contextType === 'product');

const headerTitle = computed(() => 
  isProductContext.value ? 'AI 商品内容助手' : 'AI 启事内容助手'
);

const generationTypeLabel = computed(() => 
  isProductContext.value ? '生成商品内容' : '生成启事内容'
);

const descriptionOptionLabel = computed(() => 
  isProductContext.value ? '商品描述' : '启事描述'
);

const titleOptionLabel = computed(() => 
  isProductContext.value ? '商品标题' : '启事标题'
);

const tagsOptionLabel = computed(() => 
  isProductContext.value ? '相关标签' : '关键词'
);

const promptPlaceholder = computed(() => 
  isProductContext.value 
    ? "描述你想要生成的内容，例如：'生成一段二手MacBook Pro的详细描述，强调其性能和成色'"
    : "描述你想要生成的内容，例如：'生成一个失物招领启事，物品是图书馆丢失的黑色背包'"
);

// Computed properties for displaying results (Updated)
const paragraphs = computed(() => {
  // Read from the correct property based on current type
  const content = generationResults[type.value];
  if (!content || type.value !== 'description') return []
  return content.split(/\r?\n/g).filter(p => p.trim().length > 0)
})

const tags = computed(() => {
  // Read from the correct property based on current type
  const content = generationResults[type.value];
  if (!content || type.value !== 'tags') return []
  return content.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
})

const formattedDescription = computed(() => {
  // Read from the correct property based on current type
  const content = generationResults[type.value];
  if (!content || type.value !== 'description') return ''
  return content.replace(/\r?\n/g, '<br>');
});

// Computed: Can generate?
const canGenerate = computed(() => prompt.value.trim().length > 0 && !isGenerating.value)

// Trigger AI Generation (Updated)
const triggerGeneration = async () => {
  if (!prompt.value.trim()) {
    showToast('请输入生成提示');
    return;
  }
  
  try {
    isGenerating.value = true;
    const currentType = type.value; // Capture the type for this generation
    generationResults[currentType] = ''; // Clear previous result for this type
    
    const result = await aiGenerateContent({
      contentType: currentType, // Use captured type
      context: { 
        ...props.productInfo,
        contextType: props.contextType,
        prompt: prompt.value 
      } 
    });
    
    generationResults[currentType] = result; // Store result in the correct property
    
  } catch (error) {
    console.error('AI 内容生成失败:', error);
    const currentType = type.value; // Need type again for error case
    generationResults[currentType] = '生成失败，请重试。'; // Store error in correct property
    showToast(error.message || 'AI 助手出错了，请稍后再试');
  } finally {
    isGenerating.value = false;
  }
}

// Use Generated Content (Updated)
const useContent = () => {
  const currentType = type.value; // Use the currently selected type
  const contentToUse = generationResults[currentType];

  if (!contentToUse || contentToUse === '生成失败，请重试。') {
      showToast('没有可使用的内容');
      return;
  }
  emit('use-content', {
    content: contentToUse,
    type: currentType
  })
  showToast('内容已应用')
}
</script>

<style scoped>
/* Base styles */
/* Apply box-sizing universally within this component for safety */
.content-generator :deep(*) {
  box-sizing: border-box;
}

.content-generator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f2f2f7; /* iOS system background */
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
}

.generator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px; /* Slightly reduced padding */
  height: 50px; /* iOS Header height */
  border-bottom: 0.5px solid #c6c6c8; /* iOS thin border */
  background-color: #f7f7f7;
  position: sticky; /* Make header sticky */
  top: 0;
  z-index: 10;
}

.generator-header .title {
  font-size: 17px;
  font-weight: 600;
  color: #1c1c1e;
}

.generator-header .van-icon {
  font-size: 24px;
  color: #007aff; /* iOS blue for interactive elements */
  cursor: pointer;
}

.generator-body {
  flex: 1;
  padding: 16px 0; /* Remove horizontal padding, groups will handle it */
  overflow-y: auto;
  overflow-x: hidden; /* Prevent horizontal scroll */
  -webkit-overflow-scrolling: touch;
}

/* Form Group Styling (iOS Card/List style) */
.form-group {
  background-color: white;
  border-radius: 10px;
  margin: 0 5px 20px 5px; /* Minimized horizontal margin */
  padding: 12px 5px; /* Keep minimal horizontal padding */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  box-sizing: border-box; 
  max-width: 100%; /* Ensure it doesn't exceed container */
}

.generator-input,
.generation-type,
.generated-content {
  margin-bottom: 0; /* Remove margin as .form-group handles spacing */
}

.input-label,
.type-label,
.content-title {
  font-size: 16px; /* Slightly larger label */
  font-weight: 500;
  color: #1c1c1e; /* iOS primary text */
  margin-bottom: 12px;
  padding-top: 4px; /* Add a bit space on top */
}

.input-wrapper textarea {
  width: 100%;
  padding: 10px 0; /* Remove horizontal padding, rely on group padding */
  border: none; /* Remove border */
  border-radius: 0;
  font-size: 16px;
  line-height: 1.5;
  background-color: white;
  resize: none;
  box-shadow: none; /* Remove inset shadow */
  min-height: 60px; /* Ensure decent height */
  color: #1c1c1e;
  box-sizing: border-box;
  word-break: break-all; /* Add word break */
}

.input-wrapper textarea:focus {
  border-color: transparent; /* No border highlight */
  box-shadow: none;
  outline: none;
}

/* Segmented Control Style for Type Options */
.segmented-control {
  display: flex;
  width: 100%;
  border: 1px solid #007aff; /* iOS blue border */
  border-radius: 8px;
  overflow: hidden;
  background-color: transparent; /* Remove grey background */
  padding: 0; /* Remove padding */
  gap: 0; /* No gap */
  box-sizing: border-box;
}

.segment {
  flex: 1;
  padding: 8px 2px; /* Further reduced horizontal padding */
  border-right: 1px solid #007aff; /* Separator */
  background-color: white;
  color: #007aff;
  font-size: 14px; /* Slightly smaller font */
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
  text-align: center;
  /* white-space: nowrap; */ /* Prevent wrapping - REMOVED */
  border-radius: 0;
  box-shadow: none;
  box-sizing: border-box;
  min-width: 0; /* Allow flex item to shrink fully */
}

.segment:last-child {
  border-right: none; /* No border on the last item */
}

.segment.active {
  background-color: #007aff; /* Active segment background */
  color: white;
}

.segment .van-icon {
 display: none; /* Hide icons in segmented control */
}

/* Controls */
.generator-controls {
  padding: 0 16px; /* Add horizontal padding */
  margin-top: 20px; /* Add margin above button */
}

.generate-button.van-button {
  border-radius: 10px;
  font-weight: 500;
  height: 48px; /* Taller button, closer to iOS standard */
  font-size: 17px;
  box-sizing: border-box;
}

/* Generated Content Area */
.generated-content.form-group {
  /* Use form-group styles */
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 0.5px solid #e5e5ea; /* Thinner border */
}

.content-actions {
  display: flex;
  gap: 10px; /* Increased gap */
}

.content-actions .van-button {
  border-radius: 8px;
  /* padding: 4px 10px; */ /* Let small size control padding */
}

.content-preview {
  font-size: 16px;
  line-height: 1.6;
  color: #3c3c43;
  max-height: 300px; /* Increased max height */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: 5px; /* Add space above preview */
  box-sizing: border-box;
  word-break: break-all; /* Add word break */
}

/* Use v-html, so no need for <p> margin adjustments */
/* Remove specific p styling if using v-html */

.title-preview {
  font-weight: 600;
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  background-color: #eef5ff;
  color: #007aff;
  padding: 5px 12px; /* Slightly larger padding */
  border-radius: 14px; /* More rounded */
  font-size: 14px;
  font-weight: 500;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .content-generator {
    background-color: #000000; /* Black background for dark mode */
  }
  .generator-header {
     background-color: #1c1c1e; /* Dark grey header */
     border-bottom-color: #38383a;
  }
  .generator-header .title {
     color: #ffffff;
  }
  .generator-header .van-icon { color: #0a84ff; } /* Brighter blue */
  .form-group {
    background-color: #1c1c1e; /* Dark group background */
    box-shadow: none;
  }
  .input-label, .type-label, .content-title {
     color: #ebebf5; /* Lighter grey text */
  }
  .input-wrapper textarea {
    background-color: #1c1c1e;
    color: #ffffff;
  }
  .segmented-control {
    border-color: #0a84ff;
  }
  .segment {
    background-color: #1c1c1e;
    color: #0a84ff;
    border-right-color: #0a84ff;
  }
  .segment.active {
    background-color: #0a84ff;
    color: #ffffff;
  }
  .generate-button.van-button {
     background-color: #0a84ff;
     border: none;
  }
   .generate-button.van-button--disabled { /* Style disabled button in dark mode */
    background-color: #555;
    opacity: 0.6;
  }
  .generated-content.form-group {
    background-color: #1c1c1e;
    border-color: #38383a;
  }
  .content-header { border-bottom-color: #38383a; }
  .content-preview { color: #ebebf5; }
  .tag-item { 
    background-color: #003579; /* Darker blue */
    color: #d0eaff;
  }
}

/* Add margin to the icon inside the plain primary button in content actions */
.content-actions .van-button--plain.van-button--primary .van-icon {
  margin-right: 3px; 
}

/* Ensure content color for the plain primary button in content actions */
.content-actions .van-button--plain.van-button--primary, 
.content-actions .van-button--plain.van-button--primary .van-icon {
  color: var(--van-button-primary-color, #007aff) !important; 
}

/* Media Query for small screens */
@media (max-width: 400px) {
  .segmented-control {
    flex-direction: column;
    border: none; /* Remove original border */
    border-radius: 0; /* Remove original radius */
    /* border: 1px solid #007aff; */ /* Optional container border */
    /* border-radius: 8px; */
  }
  .segment {
    width: 100%;
    border-right: none; /* Remove side border */
    border-bottom: 1px solid #007aff; /* Add bottom border */
    padding: 10px 5px; /* Adjust padding for vertical */
    border-radius: 0; /* Ensure no radius */
    text-align: left; /* Align text left for vertical */
    padding-left: 10px; /* Add left padding for text */
  }
  .segment:last-child {
    border-bottom: none; /* Remove border for last item */
  }
}
</style>