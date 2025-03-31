<template>
  <div class="forgot-password-page">
    <div class="forgot-password-header">
      <h1>找回密码</h1>
      <p>重置你的账号密码</p>
    </div>
    
    <div class="forgot-password-form">
      <!-- 步骤指示器 -->
      <div class="steps">
        <div :class="['step', { active: currentStep >= 1, completed: currentStep > 1 }]">
          <div class="step-number">1</div>
          <div class="step-label">验证身份</div>
        </div>
        <div class="step-line"></div>
        <div :class="['step', { active: currentStep >= 2, completed: currentStep > 2 }]">
          <div class="step-number">2</div>
          <div class="step-label">设置新密码</div>
        </div>
        <div class="step-line"></div>
        <div :class="['step', { active: currentStep >= 3 }]">
          <div class="step-number">3</div>
          <div class="step-label">完成</div>
        </div>
      </div>
      
      <!-- 步骤1: 验证身份 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="form-item">
          <label>手机号</label>
          <input 
            type="tel" 
            v-model="verifyForm.phone" 
            placeholder="请输入注册时的手机号" 
            required 
            pattern="^1[3-9]\d{9}$"
          />
        </div>
        
        <div class="form-item verification-code">
          <label>验证码</label>
          <input 
            type="text" 
            v-model="verifyForm.verificationCode" 
            placeholder="请输入验证码" 
            required 
          />
          <button 
            type="button" 
            class="send-code-button" 
            @click="sendVerificationCode" 
            :disabled="codeSending || countdown > 0"
          >
            {{ getVerifyCodeButtonText }}
            <span v-if="codeSending" class="loading-indicator"></span>
          </button>
        </div>
        
        <button 
          type="button" 
          class="submit-button" 
          @click="verifyIdentity" 
          :disabled="verifyLoading"
        >
          {{ verifyLoading ? '验证中...' : '下一步' }}
        </button>
      </div>
      
      <!-- 步骤2: 设置新密码 -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="form-item">
          <label>新密码</label>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="resetForm.password" 
            placeholder="请设置新密码" 
            required 
            minlength="6"
          />
          <div class="password-toggle" @click="showPassword = !showPassword">
            <svg-icon :name="showPassword ? 'eye' : 'eye-off'" />
          </div>
        </div>
        
        <div class="form-item">
          <label>确认密码</label>
          <input 
            :type="showConfirmPassword ? 'text' : 'password'" 
            v-model="resetForm.confirmPassword" 
            placeholder="请确认新密码" 
            required 
          />
          <div class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
            <svg-icon :name="showConfirmPassword ? 'eye' : 'eye-off'" />
          </div>
        </div>
        
        <div class="password-strength">
          <div class="strength-label">密码强度:</div>
          <div class="strength-indicator">
            <div 
              :class="['strength-bar', passwordStrengthClass]" 
              :style="{ width: passwordStrengthWidth }"
            ></div>
          </div>
          <div class="strength-text">{{ passwordStrengthText }}</div>
        </div>
        
        <div class="password-tips">
          <p>提示: 建议使用包含字母、数字和特殊字符的组合，长度8位以上的密码。</p>
        </div>
        
        <div class="button-group">
          <button type="button" class="back-button" @click="goBack">
            上一步
          </button>
          <button 
            type="button" 
            class="submit-button" 
            @click="resetPassword" 
            :disabled="resetLoading"
          >
            {{ resetLoading ? '重置中...' : '重置密码' }}
          </button>
        </div>
      </div>
      
      <!-- 步骤3: 完成 -->
      <div v-if="currentStep === 3" class="step-content completed-step">
        <div class="success-icon">
          <svg-icon name="check-circle" size="64" />
        </div>
        <h2>密码重置成功!</h2>
        <p>你的密码已经重置，现在可以使用新密码登录</p>
        <button type="button" class="submit-button" @click="goToLogin">
          前往登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { sendVerificationCode as apiSendVerificationCode, verifyCode, resetPassword as resetPasswordApi } from '@/api/user'
import { useMessageStore } from '@/store/message'

const router = useRouter()
const messageStore = useMessageStore()

// 当前步骤
const currentStep = ref(1)

// 密码显示控制
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 验证身份表单
const verifyForm = reactive({
  phone: '',
  verificationCode: ''
})

// 重置密码表单
const resetForm = reactive({
  password: '',
  confirmPassword: '',
  token: '' // 验证身份后获取的重置令牌
})

// 加载状态
const verifyLoading = ref(false)
const resetLoading = ref(false)
const codeSending = ref(false)

// 验证码倒计时
const countdown = ref(0)
let countdownTimer = null

// 密码强度计算
const passwordStrength = computed(() => {
  const password = resetForm.password
  
  if (!password) return 0
  
  let strength = 0
  
  // 长度检查
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  
  // 包含数字
  if (/\d/.test(password)) strength += 1
  
  // 包含小写字母
  if (/[a-z]/.test(password)) strength += 1
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) strength += 1
  
  // 包含特殊字符
  if (/[^A-Za-z0-9]/.test(password)) strength += 1
  
  return Math.min(strength, 5)
})

// 密码强度样式
const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  
  if (strength === 0) return 'strength-none'
  if (strength <= 2) return 'strength-weak'
  if (strength <= 4) return 'strength-medium'
  return 'strength-strong'
})

// 密码强度宽度（百分比）
const passwordStrengthWidth = computed(() => {
  const strength = passwordStrength.value
  return `${(strength / 5) * 100}%`
})

// 密码强度文本
const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  
  if (strength === 0) return '请输入密码'
  if (strength <= 2) return '弱'
  if (strength <= 4) return '中'
  return '强'
})

// 验证码按钮文本计算属性
const getVerifyCodeButtonText = computed(() => {
  if (codeSending.value) return '发送中...';
  if (countdown.value > 0) return `${countdown.value}秒后重新获取`;
  return '获取验证码';
})

// 发送验证码
const sendVerificationCode = async () => {
  // 简单的手机号验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(verifyForm.phone)) {
    messageStore.showError('请输入正确的手机号');
    // 聚焦到手机号输入框
    document.querySelector('input[v-model="verifyForm.phone"]')?.focus();
    return;
  }
  
  try {
    codeSending.value = true;
    console.log('准备发送验证码请求:', {
      phone: verifyForm.phone,
      type: 'resetPassword'
    });
    
    let response;
    try {
      response = await apiSendVerificationCode({
        phone: verifyForm.phone,
        type: 'resetPassword' // 指定验证码类型为重置密码
      });
    } catch (requestError) {
      console.error('验证码请求异常被捕获:', requestError);
      response = {
        code: 500,
        message: requestError.message || '请求发送失败',
        data: null
      };
    }
    
    console.log('验证码请求完成，响应结果:', response);
    
    // 进行安全检查，确保响应有效
    if (!response) {
      console.error('响应为null或undefined');
      messageStore.showError('验证码发送失败，服务器无响应');
      return;
    }
    
    // 确保响应是一个有效的对象
    if (typeof response !== 'object') {
      console.error('响应不是对象:', response);
      messageStore.showError('验证码发送失败，响应格式无效');
      return;
    }
    
    // 检查响应是否存在且有code属性
    if (response.code === 200) {
      messageStore.showSuccess('验证码已发送，请注意查收');
      
      // 震动反馈（如果设备支持）
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      // 开始倒计时
      countdown.value = 60;
      countdownTimer = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value -= 1;
        } else {
          clearInterval(countdownTimer);
        }
      }, 1000);
    } else {
      // 处理错误响应
      console.warn('验证码请求返回错误状态码:', response.code);
      messageStore.showError(response.message || '验证码发送失败，请稍后重试');
    }
  } catch (error) {
    console.error('发送验证码过程中出现未捕获异常:', error);
    messageStore.showError('网络异常，请稍后重试');
  } finally {
    codeSending.value = false;
  }
}

// 验证身份
const verifyIdentity = async () => {
  if (!verifyForm.phone || !verifyForm.verificationCode) {
    messageStore.showError('请填写完整信息')
    return
  }
  
  try {
    verifyLoading.value = true
    
    const response = await verifyCode({
      phone: verifyForm.phone,
      verificationCode: verifyForm.verificationCode,
      type: 'resetPassword'
    })
    
    if (response.code === 200) {
      // 保存重置令牌
      resetForm.token = response.data.resetToken
      
      // 进入下一步
      currentStep.value = 2
    } else {
      messageStore.showError(response.message || '验证失败，请检查手机号和验证码')
    }
  } catch (error) {
    console.error('验证失败:', error)
    messageStore.showError('验证失败，请稍后重试')
  } finally {
    verifyLoading.value = false
  }
}

// 重置密码
const resetPassword = async () => {
  // 验证两次密码输入是否一致
  if (resetForm.password !== resetForm.confirmPassword) {
    messageStore.showError('两次密码输入不一致')
    return
  }
  
  // 验证密码强度
  if (passwordStrength.value < 3) {
    messageStore.showError('密码强度不足，请设置更复杂的密码')
    return
  }
  
  try {
    resetLoading.value = true
    
    const response = await resetPasswordApi({
      phone: verifyForm.phone,
      newPassword: resetForm.password,
      resetToken: resetForm.token
    })
    
    if (response.code === 200) {
      // 进入完成步骤
      currentStep.value = 3
    } else {
      messageStore.showError(response.message || '密码重置失败，请稍后重试')
    }
  } catch (error) {
    console.error('密码重置失败:', error)
    messageStore.showError('密码重置失败，请稍后重试')
  } finally {
    resetLoading.value = false
  }
}

// 返回上一步
const goBack = () => {
  currentStep.value = 1
}

// 前往登录页
const goToLogin = () => {
  router.push('/login')
}

// 组件销毁前清除定时器
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.forgot-password-page {
  max-width: 500px;
  margin: 30px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 24px;
}

.forgot-password-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.forgot-password-header p {
  font-size: 14px;
  color: #666;
}

/* 步骤指示器样式 */
.steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #999;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  margin-bottom: 8px;
  border: 2px solid #f0f0f0;
}

.step-label {
  font-size: 14px;
  color: #999;
}

.step.active .step-number {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

.step.active .step-label {
  color: #1890ff;
  font-weight: 500;
}

.step.completed .step-number {
  background-color: #52c41a;
  border-color: #52c41a;
  color: white;
}

.step-line {
  flex: 1;
  height: 2px;
  background-color: #f0f0f0;
  margin: 0 10px;
  margin-bottom: 25px;
}

/* 表单样式 */
.step-content {
  padding: 10px 0;
}

.form-item {
  margin-bottom: 20px;
  position: relative;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.form-item input {
  width: 100%;
  height: 40px;
  padding: 0 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-item input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 38px;
  color: #999;
  cursor: pointer;
}

.verification-code {
  display: flex;
  align-items: flex-end;
}

.verification-code input {
  flex: 1;
  margin-right: 10px;
}

.send-code-button {
  width: 110px;
  height: 40px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-code-button:disabled {
  background-color: #b3d9ff;
  cursor: not-allowed;
}

.loading-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 6px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* iOS风格的输入框 */
.form-item input {
  -webkit-appearance: none;
  appearance: none;
  border-radius: 8px; 
  padding: 12px 15px;
  font-size: 16px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
  width: 100%;
  height: auto;
  transition: all 0.3s;
}

.form-item input:focus {
  outline: none;
  border-color: #007aff;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* 密码强度指示器 */
.password-strength {
  margin-bottom: 15px;
}

.strength-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.strength-indicator {
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.strength-none {
  width: 0;
}

.strength-weak {
  background-color: #ff4d4f;
}

.strength-medium {
  background-color: #faad14;
}

.strength-strong {
  background-color: #52c41a;
}

.strength-text {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
  text-align: right;
}

.password-tips {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f6f6f6;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
}

/* 按钮样式 */
.submit-button {
  width: 100%;
  height: 44px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-button:hover {
  background-color: #40a9ff;
}

.submit-button:disabled {
  background-color: #b3d9ff;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 15px;
}

.back-button {
  flex: 1;
  height: 44px;
  background-color: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.back-button:hover {
  background-color: #e0e0e0;
}

/* 完成步骤样式 */
.completed-step {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  color: #52c41a;
  margin-bottom: 15px;
}

.completed-step h2 {
  margin-bottom: 15px;
  color: #333;
}

.completed-step p {
  margin-bottom: 25px;
  color: #666;
}

@media (max-width: 480px) {
  .forgot-password-page {
    margin: 20px 15px;
    padding: 15px;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .button-group button {
    width: 100%;
  }
}
</style>