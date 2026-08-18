<template>
  <div class="assess-list-page">
    <van-nav-bar title="健康评测" left-arrow @click-left="$router.back()" fixed placeholder safe-area-inset-top />
    <div class="page-content">
      <van-notice-bar left-icon="info-o" text="完成一份评测可获得 20 积分，提交后生成健康评分与 AI 建议" />

      <van-skeleton title :row="3" v-if="loading" />
      <van-empty v-else-if="!list.length" description="暂无已发布的问卷" image-size="80" />

      <div v-for="q in list" :key="q.id" class="questionnaire-card" @click="go(q)">
        <div class="q-title">{{ q.title }}</div>
        <div class="q-desc">{{ q.description || '完成问卷，了解您的健康状况' }}</div>
        <div class="q-footer">
          <van-button size="small" round type="primary">开始评测</van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getQuestionnaires } from '../../api/assessment'

const router = useRouter()
const loading = ref(false)
const list = ref([])

function go(q) {
  router.push(`/assessment/${q.id}`)
}

onMounted(async () => {
  loading.value = true
  try {
    list.value = await getQuestionnaires()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.questionnaire-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.q-title {
  font-size: 17px;
  font-weight: 600;
}
.q-desc {
  margin-top: 8px;
  font-size: 13px;
  color: #969799;
  line-height: 1.6;
}
.q-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
