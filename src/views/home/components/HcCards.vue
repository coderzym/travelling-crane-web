<template>
  <div class="hc-cards-container">
    <div class="inner-wrapper d-flex">
      <div v-for="card in cards" :key="card.code" class="card d-flex flex-column">
        <div class="block" :class="[card.className]">
          <!-- 行车名称 -->
          <div class="title pl-1"
            ><span class="gradient-text-color">{{ card.name }}</span
            >：<span>{{ card.label }}</span></div
          >
          <!-- 连接状态 -->
          <div class="d-flex connection-status px-1">
            <div class="item flex-1 d-flex a-center">
              <span class="pr-1">网络连接</span>
              <el-switch
                v-model="card.networkState"
                :active-color="activeColor"
                :inactive-color="inactiveColor"
                :disabled="card.networkDisabled"
                :class="{ 'sw-inactive': !card.networkState }"
                @change="_toggleNetwork(card, $event)"
              />
            </div>
            <div class="item flex-1 d-flex a-center">
              <span class="pr-1">设备状态</span>
              <el-switch
                v-model="card.deviceState"
                :active-color="activeColor"
                :inactive-color="inactiveColor"
                :disabled="card.deviceDisabled"
                :class="{ 'sw-inactive': !card.deviceState }"
                @change="_toggleStatus(card, $event)"
              />
            </div>
          </div>
          <!-- 位置信息 -->
          <div class="d-flex pos-info p-1">
            <div class="item flex-1">
              <span>大车位置</span>
              <span>{{ (card.maxCarLocation / 1000) | formatFloat(1) }}m</span>
            </div>
            <div class="item flex-1">
              <span>小车位置</span>
              <span>{{ (card.minCarLocation / 1000) | formatFloat(1) }}m</span>
            </div>
          </div>
          <!-- 高度重量信息 -->
          <div class="d-flex hw-info px-1">
            <div class="item flex-1">
              <span>抓斗高度</span>
              <span>{{ (card.bucketLocation / 1000) | formatFloat(1) }}m</span>
            </div>
            <div class="item flex-1">
              <span>抓斗重量</span>
              <span>{{ card.weight | formatFloat(1) }}t</span>
            </div>
          </div>
        </div>
        <!-- 其他状态 -->
        <div class="other-status-wrapper d-flex j-sa a-center">
          <span class="hc-tasks-status" :class="[card.workPattern ? 'blue' : 'orange']">{{ card.workPattern ? "自动" : "手动" }}</span>
          <span class="hc-tasks-status" :class="[card.sourceStatus ? 'green' : '']">{{ card.sourceStatus ? "电源开" : "电源关" }}</span>
          <span class="hc-tasks-status red" :class="[card.isWorning ? 'animate' : '']">报警</span>
        </div>
        <!-- 操作按钮 -->
        <div class="hc-control-task-btns d-flex j-center a-center">
          <div class="btn d-flex j-center a-center" @click="_toggleAutoMode(card, true)">切换自动</div>
          <div class="btn d-flex j-center a-center orange" @click="_toggleAutoMode(card, false)">切换手动</div>
          <div class="btn d-flex j-center a-center green" @click="_triggerReset(card)">故障复位</div>
          <div class="btn d-flex j-center a-center red" @click="_triggerStop(card)">急停</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import textUnderline from "@/assets/common/text-underline.png";
import enums from "@/utils/enum";
import variables from "@/styles/variables.scss";
export default {
  name: "HcCards",
  props: {
    cards: {
      type: Array,
      default: () => [],
    },
    toggleNetwork: {
      type: Function,
      default: () => ({}),
    },
    toggleStatus: {
      type: Function,
      default: () => ({}),
    },
    toggleAutoMode: {
      type: Function,
      default: () => ({}),
    },
    triggerReset: {
      type: Function,
      default: () => ({}),
    },
    triggerStop: {
      type: Function,
      default: () => ({}),
    },
  },
  data() {
    return {
      textUnderline,
      activeColor: variables.switchActiveBg,
      inactiveColor: variables.switchBg,
      tempIndex: null,
    };
  },
  watch: {
    cards: {
      immediate: true,
      deep: true,
      handler(newValue) {
        this.handleHcCards(newValue);
      },
    },
  },
  methods: {
    // 删除添加的属性
    deleteWarning() {
      // 删除这个属性
      delete this.cards[this.tempIndex].isWorning;
      this.$set(this.cards, this.tempIndex, this.cards[this.tempIndex]);
    },
    // 当有行车预警的时候车辆需要报警
    warningCard(data) {
      this.cards.map((item, index) => {
        // 找到这个行车卡片进行更新
        if (item.id === data.id) {
          // 临时添加一个属性进去
          data.isWorning = true;
          // 然后改变这个数组里的对象
          this.$set(this.cards, index, data);
          // 保存这个下标
          this.tempIndex = index;
        }
        return item;
      });
    },
    // 切换网络连接
    _toggleNetwork(card, val) {
      this.$emit("toggleNetwork", card, val);
    },
    // 切换设备状态
    _toggleStatus(card, val) {
      this.$emit("toggleStatus", card, val);
    },
    // 切换手动-自动
    _toggleAutoMode(card, val) {
      this.$emit("toggleAutoMode", card, val);
    },
    // 故障复位
    _triggerReset(card) {
      this.$emit("triggerReset", card);
    },
    // 急停
    _triggerStop(card) {
      this.$emit("triggerStop", card);
    },
    // 添加行车字段
    handleHcCards(data) {
      if (!Array.isArray(data)) return;

      return data.forEach(card => {
        let { className, label } = enums.hcStatusEnum.getLabelAndClassNameByValue(card.status);
        card.className = className;
        card.label = label;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
::-webkit-scrollbar {
  display: none;
}
// 行车名称渐变色
// .gradient-text-color {
//   background: linear-gradient(0deg, #ffffff 0%, #91c7ff 100%);
//   -webkit-background-clip: text;
//   -webkit-text-fill-color: transparent;
// }
.inner-wrapper {
  height: 270px;
  margin: 0 -10px;
  overflow-y: auto;
  // 显示最后一个卡片的阴影
  &::after {
    content: "";
    flex-basis: 10px;
    flex-shrink: 0;
  }

  .card {
    width: 444px;
    height: 239px;
    margin: 0 28px 0 0;
    overflow: hidden;
    background-color: #fff;
    border-radius: 6px;
    flex-shrink: 0;
    box-shadow: 0 10px 10px 0 rgba(201, 201, 201, 0.1);
    transition: all 0.5s ease-in-out;

    &:hover {
      box-shadow: 1px 1px 10px 0 rgba(201, 201, 201, 0.7);
    }

    &:first-of-type {
      margin-left: 10px;
    }

    &:last-of-type {
      margin-right: 0;
    }
    // 卡片背景色
    .block {
      position: relative;
      padding: 6px 10px 14px 10px;

      &::before {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background: url("~@/assets/common/hc_bg_img.png") no-repeat;
        background-size: contain;
        content: "";
      }
      // 行车状态
      &.disconnect {
        background: $disconnect;
      }

      &.offline {
        background: $offline;
      }

      &.standby {
        background: $standby;
      }

      &.operation {
        background: $operation;
      }

      &.fault {
        background: $fault;
      }
    }

    // 行车标题
    .title {
      position: relative;
      margin-bottom: 5px;
      font-family: Microsoft YaHei;
      font-size: 18px;
      font-weight: bold;
      line-height: 40px;
      color: #fff;
    }
    // 连接状态, 位置信息，抓斗信息
    .connection-status,
    .pos-info,
    .hw-info {
      font-family: Microsoft YaHei;
      font-weight: 400;
      line-height: 22px;
      color: #fff;

      span + span {
        margin-left: 10px;
        font-weight: bold;
      }
    }

    .connection-status {
      font-size: 18px;
    }

    .pos-info,
    .hw-info {
      font-size: 16px;
    }
    // 其他状态
    .other-status-wrapper {
      height: 32px;
      font-family: Microsoft YaHei;
      font-size: 16px;
      font-weight: 400;
      color: $hcDarkgrey;

      span {
        font-size: 16px !important;
      }
    }

    .hc-control-task-btns {
      margin-top: -3px;
    }
  }
}
</style>
