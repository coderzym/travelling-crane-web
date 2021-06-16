<template>
  <div class="overview-container">
    <div class="inner-wrapper d-inline-flex flex-wrap a-center j-start">
      <div class="item d-flex a-center j-start"> 地面工作台：</div>
      <div class="item">
        <el-switch
          v-model="studio.networkState"
          :active-color="activeColor"
          :inactive-color="inactiveColor"
          :class="{ 'sw-inactive': !studio.networkState }"
          :active-text="activeText"
          :disabled="studio.disabled"
          @change="_toggleOverviewNetwork"
        />
      </div>
    </div>
    <div class="inner-wrapper d-inline-flex flex-wrap a-center j-start">
      <div class="item d-flex a-center j-start ml-5"> 中控操作站：</div>
      <div class="item">
        <el-switch
          v-model="centerControlStudio.networkState"
          :active-color="activeCenterControlColor"
          :inactive-color="inactiveCenterControlColor"
          :class="{ 'sw-inactive': !centerControlStudio.networkState }"
          :active-text="activeCenterControlText"
          :disabled="centerControlStudio.disabled"
          @change="_toggleCenterControlNetwork"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Overview",
  props: {
    studio: {
      type: Object,
      default: () => ({
        disabled: false, // switch是否可用
        networkState: false, // 网络连接状态：true 连接 false 断开
      }),
    },
    centerControlStudio: {
      type: Object,
      default: () => ({
        disabled: false, // switch是否可用
        networkState: false, // 网络连接状态：true 连接 false 断开
      }),
    },
    toggleOverviewNetwork: {
      type: Function,
      default: () => {},
    },
    toggleCenterControlNetwork: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return {
      activeColor: "rgba(12, 121, 233, 0.7)",
      activeCenterControlColor: "rgba(12, 121, 233, 0.7)",
      activeText: "请求中...", // 活动时的switch文字描述
      activeCenterControlText: "请求中...",
      inactiveColor: "#515151",
      inactiveCenterControlColor: "#515151",
    };
  },
  watch: {
    studio: {
      deep: true,
      handler(val, oldVal) {
        this.activeText = val.disabled ? "请求中..." : val.networkState ? "已连接" : "已断开";
        this.studio.networkState = val.disabled ? oldVal.networkState : val.networkState;
      },
    },
    centerControlStudio: {
      deep: true,
      handler(val, oldVal) {
        this.activeCenterControlText = val.disabled ? "请求中..." : val.networkState ? "已连接" : "已断开";
        this.centerControlStudio.networkState = val.disabled ? oldVal.networkState : val.networkState;
      },
    },
  },
  methods: {
    // 状态描述
    studioStatus(val) {
      let status = {};
      switch (val) {
        case 1:
          status.desc = "脱机";
          status.class = "";
          break;
        case 2:
          status.desc = "待机";
          status.class = "operation";
          break;
        default:
          // 0
          status.desc = "通讯断开";
          status.class = "";
          break;
      }
      return status;
    },
    _toggleOverviewNetwork(val) {
      this.$nextTick(() => {
        this.activeText = val ? "连接中..." : "断开中...";
      });
      this.$emit("toggleOverviewNetwork", val);
    },
    _toggleCenterControlNetwork(val) {
      this.$nextTick(() => {
        this.activeCenterControlText = val ? "连接中..." : "断开中...";
      });
      this.$emit("toggleCenterControlNetwork", val);
    },
  },
};
</script>

<style lang="scss" scoped>
.inner-wrapper {
  max-width: 518px;
  min-height: 46px;
  background: $bgColor;
  border-radius: 4px;

  .item {
    font-family: Microsoft YaHei;
    font-size: 18px;
    font-weight: 400;
    line-height: 40px;
    color: #666;

    &:first-of-type {
      font-family: Microsoft YaHei;
      font-size: 18px;
      font-weight: bold;
      line-height: 40px;
      color: #000;
    }

    span.first {
      color: $standby;

      &.operation {
        color: $operation;
      }
    }

    span {
      margin-right: 10px;
    }
  }
}

::v-deep {
  .el-switch {
    // active给内高亮
    .el-switch__core {
      background: #1687ff !important;
      border-color: #1687ff !important;
    }

    // inactive不要内高亮
    &.sw-inactive {
      .el-switch__core {
        background: #8b8b8b !important;
        border-color: #8b8b8b !important;
      }
    }
  }

  .el-switch.is-disabled {
    opacity: 1 !important;
  }
}
</style>
