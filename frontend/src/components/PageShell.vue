<script setup lang="ts">
import OrganicBackground from '@/components/OrganicBackground.vue'
import PageHeader from '@/components/PageHeader.vue'

const props = withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
    maxWidth?: number
    bgColor?: string
    bgOpacity?: number
    hideBg?: boolean
  }>(),
  {
    showBack: true,
    maxWidth: 800,
    bgColor: '#67C23A',
    bgOpacity: 0.08,
    hideBg: false,
  },
)
</script>

<template>
  <div class="page-shell">
    <OrganicBackground v-if="!props.hideBg" :color="props.bgColor" :opacity="props.bgOpacity" />

    <div class="frame" :style="{ maxWidth: `${props.maxWidth}px` }">
      <PageHeader :title="props.title" :showBack="props.showBack">
        <template #right>
          <slot name="header-right" />
        </template>
      </PageHeader>

      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  min-height: 100vh;
  position: relative;
  padding: 0 12px;
}

.frame {
  margin: 0 auto;
  width: 100%;
}

.content {
  position: relative;
  z-index: 1;
  padding: 14px 4px 12px;
}

/* 统一卡片质感 */
:global(.el-card) {
  border-radius: 14px;
  border: 0;
}

:global(.el-card.is-always-shadow),
:global(.el-card.is-hover-shadow:hover),
:global(.el-card) {
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
}
</style>

