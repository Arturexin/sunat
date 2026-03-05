import EmployeesView from "../views/EmployeesView.vue";
import HomeView from "../views/HomeView.vue";
import ProjectView from "../views/ProjectView.vue";
import LocationView from "../views/LocationView.vue";
import LoginView from "../views/LoginView.vue";
import NotFoundView from "../views/NotFoundView.vue";

export const navBarRoutes = [
    // { path: '/:pathMatch(.*)*', component: NotFoundView },
    { path: '/login', component: LoginView, name: 'login' },
    { path: '/home', component: HomeView, name: 'home', meta:{ secure: true } },
    { path: '/employees', component: EmployeesView, name: 'employees', meta:{ secure: true } },
    { path: '/project', component: ProjectView, name: 'project', meta:{ secure: true } },
    { path: '/location', component: LocationView, name: 'location', meta:{ secure: true } },
    { path: '/:pathMatch(.*)*', component: NotFoundView, name: 'notfound'},
]