<template>
  <div class="user-edit-dialog">
    <div class="dialog-container">
      <!-- 标题 -->
      <div class="dialog-header">
        <h3 class="dialog-title">编辑个人资料</h3>
        <div class="close-button" @click="$emit('close')">
          <i class="material-icons">close</i>
        </div>
      </div>
      
      <!-- 表单内容 -->
      <div class="dialog-body">
        <form @submit.prevent="handleSubmit">
          <!-- 昵称 -->
          <div class="form-group">
            <label for="nickname">昵称</label>
            <input 
              type="text" 
              id="nickname" 
              v-model="formData.nickname" 
              placeholder="请输入昵称"
              maxlength="20"
              class="form-control"
            />
          </div>
          
          <!-- 性别 -->
          <div class="form-group">
            <label>性别</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="formData.gender" value="male" name="gender">
                <span>男</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="formData.gender" value="female" name="gender">
                <span>女</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="formData.gender" value="other" name="gender">
                <span>不展示</span>
              </label>
            </div>
          </div>
          
          <!-- 个性签名 -->
          <div class="form-group">
            <label for="bio">个性签名</label>
            <textarea 
              id="bio" 
              v-model="formData.bio" 
              placeholder="介绍一下自己吧"
              maxlength="100"
              class="form-control"
              rows="3"
            ></textarea>
            <div class="char-count">{{ formData.bio.length }}/100</div>
          </div>
          
          <!-- 学校 -->
          <div class="form-group">
            <label for="school">学校</label>
            <input 
              type="text" 
              id="school" 
              v-model="formData.school" 
              placeholder="请输入学校名称"
              class="form-control"
            />
          </div>
          
          <!-- 手机号 -->
          <div class="form-group">
            <label for="phone">手机号</label>
            <input 
              type="tel" 
              id="phone" 
              v-model="formData.phone" 
              placeholder="请输入手机号码"
              class="form-control"
              :disabled="true"
            />
            <div class="field-hint">修改手机号请前往安全设置</div>
          </div>
          
          <!-- 邮箱 -->
          <div class="form-group">
            <label for="email">邮箱</label>
            <input 
              type="email" 
              id="email" 
              v-model="formData.email" 
              placeholder="请输入邮箱地址"
              class="form-control"
            />
          </div>
        </form>
      </div>
      
      <!-- 底部按钮 -->
      <div class="dialog-footer">
        <button class="cancel-button" @click="$emit('close')">取消</button>
        <button 
          class="save-button" 
          :disabled="isSubmitting" 
          @click="handleSubmit"
        >
          <span v-if="isSubmitting">保存中...</span>
          <span v-else>保存</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const props = defineProps({
  userInfo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

// 表单数据
const formData = reactive({
  nickname: '',
  gender: 'other',
  bio: '',
  school: '',
  phone: '',
  email: ''
})

// 提交状态
const isSubmitting = ref(false)

// 初始化表单数据
const initFormData = () => {
  formData.nickname = props.userInfo.nickname || ''
  formData.gender = props.userInfo.gender || 'other'
  formData.bio = props.userInfo.bio || ''
  formData.school = props.userInfo.school || ''
  formData.phone = props.userInfo.phone || ''
  formData.email = props.userInfo.email || ''
}

// 提交表单
const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    // 返回更新的数据
    emit('save', {
      nickname: formData.nickname,
      gender: formData.gender,
      bio: formData.bio,
      school: formData.school,
      email: formData.email
    })
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  initFormData()
})
</script>

<style scoped>
.user-edit-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
}

.close-button {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.dialog-body {
  padding: 15px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #666;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-control:focus {
  border-color: #1e88e5;
  outline: none;
}

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

textarea.form-control {
  resize: none;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #999;
  margin-top: 4px;
}

.field-hint {
  font-size: 0.8rem;
  color: #888;
  margin-top: 4px;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-label input {
  margin-right: 8px;
}

.dialog-footer {
  padding: 15px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.cancel-button, .save-button {
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
}

.cancel-button {
  margin-right: 10px;
  background-color: #f0f0f0;
  color: #333;
}

.save-button {
  background-color: #1e88e5;
  color: white;
}

.save-button:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

.save-button:not(:disabled):hover {
  background-color: #1976d2;
}
</style>