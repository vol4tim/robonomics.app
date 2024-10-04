import { createRouter, createWebHashHistory } from "vue-router";
import Home from "./views/Home.vue";
import PathNotFound from "./views/PathNotFound.vue";
import RwsActivate from "./views/RwsActivate.vue";
import RwsSetup from "./views/RwsSetup.vue";
import RwsSetupNew from "./views/RwsSetupNew.vue";
import Services from "./views/Services.vue";
import Telemetry from "./views/telemetry/Telemetry.vue";
import Web3 from "./views/web3/Page.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: {
      title: "Dashboard"
    }
  },
  {
    path: "/rws-buy",
    name: "rwsActivate",
    component: RwsActivate,
    meta: {
      title: "Buy a Subscription"
    }
  },
  {
    path: "/rws-setup",
    name: "rwsSetup",
    component: RwsSetup,
    meta: {
      title: "Setup a Subscription"
    }
  },
  {
    path: "/rws-setup-new",
    name: "rwsSetupNew",
    component: RwsSetupNew,
    meta: {
      title: "New Subscription setup"
    }
  },
  {
    path: "/telemetry",
    name: "telemetry",
    component: Telemetry,
    meta: {
      title: "Devices control panel"
    }
  },
  {
    path: "/services",
    name: "services",
    component: Services,
    meta: {
      title: "Services"
    }
  },
  {
    path: "/robonomics-club",
    name: "robonomics-club",
    component: Web3,
    meta: {
      title: "Robonomics club"
    }
  },
  { path: "/:pathMatch(.*)*", component: PathNotFound }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
