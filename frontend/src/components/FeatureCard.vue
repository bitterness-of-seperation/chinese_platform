<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: "#31C48D"
  },
  bgClass: {
    type: String,
    default: "bg-emerald-50"
  }
});
</script>

<template>
  <div class="feature-card" :class="bgClass">
    <div class="icon-wrapper" :style="{ backgroundColor: color }">
      <i :class="icon"></i>
    </div>
    <div class="content">
      <h3 class="title">{{ title }}</h3>
      <p class="description">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 100%;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08);
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: white;
  font-size: 22px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

.description {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.4;
}

.content {
  flex: 1;
}
</style> 