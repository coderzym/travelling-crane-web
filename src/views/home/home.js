// 组件
import Overview from "./components/Overview";
import HcCards from "./components/HcCards";

// api
import $home from "@/api/home";
import $reservoir from "@/api/reservoir";
import $hc from "@/api/hc";

// 全局变量
const initStatus = () => {
  return {
    disabled: false, // switch是否可用
    networkState: false, // 网络状态：true 连接 false 断开
  };
};

const initCenterControlStatus = () => {
  return {
    disabled: false, // switch是否可用
    networkState: false, // 网络状态：true 连接 false 断开
  };
};

export default {
  name: "Home",
  data() {
    return {
      wbSocket: null, // ws对象
      isConnect: false, // ws连接状态

      studio: initStatus(), // 地面工作台

      centerControlStudio: initCenterControlStatus(), // 中控站

      hcCardsArr: [], // 行车卡片列表

      hcTaskList: [], // 行车作业列表
      hcStatusList: [], // 行车当前作业状态

      playground: {}, // 库区

      isShowEditTaskDialog: false, // 是否显示新增/编辑作业弹窗
      taskObj: {
        cId: "", // 行车id
        commandType: "", // 指令/作业类型
        inId: "", // 抓料池id
        outId: "", // 放料池id
      }, // 新增作业所需参数
      hcCommandList: [], // 行车作业/指令类型
      inputPoolList: [], // 抓料池
      outputPoolList: [], // 放料池
      isFaultListAlive: false, // 判断当前页面中是否有报警弹框
      allinputID: [],
    };
  },
  components: {
    Overview,
    HcCards,
  },
  mounted() {
    // 初始化ws
    this.initWebSocket();
  },
  methods: {
    /**
     * ! ---------------------- websocket ----------------------
     */
    // 初始化websocket
    initWebSocket() {
      this.wbSocket = $home.wsHomeData({
        openCb: data => {
          console.log(`openCb WebSocket 已连接`, {
            data,
          });
          this.isConnect = true;
          this.getPlayground();
        },
        messageCb: res => {
          this.isConnect = true;
          let { code, data } = JSON.parse(res);
          if (code === 20000) {
            console.log("ws 行车第一次加载", JSON.parse(res));
            // 第一次连接 - 行车
            this.refreshUpdateData(data);
          } else if (code === 20100) {
            // 行车的后续更新
            // 更新
            let targetIdx = this.hcCardsArr.findIndex(item => item.code === data.code);
            let target = this.hcCardsArr[targetIdx];
            console.log("ws 行车单个的后续更新", data, "目标行车", target);
            if (targetIdx > -1) {
              // 行车列表的更新逻辑
              if (data.status !== target.status) {
                // 指令状态 改变 刷新两个列表
                this.getHcTaskList();
                this.getHcStatusList();
              } else if (data.status === target.status && JSON.stringify(data.currentTask) !== JSON.stringify(target.currentTask)) {
                // 指令状态不变，但 currentTask 变化了，找到当前行车作业列表中的目标行车，更新它
                this.hcTaskList = this.hcTaskList.map(item => {
                  if (item.code === data.currentTask.code) {
                    item = data.currentTask;
                  }
                  return item;
                });
                let hcStatusTargetIdx = this.hcStatusList.findIndex(item => item.craneId === data.currentTask.currentTaskLog.craneId);
                if (hcStatusTargetIdx > -1) {
                  // 行车当前作业状态中有「这个目标对象」，更新这个对象
                  this.$set(this.hcStatusList, hcStatusTargetIdx, data.currentTask.currentTaskLog);
                } else {
                  // 没有，更新整个行车状态列表
                  this.getHcTaskList();
                }
              }

              // 行车卡片的更新逻辑
              data = {
                ...data,
                networkDisabled: false,
                deviceDisabled: false,
              };
              this.$set(this.hcCardsArr, targetIdx, data);
              // 如果有故障，则弹窗
              if (target.faultStatus) {
                // 车辆有故障的时候进行报警
                this.$refs.hcCards.warningCard(target);
                // 如果页面中有弹框，仅改变TableData
                if (this.isFaultListAlive) {
                  this.$refs.FaultList.changeTableData(target.errorFaults);
                } else {
                  // 如果页面中没有弹框，就正常弹出，并且改变全局变量isFaultListAlive
                  this.$refs.FaultList.open("行车故障报警", target.errorFaults);
                  this.isFaultListAlive = true;
                }
              }
            }
          } else if (code === 20200) {
            console.log("ws 地面工作台的更新", data);
            // 地面工作台的更新
            this.studio = {
              ...this.studio,
              ...data,
            };
          } else if (code === 20300) {
            console.log("ws 中控操作站的更新", data);
            // 中控操作站的更新
            this.centerControlStudio = {
              ...this.centerControlStudio,
              ...data,
            };
          } else {
            console.log("ws 失败");
            // 失败
            this.hcCardsArr = [];
            this.studio = initStatus();
          }
        },
        closeCb: data => {
          this.isConnect = false;
          console.log("closeCb WebSocket连接已关闭", data);
        },
        errorCb: event => {
          this.isConnect = false;
          console.log("errorCb WebSocket连接出错", event);
        },
      });
    },
    // 第一次连接 （行车和地面工作台）
    refreshUpdateData(data) {
      if (Array.isArray(data)) {
        // 行车（数组）
        this.hcCardsArr = data.map(hc => {
          return {
            ...hc,
            networkDisabled: false,
            deviceDisabled: false,
          };
        });
        // 初始化新增任务的行车id
        if (this.hcCardsArr.length > 0) {
          const [first] = this.hcCardsArr;
          this.taskObj.cId = first.id;
          this.$store.commit("hc/SET_HcLIST", this.hcCardsArr);
        } else {
          this.taskObj.cId = "";
          this.$store.commit("hc/SET_HcLIST", []);
        }
      }
    },
    // 请求总库区图纸
    async getPlayground() {
      console.log(1);
      const [err, data] = await $reservoir.getPlayground();
      if (err) return;
      console.log("getPlayground 获取区域图纸", data);
      // 中轴翻转
      // this.axialFlip(data);
      this.playground = data;
      this.allinputID = this.playground.input;
    },
    /**
     * ! ---------------------- 地面工作台、中控操作站 ----------------------
     */
    // 切换studio网络连接
    async toggleOverviewNetwork(val) {
      this.studio.disabled = true;
      const [, data] = await $hc.toggleGroundConnect({
        onOrOff: val,
      });
      this.studio.networkState = data ? val : !val;
      this.studio.disabled = false;
    },
    // 切换中控站网络连接
    async toggleCenterControlNetwork(val) {
      this.centerControlStudio.disabled = true;
      const [, data] = await $hc.toggleCenterControlConnect({
        onOrOff: val,
      });
      this.centerControlStudio.networkState = data ? val : !val;
      this.centerControlStudio.disabled = false;
    },
    /**
     * ! ---------------------- 行车滚动卡片 ----------------------
     */
    // 切换行车网络连接
    async toggleNetwork(hc, val) {
      let target = this.hcCardsArr.find(card => card.code === hc.code);
      console.log(target);
      if (target) {
        target.networkDisabled = true;
        const [err] = await $hc.toggleConnect({
          code: target.code,
          onOrOff: val,
        });
        target.networkDisabled = false;
        // 失败时，恢复网络连接状态
        if (err) {
          target.networkState = !target.networkState;
        }
      }
    },
    // 切换行车设备状态
    async toggleStatus(hc, val) {
      let target = this.hcCardsArr.find(card => card.code === hc.code);
      if (target) {
        target.deviceDisabled = true;
        const [err] = await $hc.toggleOnline({
          code: target.code,
          onOrOff: val,
        });
        target.deviceDisabled = false;
        // 失败时，恢复网络设备状态
        if (err) {
          target.deviceState = !target.deviceState;
        }
      }
    },
    // 切换行车手动-自动状态
    async toggleAutoMode(hc, val) {
      console.log("toggleAutoMode 手动-自动状态", val);
      let target = this.hcCardsArr.find(card => card.code === hc.code);
      if (target) {
        const [, result] = await $hc.toggleAutoMode({
          code: target.code,
          onOrOff: val,
        });
        if (result) {
          target.workPattern = !target.workPattern;
        }
      }
    },
    // 故障复位
    triggerReset(hc) {
      let target = this.hcCardsArr.find(card => card.code === hc.code);
      if (target) {
        this.$confirm
          .handleConfirm(`是否确认对${hc.name}实施故障复位操作？`, "故障复位操作提醒")
          .then(async res => {
            console.log("故障复位操作提醒", res);
            let [, result] = await $hc.triggerReset({
              code: target.code,
            });
            if (result) {
              this.$message({
                type: "success",
                message: "复位成功",
              });
            }
          })
          .catch(() => {
            // console.log('已取消');
          });
      }
    },
    // 急停
    async triggerStop(hc) {
      let target = this.hcCardsArr.find(card => card.code === hc.code);
      if (target) {
        this.$confirm
          .handleConfirm(`是否确认对${hc.name}实施急停操作？急停会强行中止行车作业？`, "急停操作提醒")
          .then(async res => {
            console.log("急停操作提醒", res);
            let [, result] = await $hc.triggerStop({
              code: target.code,
            });
            if (result) {
              this.$message({
                type: "success",
                message: "急停成功",
              });
            }
          })
          .catch(() => {
            // console.log('已取消');
          });
      }
    },
  },
};
