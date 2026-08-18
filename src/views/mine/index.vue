<template>
  <div class="mine-page">
    <van-nav-bar title="我的" fixed placeholder safe-area-inset-top />

    <!-- 个人资料卡 -->
    <div class="mine-hero" @click="go('/profile')">
      <van-image round width="58" height="58" :src="auth.userInfo?.avatar || ''" class="mine-avatar">
        <template #error>
          <div class="avatar-fallback">🧓</div>
        </template>
      </van-image>
      <div class="mine-user">
        <div class="mine-name">{{ auth.realName || auth.phone }}</div>
        <div class="mine-sub">{{ auth.phone }} · {{ enumText('memberLevel', auth.memberLevel) }}</div>
      </div>
      <van-icon name="arrow" class="mine-arrow" />
    </div>

    <!-- 积分概览 -->
    <van-cell-group inset class="mine-points" @click="go('/points')">
      <van-cell title="当前积分" is-link>
        <template #value>
          <span class="points-num">{{ auth.points }}</span>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 功能菜单 -->
    <van-cell-group inset title="常用功能">
      <van-cell icon="chat-o" title="AI 健康助手" is-link @click="go('/chat')" />
      <van-cell icon="todo-list-o" title="健康评测" is-link @click="go('/assessment')" />
      <van-cell icon="records-o" title="我的评测记录" is-link @click="go('/assessment/history')" />
      <van-cell icon="shop-o" title="体检预约" is-link @click="go('/appointment')" />
      <van-cell icon="calendar-o" title="我的预约" is-link @click="go('/appointment/mine')" />
    </van-cell-group>

    <van-cell-group inset title="我的信息">
      <van-cell icon="volume-o" title="消息中心" is-link @click="go('/message')">
        <template #right-icon>
          <van-badge v-if="unread > 0" :content="unread > 99 ? '99+' : unread" />
          <van-icon name="arrow" class="cell-arrow" />
        </template>
      </van-cell>
      <van-cell icon="gem-o" title="积分明细" is-link @click="go('/points')" />
      <van-cell icon="manager-o" title="个人信息" is-link @click="go('/profile')" />
      <van-cell icon="lock" title="修改密码" is-link @click="go('/password')" />
    </van-cell-group>

    <div class="logout-wrap">
      <van-button round block type="danger" plain :loading="logoutLoading" @click="doLogout">退出登录</van-button>
    </div>

    <div class="empty-pad" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast } from 'vant'
import { logout } from '../../api/auth'
import { getUnreadCount } from '../../api/message'
import { useAuthStore } from '../../store/auth'
import { enumText } from '../../utils/format'

const router = useRouter()
const auth = useAuthStore()
const unread = ref(0)
const logoutLoading = ref(false)

function go(path) {
  router.push(path)
}

async function doLogout() {
  try {
    await showConfirmDialog({ title: '提示', message: '确定要退出登录吗？' })
  } catch {
    return
  }
  logoutLoading.value = true
  try {
    if (auth.refreshToken) {
      try {
        await logout(auth.refreshToken)
      } catch {
        /* 登出接口失败不影响本地清除 */
      }
    }
    auth.clear()
    showSuccessToast('已退出登录')
    router.replace('/login')
  } finally {
    logoutLoading.value = false
  }
}

onMounted(async () => {
  try {
    const d = await getUnreadCount()
    unread.value = d.unread || 0
  } catch {
    /* 忽略 */
  }
})
</script>

<style scoped>
.mine-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 20px;
  background: linear-gradient(135deg, #f4a259 0%, #e8843c 100%);
  color: #fff;
  cursor: pointer;
}
.avatar-fallback {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}
.mine-user {
  flex: 1;
}
.mine-name {
  font-size: 20px;
  font-weight: 600;
}
.mine-sub {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.9;
}
.mine-arrow {
  opacity: 0.8;
}
.mine-points {
  margin-top: 10px;
}
.points-num {
  color: #d97c2b;
  font-size: 18px;
  font-weight: 700;
}
.cell-arrow {
  margin-left: 6px;
  color: #969799;
}
.logout-wrap {
  margin: 24px 20px;
}
</style>
