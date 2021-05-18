import { Socket } from "@/utils/socket/index";

// ws api
const wsLists = {
  /**
   * ! ---------------------- WebSocket 连接 ----------------------
   */
  wsTestData: "ws://127.0.0.1:3000/websocket/test",
  wsHomeData: "/imserver/equipmentStatus",
};

const wsTestData = () => {
  return new Socket({ baseURL: wsLists.wsTestData });
};
const wsHomeData = ops => {
  let options = {
    // url: 'ws://127.0.0.1:3000/websocket/test'
    reqURL: wsLists.wsHomeData,
  };
  Object.assign(options, ops);
  return new Socket(options);
};

export default {
  wsHomeData,
  wsTestData,
};
