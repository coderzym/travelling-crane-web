import request from "@/utils/request";

// http api
const urlLists = {
  /**
   * ! ---------------------- 用户登录 ----------------------
   */
  login: "/login", // 登录
  logout: "/logout", // 登出
  getUsers: "/user/list", // 获取用户列表
  addUser: "/user/addUser", // 添加用户
  delUsers: "/user/delUsers", // 批量删除用户
  updateBaseUser: "/user/updateBaseUser", // 修改用户
  addUserRole: "/user/addUserRole", // 给用户分配角色
};

const login = params => {
  return request.post(urlLists.login, params);
};

const logout = () => {
  return request.get(urlLists.logout);
};

const getUsers = params => {
  return request.get(urlLists.getUsers, params);
};

const addUser = params => {
  return request.post(urlLists.addUser, params);
};

const delUsers = params => {
  return request.post(urlLists.delUsers, params);
};

const updateBaseUser = params => {
  return request.post(urlLists.updateBaseUser, params);
};

const addUserRole = params => {
  return request.post(urlLists.addUserRole, params);
};

export default {
  login,
  logout,
  getUsers,
  addUser,
  delUsers,
  updateBaseUser,
  addUserRole,
};
