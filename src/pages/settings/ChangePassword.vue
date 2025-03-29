<template>
  <div class="change-password-page">
    <!-- 头部导航 -->
    <HeaderNavigation title="修改密码" showBack @back="router.back()" />
    
    <!-- 表单区域 -->
    <div class="form-container">
      <form @submit.prevent="handleSubmit">
        <!-- 当前密码 -->
        <div class="form-group">
          <label for="currentPassword">当前密码</label>
          <div class="password-input">
            <input 
              :type="showCurrentPassword ? 'text' : 'password'" 
              id="currentPassword" 
              v-model="formData.currentPassword" 
              placeholder="请输入当前密码"
              class="form-control"
            />
            <div class="toggle-password" @click="showCurrentPassword = !showCurrentPassword">
              <i class="material-icons">{{ showCurrentPassword ? 'visibility_off' : 'visibility' }}</i>
            </div>
          </div>
          <div v-if="errors.currentPassword" class="error-message">{{ errors.currentPassword }}</div>
        </div>
        
        <!-- 新密码 -->
        <div class="form-group">
          <label for="newPassword">新密码</label>
          <div class="password-input">
            <input 
              :type="showNewPassword ? 'text' : 'password'" 
              id="newPassword" 
              v-model="formData.newPassword" 
              placeholder="请输入新密码"
              class="form-control"
            />
            <div class="toggle-password" @click="showNewPassword = !showNewPassword">
              <i class="material-icons">{{ showNewPassword ? 'visibility_off' : 'visibility' }}</i>
            </div>
          </div>
          <div v-if="errors.newPassword" class="error-message">{{ errors.newPassword }}</div>
          <div class="password-strength" v-if="formData.newPassword">
            <div class="strength-label">密码强度：</div>
            <div class="strength-bars">
              <div 
                v-for="i in 3" 
                :key="i" 
                class="strength-bar"
                :class="{ active: passwordStrength >= i }"
              ></div>
            </div>
            <div class="strength-text">{{ strengthText }}</div>
          </div>
        </div>
        
        <!-- 确认新密码 -->
        <div class="form-group">
          <label for="confirmPassword">确认新密码</label>
          <div class="password-input">
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              id="confirmPassword" 
              v-model="formData.confirmPassword" 
              placeholder="请再次输入新密码"
              class="form-control"
            />
            <div class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
              <i class="material-icons">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</i>
            </div>
          </div>
          <div v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</div>
        </div>
        
        <!-- 密码要求提示 -->
        <div class="password-requirements">
          <div class="requirement-title">密码要求：</div>
          <ul class="requirement-list">
            <li :class="{ fulfilled: requirements.length }">长度至少8个字符</li>
            <li :class="{ fulfilled: requirements.lowercase && requirements.uppercase }">包含大小写字母</li>
            <li :class="{ fulfilled: requirements.number }">包含数字</li>
            <li :class="{ fulfilled: requirements.special }">包含特殊字符</li>
          </ul>
        </div>
        
        <!-- 提交按钮 -->
        <button 
          type="submit"
          class="submit-button"
          :disabled="isSubmitting || !isFormValid"
        >
          {{ isSubmitting ? '提交中...' : '确认修改' }}
        </button>
      </form>
    </div>
    
    <!-- 消息提示 -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import HeaderNavigation from '../components/common/HeaderNavigation.vue'
import Toast from '../components/common/Toast.vue'
import { changePassword } from '../api/user'

const router = useRouter()
const toast = ref(null)

// 表单数据
const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 错误信息
const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码可见性控制
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 提交状态
const isSubmitting = ref(false)

// 密码要求检查
const requirements = reactive({
  length: false,
  lowercase: false,
  uppercase: false,
  number: false,
  special: false
})

// 表单验证
const validateForm = () => {
  let isValid = true
  
  // 重置错误信息
  errors.currentPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
  
  // 验证当前密码
  if (!formData.currentPassword) {
    errors.currentPassword = '请输入当前密码'
    isValid = false
  }
  
  // 验证新密码
  if (!formData.newPassword) {
    errors.newPassword = '请输入新密码'
    isValid = false
  } else if (formData.newPassword.length < 8) {
    errors.newPassword = '密码长度至少8个字符'
    isValid = false
  }
  
  // 验证确认密码
  if (!formData.confirmPassword) {
    errors.confirmPassword = '请确认新密码'
    isValid = false
  } else if (formData.confirmPassword !== formData.newPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }
  
  return isValid
}

// 检查密码强度
const checkPasswordStrength = (password) => {
  // 重置检查结果
  requirements.length = password.length >= 8
  requirements.lowercase = /[a-z]/.test(password)
  requirements.uppercase = /[A-Z]/.test(password)
  requirements.number = /[0-9]/.test(password)
  requirements.special = /[^A-Za-z0-9]/.test(password)
  
  // 计算强度分数
  let score = 0
  if (requirements.length) score++
  if (requirements.lowercase && requirements.uppercase) score++
  if (requirements.number) score++
  if (requirements.special) score++
  
  return score
}

// 密码强度
const passwordStrength = computed(() => {
  if (!formData.newPassword) return 0
  return checkPasswordStrength(formData.newPassword)
})

// 强度文本描述
const strengthText = computed(() => {
  switch (passwordStrength.value) {
    case 0: 
      return '弱'
    case 1: 
      return '弱'
    case 2: 
      return '中'
    case 3: 
      return '强'
    case 4: 
      return '非常强'
    default:
      return ''
  }
})

// 表单是否有效
const isFormValid = computed(() => {
  return (
    formData.currentPassword && 
    formData.newPassword && 
    formData.confirmPassword &&
    formData.newPassword === formData.confirmPassword &&
    passwordStrength.value >= 2
  )
})

// 监听新密码变化，实时检查强度
watch(() => formData.newPassword, (newValue) => {
  if (newValue) {
    checkPasswordStrength(newValue)
  }
})

// 提交表单
const handleSubmit = async () => {
  if (!validateForm() || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    const res = await changePassword({
      oldPassword: formData.currentPassword,
      newPassword: formData.newPassword
    })
    
    if (res.code === 200) {
      toast.value.show('密码修改成功', 'success')
      
      // 清空表单
      formData.currentPassword = ''
      formData.newPassword = ''
      formData.confirmPassword = ''
      
      // 延迟返回
      setTimeout(() => {
        router.back()
      }, 1500)
    }
  } catch (error) {
    console.error('密码修改失败:', error)
    
    if (error.response && error.response.data) {
      const { code, message } = error.response.data
      
      if (code === 401) {
        errors.currentPassword = '当前密码错误'
      } else {
        toast.value.show(message || '密码修改失败', 'error')
      }
    } else {
      toast.value.show('密码修改失败，请稍后重试', 'error')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.change-password-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.form-container {
  background-color: #fff;
  padding: 20px 15px;
  margin-top: 15px;
}

.form-group {
  margin-bottom: 25px;
}

label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 8px;
}

.form-control {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
  background-color: #fff;
}

.form-control:focus {
  border-color: #1e88e5;
  outline: none;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  cursor: pointer;
  padding: 5px;
}

.error-message {
  color: #f44336;
  font-size: 0.85rem;
  margin-top: 5px;
}

.password-strength {
  margin-top: 8px;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.strength-label {
  color: #666;
  margin-right: 8px;
}

.strength-bars {
  display: flex;
  margin-right: 8px;
}

.strength-bar {
  width: 20px;
  height: 5px;
  margin-right: 3px;
  background-color: #e0e0e0;
  border-radius: 2px;
}

.strength-bar.active:nth-child(1) {
  background-color: #f44336;
}

.strength-bar.active:nth-child(2) {
  background-color: #ff9800;
}

.strength-bar.active:nth-child(3) {
  background-color: #4caf50;
}

.strength-text {
  color: #666;
}

.password-requirements {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 25px;
}

.requirement-title {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
}

.requirement-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.requirement-list li {
  position: relative;
  padding-left: 20px;
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 5px;
}

.requirement-list li::before {
  content: '○';
  position: absolute;
  left: 0;
}

.requirement-list li.fulfilled {
  color: #4caf50;
}

.requirement-list li.fulfilled::before {
  content: '●';
  color: #4caf50;
}

.submit-button {
  width: 100%;
  padding: 12px 0;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

.submit-button:not(:disabled):hover {
  background-color: #1976d2;
}
</style>