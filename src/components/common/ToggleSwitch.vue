<template>
  <div 
    class="toggle-switch" 
    :class="{ 'is-checked': modelValue }"
    @click="toggle"
  >
    <div class="toggle-switch-track"></div>
    <div class="toggle-switch-thumb"></div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>
.toggle-switch {
  position: relative;
  width: 50px;
  height: 26px;
  border-radius: 13px;
  background-color: #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
  overflow: hidden;
}

.toggle-switch.is-checked {
  background-color: #1e88e5;
}

.toggle-switch-track {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 13px;
}

.toggle-switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.toggle-switch.is-checked .toggle-switch-thumb {
  transform: translateX(24px);
}
</style>