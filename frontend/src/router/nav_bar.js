import EmployeesView from "../views/EmployeesView.vue";
import HomeView from "../views/HomeView.vue";
import ProjectView from "../views/ProjectView.vue";
import LocationView from "../views/LocationView.vue";
import AreaView from "../views/AreaView.vue";

export const navBarRoutes = [
    // { path: '/:pathMatch(.*)*', component: NotFoundView },
    { path: '/', component: HomeView, name: 'home'},
    { path: '/employees', component: EmployeesView, name: 'employees'},
    { path: '/project', component: ProjectView, name: 'project'},
    { path: '/area', component: AreaView, name: 'area'},
    { path: '/location', component: LocationView, name: 'location'},

    // { path: '/dashboard', component: DashBoardView, name: 'dashboard',
    //     meta:{
    //         secure: true
    //     }
    // },
    // { path: '/transit', component: TransitView, name: 'asistencia',
    //     meta:{
    //         secure: true
    //     }
    // },
    // { path: '/employees', component: EmployeesView, name: 'colaborador',
    //     meta:{
    //         secure: true
    //     }
    // },
    // { path: '/location', component: LocationView, name: 'sucursal',
    //     meta:{
    //         secure: true
    //     }
    // },
    // { path: '/qr', component: QrView, name: 'qr',
    //     meta:{
    //         secure: true
    //     }
    // },
    // { path: '/planilla', component: PlanillaView, name: 'planilla',
    //     meta:{
    //         secure: true
    //     }
    // },
]