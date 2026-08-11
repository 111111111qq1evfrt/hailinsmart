<template>
  <transition
    mode="out-in"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @enter="onEnter"
    @after-enter="onAfterEnter"
  >
    <div :key="tabKey" class="tab-fade-box">
      <slot />
    </div>
  </transition>
</template>

<script setup>
import gsap from 'gsap'
defineProps({ tabKey: String })

const onBeforeLeave = (el) => gsap.set(el, { willChange: 'transform, opacity' })
const onLeave = (el, done) => gsap.to(el, { y: -8, opacity: 0, duration: 0.18, ease: 'power2.in', onComplete: done })
const onEnter = (el, done) => gsap.fromTo(el, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out', clearProps: 'willChange', onComplete: done })
const onAfterEnter = (el) => gsap.set(el, { clearProps: 'all' })
</script>

<style>
.tab-fade-box { width: 100%; }
</style>