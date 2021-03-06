import Vue from "vue"
import VueRouter from "vue-router"
import catalogPage from "./views/catalogPage"
import threadPage from "./views/threadPage"
import homePage from "./views/homePage"
Vue.use(VueRouter);

const routes = [
    {path: "/", component: homePage, name: "homePage"},
    { path: "/:board/catalog", component: catalogPage, name: "catalogPage", props: true},
    { path: "/:board/thread/:threadNumber/:postNumber?", component: threadPage, name: "threadPage", props: true}
];

const router = new VueRouter({
    routes
})

export default router