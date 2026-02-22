import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

import { createPinia } from "pinia";
import { initTheme } from "./composables/useTheme";

// Initialize theme BEFORE mounting to prevent FOUC (flash of unstyled content)
initTheme();

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
