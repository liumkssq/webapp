<template>
  <div class="change-password-page">
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
      <div class="nav-title">修改密码</div>
    </div>
    
    <!-- 修改密码表单 -->
    <div class="password-form">
      <div class="form-group">
        <label for="currentPassword">当前密码</label>
        <div class="input-wrapper">
          <input 
            :type="showCurrentPassword ? 'text' : 'password'" 
            id="currentPassword" 
            v-model="formData.currentPassword"
            placeholder="请输入当前密码"
            @input="validateForm"
          >
          <div 
            class="toggle-password"
            @click="showCurrentPassword = !showCurrentPassword"
          >
            <i :class="showCurrentPassword ? 'icon-eye-open' : 'icon-eye-close'"></i>
          </div>
        </div>
        <div class="error-message" v-if="errors.currentPassword">
          {{ errors.currentPassword }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="newPassword">新密码</label>
        <div class="input-wrapper">
          <input 
            :type="showNewPassword ? 'text' : 'password'" 
            id="newPassword" 
            v-model="formData.newPassword"
            placeholder="请输入新密码"
            @input="validateForm"
          >
          <div 
            class="toggle-password"
            @click="showNewPassword = !showNewPassword"
          >
            <i :class="showNewPassword ? 'icon-eye-open' : 'icon-eye-close'"></i>
          </div>
        </div>
        <div class="error-message" v-if="errors.newPassword">
          {{ errors.newPassword }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="confirmPassword">确认新密码</label>
        <div class="input-wrapper">
          <input 
            :type="showConfirmPassword ? 'text' : 'password'" 
            id="confirmPassword" 
            v-model="formData.confirmPassword"
            placeholder="请再次输入新密码"
            @input="validateForm"
          >
          <div 
            class="toggle-password"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <i :class="showConfirmPassword ? 'icon-eye-open' : 'icon-eye-close'"></i>
          </div>
        </div>
        <div class="error-message" v-if="errors.confirmPassword">
          {{ errors.confirmPassword }}
        </div>
      </div>
      
      <!-- 密码强度提示 -->
      <div class="password-strength" v-if="formData.newPassword">
        <div class="strength-label">密码强度:</div>
        <div class="strength-bars">
          <div 
            v-for="n in 4" 
            :key="n"
            class="strength-bar"
            :class="{ active: passwordStrength >= n }"
          ></div>
        </div>
        <div class="strength-text">{{ passwordStrengthText }}</div>
      </div>
      
      <!-- 密码规则提示 -->
      <div class="password-rules">
        <div class="rules-title">密码需要满足:</div>
        <div class="rule-item" :class="{ valid: passwordRules.length }">
          <i :class="passwordRules.length ? 'icon-check' : 'icon-close'"></i>
          <span>至少8个字符</span>
        </div>
        <div class="rule-item" :class="{ valid: passwordRules.uppercase }">
          <i :class="passwordRules.uppercase ? 'icon-check' : 'icon-close'"></i>
          <span>至少1个大写字母</span>
        </div>
        <div class="rule-item" :class="{ valid: passwordRules.lowercase }">
          <i :class="passwordRules.lowercase ? 'icon-check' : 'icon-close'"></i>
          <span>至少1个小写字母</span>
        </div>
        <div class="rule-item" :class="{ valid: passwordRules.number }">
          <i :class="passwordRules.number ? 'icon-check' : 'icon-close'"></i>
          <span>至少1个数字</span>
        </div>
        <div class="rule-item" :class="{ valid: passwordRules.special }">
          <i :class="passwordRules.special ? 'icon-check' : 'icon-close'"></i>
          <span>至少1个特殊字符</span>
        </div>
      </div>
      
      <!-- 提交按钮 -->
      <div class="form-actions">
        <button 
          class="submit-btn" 
          :disabled="!isFormValid || isSubmitting"
          @click="submitForm"
        >
          {{ isSubmitting ? '修改中...' : '确认修改' }}
        </button>
      </div>
    </div>
    
    <!-- 提示消息 -->
    <div class="toast" v-if="showToast">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码显示状态
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 表单验证错误
const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 页面状态
const isSubmitting = ref(false)
const isFormValid = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

// 密码规则验证
const passwordRules = computed(() => {
  const password = formData.newPassword
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  }
})

// 密码强度计算
const passwordStrength = computed(() => {
  const rules = passwordRules.value
  let strength = 0
  
  if (rules.length) strength++
  if (rules.uppercase) strength++
  if (rules.lowercase) strength++
  if (rules.number) strength++
  if (rules.special) strength++
  
  // 根据规则满足数量返回1-4的强度
  return Math.min(4, Math.ceil(strength * 4 / 5))
})

// 密码强度文本
const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  
  if (strength <= 1) return '弱'
  if (strength === 2) return '中'
  if (strength === 3) return '强'
  return '非常强'
})

// 表单验证
const validateForm = () => {
  // 重置错误信息
  errors.currentPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
  
  // 验证当前密码
  if (!formData.currentPassword) {
    errors.currentPassword = '请输入当前密码'
  } else if (formData.currentPassword.length < 6) {
    errors.currentPassword = '当前密码不正确'
  }
  
  // 验证新密码
  if (!formData.newPassword) {
    errors.newPassword = '请输入新密码'
  } else if (formData.newPassword.length < 8) {
    errors.newPassword = '新密码至少需要8个字符'
  } else if (formData.newPassword === formData.currentPassword) {
    errors.newPassword = '新密码不能与当前密码相同'
  }
  
  // 验证确认密码
  if (!formData.confirmPassword) {
    errors.confirmPassword = '请确认新密码'
  } else if (formData.confirmPassword !== formData.newPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
  }
  
  // 检查是否满足密码复杂度要求
  if (formData.newPassword && !passwordRules.value.length) {
    errors.newPassword = '密码长度至少为8个字符'
  }
  
  // 更新表单有效性
  isFormValid.value = !errors.currentPassword && 
                      !errors.newPassword && 
                      !errors.confirmPassword && 
                      formData.currentPassword && 
                      formData.newPassword && 
                      formData.confirmPassword &&
                      passwordStrength.value >= 2
}

// 提交表单
const submitForm = async () => {
  if (!isFormValid.value || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 显示成功消息
    showToastMessage('密码修改成功')
    
    // 3秒后返回上一页
    setTimeout(() => {
      router.back()
    }, 3000)
  } catch (error) {
    console.error('修改密码失败', error)
    showToastMessage('修改密码失败，请重试')
    isSubmitting.value = false
  }
}

// 显示提示消息
const showToastMessage = (message) => {
  toastMessage.value = message
  showToast.value = true
  
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 初始化页面
onMounted(() => {
  validateForm()
})
</script>