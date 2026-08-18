<template>
  <div class="health-page">
    <van-nav-bar title="健康档案" fixed placeholder safe-area-inset-top />

    <!-- 录入 -->
    <van-form @submit="onSubmit">
      <van-cell-group inset title="录入健康数据">
        <van-field
          v-model="form.systolic"
          type="number"
          label="收缩压"
          placeholder="30-250 mmHg"
          :rules="[{ validator: optionalNum }]"
        />
        <van-field
          v-model="form.diastolic"
          type="number"
          label="舒张压"
          placeholder="30-150 mmHg"
          :rules="[{ validator: optionalNum }]"
        />
        <van-field
          v-model="form.bloodSugar"
          type="number"
          label="空腹血糖"
          placeholder="1.0-30.0 mmol/L"
          :rules="[{ validator: optionalNum }]"
        />
        <van-field
          v-model="form.heartRate"
          type="number"
          label="心率"
          placeholder="20-250 次/分"
          :rules="[{ validator: optionalNum }]"
        />
        <van-field
          v-model="form.weight"
          type="number"
          label="体重"
          placeholder="10.0-300.0 kg"
          :rules="[{ validator: optionalNum }]"
        />
        <van-field
          v-model="form.memo"
          label="备注"
          placeholder="选填，如：晨起测量"
          maxlength="500"
        />
      </van-cell-group>
      <div class="record-actions">
        <van-button round block type="primary" native-type="submit" :loading="submitting">保存记录</van-button>
      </div>
    </van-form>

    <!-- 历史记录 -->
    <van-cell-group inset title="历史记录">
      <van-cell
        v-for="r in list"
        :key="r.id"
        :title="`${r.systolic ?? '-'}/${r.diastolic ?? '-'} mmHg · ${r.bloodSugar ?? '-'} 血糖`"
        :label="`心率 ${r.heartRate ?? '-'} · 体重 ${r.weight ?? '-'}kg · BMI ${r.bmi ?? '-'} · ${r.memo || ''}`"
      >
        <template #value>
          <span class="record-time">{{ formatDateTime(r.recordedTime) }}</span>
        </template>
      </van-cell>
      <van-empty v-if="!list.length && !loading" description="暂无健康记录" image-size="80" />
      <div v-if="total > list.length" class="load-more" @click="loadMore">加载更多</div>
    </van-cell-group>

    <!-- 近 6 月趋势 -->
    <van-cell-group inset title="近 6 月趋势" v-if="trendEntries.length">
      <van-collapse v-model="activeNames">
        <van-collapse-item v-for="t in trendEntries" :key="t.indicator" :title="t.indicatorText" :name="t.indicator">
          <div class="trend-row" v-for="p in t.points" :key="p.month">
            <span>{{ p.month }}</span>
            <span>均值 {{ p.avg }}</span>
            <span>最高 {{ p.max }}</span>
            <span>最低 {{ p.min }}</span>
          </div>
        </van-collapse-item>
      </van-collapse>
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { recordHealth, getHealthHistory, getHealthTrend } from '../../api/health'
import { formatDateTime } from '../../utils/format'

const INDICATOR_TEXT = {
  SYSTOLIC: '收缩压', DIASTOLIC: '舒张压', BLOOD_SUGAR: '空腹血糖', HEART_RATE: '心率', BMI: 'BMI'
}

const submitting = ref(false)
const form = reactive({ systolic: '', diastolic: '', bloodSugar: '', heartRate: '', weight: '', memo: '' })

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, size: 10 })

const activeNames = ref([])
const trendEntries = ref([])

// 可选数字校验：为空则通过，非空需在范围内
function optionalNum(val, rule) {
  if (val === '' || val === null || val === undefined) return true
  const n = Number(val)
  const [min, max] = rule && rule.range
  if (min === undefined || max === undefined) return !Number.isNaN(n)
  return !Number.isNaN(n) && n >= min && n <= max
}

async function onSubmit() {
  // 至少填一项
  const fields = [form.systolic, form.diastolic, form.bloodSugar, form.heartRate, form.weight]
  if (!fields.some((f) => f !== '' && f !== null && f !== undefined)) {
    return showFailToast('请至少填写一项健康指标')
  }
  submitting.value = true
  try {
    await recordHealth(form)
    showSuccessToast('保存成功')
    Object.assign(form, { systolic: '', diastolic: '', bloodSugar: '', heartRate: '', weight: '', memo: '' })
    query.page = 1
    loadHistory()
  } finally {
    submitting.value = false
  }
}

async function loadHistory() {
  loading.value = true
  try {
    const data = await getHealthHistory({ page: query.page, size: query.size })
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
  loadHistory()
}

async function loadTrend() {
  try {
    const d = await getHealthTrend()
    const map = (d && d.data) || {}
    trendEntries.value = Object.keys(map).map((indicator) => ({
      indicator,
      indicatorText: INDICATOR_TEXT[indicator] || indicator,
      points: map[indicator] || []
    }))
  } catch {
    trendEntries.value = []
  }
}

onMounted(() => {
  loadHistory()
  loadTrend()
})
</script>

<style scoped>
.record-actions {
  margin: 4px 20px 12px;
}
.record-time {
  color: #969799;
  font-size: 12px;
}
.load-more {
  padding: 12px;
  text-align: center;
  color: #576b95;
  font-size: 14px;
}
.trend-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: #646566;
}
</style>
