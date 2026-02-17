<script setup lang="ts">
import { computed } from "vue";

interface Props {
  content?: string;
  speed?: "slow" | "normal" | "fast";
  backgroundColor?: string;
  textColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  content: "🎉 Welcome to Gelitik Analytics • Track your social media performance • Real-time insights available • New features coming soon! 🚀",
  speed: "normal",
  backgroundColor: "#FFCC00",
  textColor: "#000000",
});

const speedClass = computed(() => {
  const speeds = {
    slow: "marquee-slow",
    normal: "marquee-content",
    fast: "marquee-fast",
  };
  return speeds[props.speed];
});
</script>

<template>
  <div
    class="brutal-marquee w-full overflow-hidden border-b-2 border-black dark:border-white"
    :style="{ backgroundColor: props.backgroundColor, color: props.textColor }">
    <div :class="['whitespace-nowrap py-1 px-4 inline-block min-w-full', speedClass]">
      <span class="text-[9px] font-black uppercase tracking-tight inline-block">
        {{ content }}
      </span>
      <span class="text-[9px] font-black uppercase tracking-tight mx-6 inline-block">
        {{ content }}
      </span>
      <span class="text-[9px] font-black uppercase tracking-tight inline-block">
        {{ content }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Normal speed (20s) */
.marquee-content {
  animation: marquee 20s linear infinite;
}

/* Slow speed (40s) */
.marquee-slow {
  animation: marquee 40s linear infinite;
}

/* Fast speed (10s) */
.marquee-fast {
  animation: marquee 10s linear infinite;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-33.33%); }
}

.brutal-marquee:hover .marquee-content,
.brutal-marquee:hover .marquee-slow,
.brutal-marquee:hover .marquee-fast {
  animation-play-state: paused;
}
</style>
