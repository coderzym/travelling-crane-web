// Just a mock data

const constantRoutes = [
  {
    path: "/redirect",
    component: "layout/Layout",
    hidden: true,
    children: [
      {
        path: "/redirect/:path*",
        component: "views/redirect/index",
      },
    ],
  },
  {
    path: "/login",
    component: "views/login/index",
    hidden: true,
  },
  {
    path: "/auth-redirect",
    component: "views/login/auth-redirect",
    hidden: true,
  },
  {
    path: "/404",
    component: "views/error-page/404",
    hidden: true,
  },
  {
    path: "/401",
    component: "views/error-page/401",
    hidden: true,
  },
];

const asyncRoutes = [
  {
    path: "/permission",
    component: "layout/Layout",
    redirect: "/permission/index",
    alwaysShow: true,
    meta: {
      title: "Permission",
      icon: "lock",
      roles: ["admin", "editor"],
    },
    children: [
      {
        path: "page",
        component: "views/permission/page",
        name: "PagePermission",
        meta: {
          title: "Page Permission",
          roles: ["admin"],
        },
      },
      {
        path: "directive",
        component: "views/permission/directive",
        name: "DirectivePermission",
        meta: {
          title: "Directive Permission",
        },
      },
      {
        path: "role",
        component: "views/permission/role",
        name: "RolePermission",
        meta: {
          title: "Role Permission",
          roles: ["admin"],
        },
      },
    ],
  },
  {
    path: "/nested",
    component: "layout/Layout",
    redirect: "/nested/menu1/menu1-1",
    name: "Nested",
    meta: {
      title: "Nested",
      icon: "nested",
    },
    children: [
      {
        path: "menu1",
        component: "views/nested/menu1/index",
        name: "Menu1",
        meta: { title: "Menu1" },
        redirect: "/nested/menu1/menu1-1",
        children: [
          {
            path: "menu1-1",
            component: "views/nested/menu1/menu1-1",
            name: "Menu1-1",
            meta: { title: "Menu1-1" },
          },
          {
            path: "menu1-2",
            component: "views/nested/menu1/menu1-2",
            name: "Menu1-2",
            redirect: "/nested/menu1/menu1-2/menu1-2-1",
            meta: { title: "Menu1-2" },
            children: [
              {
                path: "menu1-2-1",
                component: "views/nested/menu1/menu1-2/menu1-2-1",
                name: "Menu1-2-1",
                meta: { title: "Menu1-2-1" },
              },
              {
                path: "menu1-2-2",
                component: "views/nested/menu1/menu1-2/menu1-2-2",
                name: "Menu1-2-2",
                meta: { title: "Menu1-2-2" },
              },
            ],
          },
          {
            path: "menu1-3",
            component: "views/nested/menu1/menu1-3",
            name: "Menu1-3",
            meta: { title: "Menu1-3" },
          },
        ],
      },
      {
        path: "menu2",
        name: "Menu2",
        component: "views/nested/menu2/index",
        meta: { title: "Menu2" },
      },
    ],
  },

  {
    path: "/error",
    component: "layout/Layout",
    redirect: "noRedirect",
    name: "ErrorPages",
    meta: {
      title: "Error Pages",
      icon: "404",
    },
    children: [
      {
        path: "401",
        component: "views/error-page/401",
        name: "Page401",
        meta: { title: "Page 401", noCache: true },
      },
      {
        path: "404",
        component: "views/error-page/404",
        name: "Page404",
        meta: { title: "Page 404", noCache: true },
      },
    ],
  },

  {
    path: "/i18n",
    component: "layout/Layout",
    children: [
      {
        path: "index",
        component: "views/i18n-demo/index",
        name: "I18n",
        meta: { title: "I18n", icon: "international" },
      },
    ],
  },

  {
    path: "external-link",
    component: "layout/Layout",
    children: [
      {
        path: "https://github.com/PanJiaChen/vue-element-admin",
        meta: { title: "External Link", icon: "link" },
      },
    ],
  },

  { path: "*", redirect: "/404", hidden: true },
];

module.exports = {
  constantRoutes,
  asyncRoutes,
};
