<template>
  <div class="hc-table">
    <el-table
      :data="hcTaskList"
      style="width: 100%"
      :max-height="maxHeight"
      :header-row-style="{ height: '46px' }"
      :header-cell-style="{ height: '46px' }"
      :row-style="{ height: '50px' }"
      :cell-style="{ height: '50px' }"
      stripe
    >
      <el-table-column
        v-for="(field, idx) in taskListField"
        :key="idx"
        :fixed="field.prop == 'sw_id'"
        :prop="field.prop"
        :label="field.label"
        :min-width="field.width"
        :align="field.align"
      >
        <template slot-scope="scope">
          <div v-if="field.prop == 'status'">
            {{ scope.row[field.prop] | taskStatusType }}
          </div>
          <div v-else-if="field.prop == 'commandType'">
            {{ scope.row[field.prop] | commandType }}
          </div>
          <div v-else-if="field.prop == 'createTime'">
            {{ scope.row[field.prop] | parseIgnoreYearDateTime }}
          </div>
          <div v-else>
            {{ scope.row[field.prop] }}
          </div>
        </template>
      </el-table-column>

      <el-table-column fixed="right" label="操作" min-width="340" align="center">
        <template slot-scope="scope">
          <el-button @click="_handleStart(scope.row)" type="text" size="small" class="sw-btn">启动</el-button>
          <el-button @click="_handleStop(scope.row)" type="text" size="small" class="sw-btn">停止</el-button>
          <el-button @click="_handlePriority(scope.row)" type="text" size="small" class="sw-btn">优先</el-button>
          <el-button v-if="scope.row.status == 0" @click="_handleEnableOrDisabled(scope.row)" type="text" size="small" class="sw-btn">启用</el-button>
          <el-button v-if="scope.row.status == 1" @click="_handleEnableOrDisabled(scope.row)" type="text" size="small" class="sw-btn">禁用</el-button>
          <el-button @click="_handleDelete(scope.row)" type="text" size="small" class="sw-btn">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
const taskListField = [
  {
    prop: "sw_id", // 前端自定义id
    label: "作业编号",
    width: 90,
    align: "center",
  },
  {
    prop: "status",
    label: "指令状态",
    width: 100,
    align: "center",
  },
  {
    prop: "commandType",
    label: "指令类型",
    width: 100,
    align: "center",
  },
  {
    prop: "level",
    label: "优先级",
    width: 80,
    align: "center",
  },
  {
    prop: "cname",
    label: "行车",
    width: 100,
    align: "center",
  },
  {
    prop: "iname",
    label: "抓料池",
    width: 100,
    align: "center",
  },
  {
    prop: "oname",
    label: "放料池",
    width: 100,
    align: "center",
  },
  {
    prop: "snatchNum",
    label: "已抓斗数",
    width: 100,
    align: "center",
  },
  {
    prop: "createBy",
    label: "计划人",
    width: 100,
    align: "center",
  },
  {
    prop: "createTime",
    label: "计划时间",
    width: 115,
    align: "center",
  },
  {
    prop: "remark",
    label: "备注",
    width: 200,
  },
];
const tableHeaderHeight = 46;
const tableRowHeight = 50;
import Enums from "@/utils/enum";
export default {
  name: "HcTable",
  props: {
    hcTaskList: {
      // 行车任务列表
      type: Array,
      default: () => [],
    },
    maxRows: {
      // 最大行数
      type: Number,
      default: 12,
    },
  },
  data() {
    return {
      taskListField, // 行车任务字段
    };
  },
  computed: {
    maxHeight() {
      return tableHeaderHeight + this.maxRows * tableRowHeight;
    },
  },
  methods: {
    _handleStart(row) {
      this.$eventBus.$emit("hcTable", row, "start");
    },
    _handleStop(row) {
      this.$eventBus.$emit("hcTable", row, "stop");
    },
    _handlePriority(row) {
      this.$eventBus.$emit("hcTable", row, "priority");
    },
    _handleDelete(row) {
      this.$eventBus.$emit("hcTable", row, "delete");
    },
    _handleEnableOrDisabled(row) {
      this.$eventBus.$emit("hcTable", row, "enabledOrDisable");
    },
  },
};
</script>

<style lang="scss" scoped></style>
