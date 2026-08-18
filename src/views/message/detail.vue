<template>
  <div class="msg-detail-page">
    <van-nav-bar title="消息详情" left-arrow @click-left="$router.back()" fixed placeholder safe-area-inset-top />

    <div class="page-content" v-if="msg">
      <div class="detail-card">
        <div class="detail-head">
          <van-tag round :color="typeColor(msg.type)">{{ enumText('messageType', msg.type) }}</van-tag>
        </div>
        <div class="detail-title">{{ msg.title }}</div>
        <div class="detail-time">{{ formatDateTime(msg.createTime) }}</div>
        <div class="detail-content">{{ msg.content || '（无正文）' }}</div>
      </div>
    </div>
    <van-empty v-else-if="!loading" description="消息不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getMessageDetail, readMessage } from '../../api/message'
import { formatDateTime, enumText } from '../../utils/format'

const route = useRoute()
const loading = ref(false)
const msg = ref(null)

function typeColor(t) {
  return {
    APPOINTMENT: '#1989fa',
    ACTIVITY: '#e8843c',
    SYSTEM: '#07c160',
    HEALTH_REMINDER: '#ed6a0c'
  }[t] || '#969799'
}

onMounted(async () => {
  loading.value = true
  try {
    msg.value = await getMessageDetail(route.params.id)
    // 标记已读（幂等）
    if (msg.value.isRead === 0) {
      try {
        await readMessage(msg.value.id)
        msg.value.isRead = 1
      } catch {
        /* 忽略 */
      }
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.detail-title {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 600;
}
.detail-time {
  margin-top: 6px;
  font-size: 12px;
  color: #c8c9cc;
}
.detail-content {
  margin-top: 14px;
  font-size: 15px;
  line-height: 1.8;
  color: #323233;
  white-space: pre-wrap;
}
</style>
