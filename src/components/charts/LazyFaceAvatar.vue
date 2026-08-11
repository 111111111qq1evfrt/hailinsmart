<template>
  <el-avatar :size="size">
    <img v-if="facePhotoData" :src="facePhotoData" class="avatar-img" />
    <Loading v-else-if="loading" />
    <UserFilled v-else />
  </el-avatar>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { UserFilled, Loading } from '@element-plus/icons-vue'
import { getStudentFaceImage } from '@/utils/daiweiApi'

const props = defineProps({
  cimgUrl: {
    type: String,
    default: ''
  },
  facePhoto: {
    type: String,
    default: ''
  },
  schoolId: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 32
  }
})

const emit = defineEmits(['loaded'])

const facePhotoData = ref(props.facePhoto || '')
const imageFailed = ref(false)
const loading = ref(false)

const loadImage = async () => {
  // 如果外部传入了已加载的 base64，直接用
  if (props.facePhoto) {
    facePhotoData.value = props.facePhoto
    imageFailed.value = false
    return
  }
  // 没有 cimgUrl 就显示占位图标
  if (!props.cimgUrl) {
    facePhotoData.value = ''
    imageFailed.value = false
    return
  }
  // 从大沩 API 加载图片
  imageFailed.value = false
  loading.value = true
  const base64 = await getStudentFaceImage(props.cimgUrl, props.schoolId)
  loading.value = false
  if (base64) {
    facePhotoData.value = base64
    emit('loaded', base64)
  } else {
    facePhotoData.value = ''
    imageFailed.value = true
  }
}

// props 变化时重置并重新加载（解决 el-table 复用组件实例的问题）
watch(
  () => [props.cimgUrl, props.facePhoto],
  () => {
    nextTick(() => loadImage())
  }
)

// 初始加载
loadImage()
</script>

<style scoped>
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
