import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { bootstrapAppState } from "./bootstrap";
import "./styles/tailwind.css";
import "./styles/themes.css";
import "./styles/pattern.css";

bootstrapAppState().finally(() => {
  createApp(App).use(router).mount("#app");
});
