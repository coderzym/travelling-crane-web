import axios from "axios";
import { Message } from "element-ui";
import store from "@/store";
// import { getToken } from "@/utils/auth"; // 把 token 放进 localStorage 中：const TokenKey = "Admin-Token";
import qs from "qs";
import appConfig from "@/config/index";
import storage from "@/utils/storage/index";

// 创建 axios 实例
const service = axios.create({
  // baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // 当跨域请求发送cookie
  timeout: 20000, // 请求超时
  validateStatus(status) {
    switch (status) {
      case 400:
        Message.error("请求出错");
        break;
      case 401:
        Message.warning({
          message: "授权失败，请重新登录",
        });
        // store.commit('LOGIN_OUT');
        // setTimeout(() => {
        //     window.location.reload();
        // }, 1000);
        return;
      case 403:
        Message.warning({
          message: "拒绝访问",
        });
        break;
      case 404:
        Message.warning({
          message: "请求错误,未找到该资源",
        });
        break;
      case 500:
        Message.warning({
          message: "服务端错误",
        });
        break;
      default:
        break;
    }
    return status >= 200 && status < 300;
  },
});

// post请求头
// service.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded;";

// 请求拦截器
service.interceptors.request.use(
  config => {
    if (!(config.url.includes("/user") || config.url.includes("/role"))) {
      config.headers.post["Content-Type"] = "application/x-www-form-urlencoded;";
    }

    if (config.url.includes("/user/delUsers") || config.url.includes("/role/list")) {
      config.headers.post["Content-Type"] = "application/x-www-form-urlencoded;";
    }

    if (config.url.includes("/menu/addMenu")) {
      config.headers.post["Content-Type"] = "application/json;";
    }

    if (config.url.includes("/updateBaseMesh")) {
      config.headers.post["Content-Type"] = "application/json;";
    }

    // 在发送请求之前做的事情
    // 如果 Vuex 中有token
    if (store.getters.token) {
      // 让当前请求携带token令牌
      // ['X-Token'] 是一个自定义 headers key
      // 根据实际情况修改此key
      config.headers["Authorization"] = storage.getToken();
    }
    return config;
  },
  error => {
    // 请求出错后做的事情
    console.log(error); // for debug
    return Promise.reject(error);
  },
);

// response interceptor
service.interceptors.response.use(
  /**
   * 如果你想获得http的 headers 或 status 等信息
   * 需要 return  response => response
   */

  /**
   * 根据后端自定义code来判断响应状态
   * 下面只是个例子
   * 你也可以通过HTTP状态码来判断
   */
  response => {
    const httpStatus = Number(response.status);
    const resCode = Number(response.data.resCode || response.data.code);
    const msg = response.data.msg;

    if (httpStatus !== 200) {
      if (httpStatus >= 400 && httpStatus < 500) {
        Message.warning({
          message: "网络错误",
        });
      } else {
        Message.warning({
          message: "服务器错误",
        });
      }
      return Promise.reject(response);
    }
    // 不是10000，不管data是啥，return null
    if (resCode !== 10000) {
      if (resCode === 10016) {
        store.dispatch("user/resetToken");
      }
      Message.warning({
        message: msg,
      });
      return null;
    }
    if (response.data.data == null) {
      if (resCode === 10000) {
        response.data.data = true;
      }
    }
    // 1. code === 10000;
    //  1.1 result为null;return true
    //  1.2 result不是null,return对应值
    // 2. code !== 10000;
    //  1.1 不管result是什么，都return null
    return response.data.data;

    // TODO: 下面是原vue-element-admin业务逻辑
    // const res = response.data;
    // // 如果自定义代码不是20000,则视为error
    // if (res.code !== 20000) {
    //   Message({
    //     message: res.message || 'Error',
    //     type: 'error',
    //     duration: 5 * 1000
    //   });

    //   // 50008: 非法的token令牌; 50012: 其他客户登录; 50014: token令牌过期;
    //   if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
    //     // 重新登录
    //     MessageBox.confirm('您的登录状态已过期，您可以重新登录或者继续停留在此页面', '确认注销', {
    //       confirmButtonText: '重新登录',
    //       cancelButtonText: '取消',
    //       type: 'warning'
    //     }).then(() => {
    //       store.dispatch('user/resetToken').then(() => {
    //         location.reload();
    //       });
    //     });
    //   }
    //   return Promise.reject(new Error(res.message || 'Error'));
    // }
    // return res;
  },
  error => {
    console.log("err" + error); // for debug
    Message({
      message: error.message,
      type: "error",
      duration: 5 * 1000,
    });
    return Promise.reject(error);
  },
);

// 包装请求
let request = {};
const base = appConfig.baseURL; // url = base url + request url
request.get = (url, params, baseURL = base) => {
  return service.get(url, { params, baseURL });
};
request.post = (url, params, baseURL = base) => {
  // service.defaults.headers["Content-Type"] = "application/x-www-form-urlencoded;";
  return service.post(
    url,
    // mock环境下，直接传data: params 的形式
    // https://github.com/PanJiaChen/vue-element-admin/issues/1478#issuecomment-450476984
    // qs.stringify(params) 配合上边注释的 ["Content-Type"] = "application/x-www-form-urlencoded;"; 使用
    // 如果不设置 application/x-www-form-urlencoded; 则都用 params ，不用qs转
    url.includes("/user") || url.includes("/role") || url.includes("/menu")
      ? url.includes("/role/list") || url.includes("/user/delUsers") || url.includes("/menu/updateMenu")
        ? qs.stringify(params)
        : params
      : url.includes("/updateBaseMesh")
      ? params
      : qs.stringify(params),
    { baseURL },
  );
};
request.put = (url, params, baseURL = base) => {
  return service.put(url, params, { baseURL });
};
// axios delete 没有 params 参数，传参要么直接放url后面，要么通过 config 的 data 传入
request.delete = (url, params, baseURL = base) => {
  return service.delete(url, {
    baseURL,
    data: params,
  });
};

export default request;
