<template>
  <div class="assess-history-page">
    <van-nav-bar title="我的评测记录" left-arrow @click-left="$router.back()" fixed placeholder safe-area-inset-top />

    <div class="page-content">
      <van-empty v-if="!list.length && !loading" description="还没有评测记录" image-size="80" />
      <div v-for="r in list" :key="r.id" class="history-card" @click="goResult(r)">
        <div class="h-main">
          <div class="h-title">{{ r.questionnaireTitle }}</div>
          <div class="h-time">{{ formatDateTime(r.createTime) }}</div>
        </div>
        <div class="h-score">
          <div class="h-score-num">{{ r.aiScore }}</div>
          <div class="h-score-label">AI 评分</div>
        </div>
      </div>

      <div v-if="total > list.length" class="load-more" @click="loadMore">加载更多</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAssessmentHistory } from '../../api/assessment'
import { formatDateTime } from '../../utils/format'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, size: 10 })

function goResult(r) {
  router.push(`/assessment/result/${r.id}`)
}

async function load() {
  loading.value = true
  try {
    const data = await getAssessmentHistory({ page: query.page, size: query.size })
    if (query.page === 1) {
      list.value = data.list || []
    } else {
      list.value = list.value.concat(data.list || [])
    }
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function loadMore() {
  query.page += 1
  load()
}

onMounted(load)
</script>

<style scoped>
.history-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.h-title {
  font-size: 15px;
  font-weight: 600;
}
.h-time {
  margin-top: 6px;
  font-size: 12px;
  color: #969799;
}
.h-score {
  text-align: center;
  color: #d97c2b;
}
.h-score-num {
  font-size: 24px;
  font-weight: 700;
}
.h-score-label {
  font-size: 11px;
  color: #969799;
}
.load-more {
  padding: 14px;
  text-align: center;
  color: #576b95;
  font-size: 14px;
}
</style>
