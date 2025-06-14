<template>
  <div class="register-page">
    <div class="register-header">
      <h1>注册</h1>
      <p>创建你的校园信息平台账号</p>
    </div>
    
    <div class="register-form">
      <form @submit.prevent="handleRegister">
        <div class="form-item">
          <label>用户名</label>
          <input 
            type="text" 
            v-model="registerForm.username" 
            placeholder="请输入用户名" 
            required 
          />
        </div>
        
        <div class="form-item">
          <label>手机号</label>
          <input 
            type="tel" 
            v-model="registerForm.phone" 
            placeholder="请输入手机号" 
            required 
            pattern="^1[3-9]\d{9}$"
          />
        </div>
        
        <div class="form-item verification-code">
          <label>验证码</label>
          <input 
            type="text" 
            v-model="registerForm.verificationCode" 
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
        
        <div class="form-item">
          <label>密码</label>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="registerForm.password" 
            placeholder="请设置密码" 
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
            v-model="registerForm.confirmPassword" 
            placeholder="请确认密码" 
            required 
          />
          <div class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
            <svg-icon :name="showConfirmPassword ? 'eye' : 'eye-off'" />
          </div>
        </div>
        
        <hr class="divider"/>
        <h2 class="section-title">校园信息 (可选)</h2>

        <div class="form-item">
          <label>用户角色</label>
          <select v-model="registerForm.userRole">
            <option value="student">学生</option>
            <option value="faculty">教职工</option>
            <option value="staff">职员</option>
            <option value="alumni">校友</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div class="form-item">
          <label>所属校区</label>
          <select v-model="registerForm.campus">
            <option disabled value="">请选择校区</option>
            <option v-for="campus in nchuCampuses" :key="campus" :value="campus">
              {{ campus }}
            </option>
          </select>
        </div>

        <div class="form-item">
          <label>所属学院/部门</label>
          <select v-model="registerForm.college">
            <option disabled value="">请选择学院/部门</option>
            <option v-for="college in nchuColleges" :key="college" :value="college">
              {{ college }}
            </option>
            <option value="其他部门">其他部门</option>
          </select>
        </div>

        <div class="form-item" v-if="isStudentOrAlumni">
          <label>专业</label>
          <select v-model="registerForm.major">
            <option disabled value="">请选择专业</option>
            <option v-for="major in nchuMajors" :key="major" :value="major">
              {{ major }}
            </option>
            <option value="其他">其他(请在简介中注明)</option>
          </select>
        </div>

        <div class="form-item" v-if="isStudentOrAlumni">
          <label>入学年份</label>
          <select v-model="registerForm.enrollmentYear">
            <option disabled :value="null">请选择入学年份</option>
            <option v-for="year in enrollmentYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <div class="form-item" v-if="registerForm.userRole === 'student'">
          <label>学号 (可选)</label>
          <input
            type="text"
            v-model="registerForm.studentId"
            placeholder="请输入学号"
          />
        </div>

        <div class="terms-agreement">
          <input type="checkbox" id="agreement" v-model="registerForm.agreement" required />
          <label for="agreement">我已阅读并同意 <a href="#" @click.prevent="showTerms">服务条款</a> 和 <a href="#" @click.prevent="showPrivacy">隐私政策</a></label>
        </div>
        
        <button 
          type="submit" 
          class="register-button" 
          :disabled="registerLoading || !registerForm.agreement"
        >
          {{ registerLoading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="login-link">
        已有账号? <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { register, apiSendVerificationCode } from '@/api/user'
import { useMessageStore } from '@/store/message'
import { useUserStore } from '@/store/user'

const router = useRouter()
const messageStore = useMessageStore()
const userStore = useUserStore()

// 密码显示切换
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 注册表单
const registerForm = reactive({
  username: '',
  phone: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
  agreement: false,
  campus: '',
  college: '',
  major: '',
  enrollmentYear: null,
  userRole: 'student',
  studentId: ''
})

// 加载状态
const registerLoading = ref(false)
const codeSending = ref(false)

// 验证码倒计时
const countdown = ref(0)
let countdownTimer = null

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
  if (!phoneRegex.test(registerForm.phone)) {
    messageStore.showError('请输入正确的手机号');
    // 聚焦到手机号输入框
    document.querySelector('input[v-model="registerForm.phone"]')?.focus();
    return;
  }
  
  try {
    codeSending.value = true;
    console.log('准备发送验证码请求:', {
      phone: registerForm.phone,
      type: 'register'
    });
    
    let response;
    try {
      response = await apiSendVerificationCode({
        phone: registerForm.phone,
        type: 'register'
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

// 处理注册
const handleRegister = async () => {
  // 验证两次密码输入是否一致
  if (registerForm.password !== registerForm.confirmPassword) {
    messageStore.showError('两次密码输入不一致');
    return;
  }
  
  // 基本表单验证
  if (!registerForm.username.trim()) {
    messageStore.showError('请输入用户名');
    return;
  }
  
  if (!registerForm.phone.trim()) {
    messageStore.showError('请输入手机号');
    return;
  }
  
  if (!registerForm.verificationCode.trim()) {
    messageStore.showError('请输入验证码');
    return;
  }
  
  // 验证密码长度
  if (registerForm.password.length < 6) {
    messageStore.showError('密码长度不能少于6位');
    return;
  }
  
  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(registerForm.phone)) {
    messageStore.showError('请输入正确的手机号格式');
    return;
  }
  
  // 验证入学年份
  if (registerForm.enrollmentYear && (registerForm.enrollmentYear < 1980 || registerForm.enrollmentYear > new Date().getFullYear())) {
    messageStore.showError('请输入有效的入学年份');
    return;
  }
  
  try {
    registerLoading.value = true;
    
    console.log('发送注册请求:', {
      username: registerForm.username,
      phone: registerForm.phone,
      verificationCode: registerForm.verificationCode,
      password: registerForm.password,
      campus: registerForm.campus,
      college: registerForm.college,
      major: registerForm.major,
      enrollmentYear: registerForm.enrollmentYear ? parseInt(registerForm.enrollmentYear) : null,
      userRole: registerForm.userRole,
      studentId: registerForm.studentId
    });
    
    const response = await register({
      username: registerForm.username,
      phone: registerForm.phone,
      verificationCode: registerForm.verificationCode,
      password: registerForm.password,
      campus: registerForm.campus,
      college: registerForm.college,
      major: registerForm.major,
      enrollmentYear: registerForm.enrollmentYear ? parseInt(registerForm.enrollmentYear) : null,
      userRole: registerForm.userRole,
      studentId: registerForm.studentId
    });
    
    console.log('收到注册响应:', response);
    
    // 检查响应是否存在
    if (!response) {
      console.error('注册响应为空');
      messageStore.showError('服务器响应异常，请重试');
      return;
    }
    
    // 直接判断是否包含必要的登录信息
    if (response.accessToken) {
      console.log('注册成功，保存用户数据:', response);
      
      // 保存用户信息到localStorage
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('tokenExpire', response.accessExpire?.toString() || '');
      localStorage.setItem('refreshAfter', response.refreshAfter?.toString() || '');
      localStorage.setItem('userId', response.userId?.toString() || '');
      localStorage.setItem('username', response.username || '');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('isFirstVisit', 'true');
      
      // 显示成功消息
      messageStore.showSuccess('注册成功，正在跳转...');
      
      // 确保消息显示后再跳转
      setTimeout(() => {
        console.log('准备跳转到个人中心页面');
        handleRegisterSuccess(response);
      }, 1000);
      
      return;
    } else {
      // 如果没有token但响应码是200
      if (response.code === 200) {
        console.warn('注册成功但未返回token:', response);
        messageStore.showSuccess('注册成功，请重新登录');
        setTimeout(() => {
          window.location.replace('/login');
        }, 1000);
        return;
      }
      
      // 处理错误情况
      console.error('注册失败，响应:', response);
      let errorMessage = '注册失败，请重试';
      
      if (response.message) {
        errorMessage = response.message;
      } else if (response.code === 409) {
        errorMessage = '用户名或手机号已被注册';
      } else if (response.code === 422) {
        errorMessage = '验证码错误或已过期';
      } else if (response.code === 400) {
        errorMessage = '请检查输入信息是否正确';
      }
      
      messageStore.showError(errorMessage);
    }
  } catch (error) {
    console.error('注册过程发生异常:', error);
    messageStore.showError(error.message || '注册失败，请稍后重试');
  } finally {
    registerLoading.value = false;
  }
}

// 修复注册成功后的处理逻辑
const handleRegisterSuccess = (data) => {
  if (data) {
    console.log('注册成功，保存用户数据:', data);
    
    // 提取和标准化用户数据
    const userData = {
      id: data.userId || data.id,
      userId: data.userId || data.id,
      username: data.username,
      nickname: data.nickname || data.username,
      avatar: data.avatar || '',
      phone: data.phone || '',
      campus: data.campus || '',
      college: data.college || '',
      major: data.major || '',
      enrollmentYear: data.enrollmentYear || null,
      userRole: data.userRole || 'student',
      studentId: data.studentId || registerForm.studentId
    };
    
    // 确保有token
    const token = data.token || data.accessToken;
    if (!token) {
      messageStore.showError('注册成功，但缺少访问令牌');
      return;
    }
    
    // 存储token和用户ID到localStorage，提高持久性
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userData.id || userData.userId);
    localStorage.setItem('isLoggedIn', 'true');
    
    // 记录登录时间，用于判断token过期
    const now = new Date().getTime();
    localStorage.setItem('loginTime', now);
    
    // 更新Pinia状态
    userStore.login(token);
    userStore.setUserInfo(userData);
    
    // 显示注册成功消息
    messageStore.showSuccess('注册成功，欢迎加入!');
    
    console.log('注册成功，跳转到个人中心页面');
    
    // 跳转到个人中心页面
    router.replace('/mine');
  } else {
    messageStore.showError('注册成功但未获取到用户信息');
  }
}

// 显示服务条款
const showTerms = () => {
  // 这里可以实现弹窗显示服务条款
  alert('服务条款内容')
}

// 显示隐私政策
const showPrivacy = () => {
  // 这里可以实现弹窗显示隐私政策
  alert('隐私政策内容')
}

// --- Nanchang Hangkong University Data ---
const nchuCampuses = ref([
  '前湖校区',
  '上海路校区',
  // 添加其他校区（如果需要）
]);

const nchuColleges = ref([
  '航空制造工程学院',
  '环境与化学工程学院',
  '材料科学与工程学院',
  '信息工程学院',
  '经济管理学院',
  '文法学院',
  '艺术与设计学院',
  '马克思主义学院',
  '体育学院',
  '飞行器工程学院(试飞)',
  '国际教育学院',
  '软件学院',
  '测试与光电工程学院',
  '数学与物理学院',
  '外国语学院',
  '航空服务与音乐学院', // Example: Add more colleges
  '创新创业学院',
  // ... 添加南昌航空大学所有学院 ...
]);

// --- Simplified Major List (Expand this!) ---
const nchuMajors = ref([
    '飞行器制造工程', '材料成型及控制工程', '环境工程',
    '化学工程与工艺', '应用化学', '材料科学与工程', '金属材料工程',
    '电子信息工程', '通信工程', '自动化', '计算机科学与技术',
    '软件工程', '网络工程', '物联网工程', '国际经济与贸易',
    '市场营销', '会计学', '财务管理', '法学', '英语', '日语',
    '视觉传达设计', '环境设计', '产品设计', '动画', '音乐学',
    '体育教育', '飞行技术', '飞行器动力工程', '测控技术与仪器',
    '光电信息科学与工程', '信息与计算科学', '数学与应用数学',
    // --- Add many more majors here ---
]);

// --- Generate Enrollment Years ---
const currentYear = new Date().getFullYear();
const enrollmentYears = computed(() => {
  const years = [];
  // Generate years from current year back to, say, 1980
  for (let year = currentYear; year >= 1980; year--) {
    years.push(year);
  }
  return years;
});

// Computed property to check if role requires student-specific fields
const isStudentOrAlumni = computed(() => {
    return ['student', 'alumni'].includes(registerForm.userRole);
});
// ---------------------------------------
</script>

<style scoped>
.register-page {
  max-width: 420px;
  margin: 30px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.register-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.register-header p {
  font-size: 14px;
  color: #666;
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

/* 适配iOS样式的输入框 */
input {
  -webkit-appearance: none;
  appearance: none;
  border-radius: 8px; 
  padding: 12px 15px;
  font-size: 16px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
  width: 100%;
  transition: all 0.3s;
}

input:focus {
  outline: none;
  border-color: #007aff;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.terms-agreement {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.terms-agreement input {
  margin-right: 8px;
  margin-top: 3px;
  width: auto;
  height: auto;
  -webkit-appearance: checkbox;
  appearance: checkbox;
  background-color: transparent;
  border: none;
  padding: 0;
}

.terms-agreement label {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  line-height: 1.5;
}

.terms-agreement a {
  color: #1890ff;
  text-decoration: none;
  margin: 0 3px;
}

.register-button {
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

.register-button:hover {
  background-color: #40a9ff;
}

.register-button:disabled {
  background-color: #b3d9ff;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #1890ff;
  text-decoration: none;
}

@media (max-width: 480px) {
  .register-page {
    margin: 20px 15px;
    padding: 15px;
  }
}

/* Add styles for the new section */
.divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 25px 0;
}

.section-title {
  font-size: 16px;
  color: #555;
  margin-bottom: 15px;
  text-align: center;
}

/* Style for the select dropdown to match input fields */
.form-item select {
  width: 100%;
  height: 44px; /* Match iOS input height style */
  padding: 0 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background-color: #f5f5f5;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 15px center;
  background-size: 16px 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-sizing: border-box; /* Ensure consistent box model */
}

.form-item select:focus {
  outline: none;
  border-color: #007aff;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* Ensure inputs and selects have consistent styling */
.form-item input, .form-item select {
  box-sizing: border-box;
}
</style>