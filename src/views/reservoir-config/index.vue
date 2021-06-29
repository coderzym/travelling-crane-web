<!-- 页面名：index -->
<template>
  <!-- 交互
    1. done 没有保存之前，可以随意新增区域。但有重叠的话，矩形会高亮。且没法儿保存
    2. done 点击网格或者节点，顶部可查看当前坐标，方便绘制
    3. done 双击节点，可以直接拖动编辑，或者点击节点，可以在表单设置值
    4. done 顶部选中哪个类型，可以绘制哪种类型的rect
    5. 可以保存，且保存前要判断是否可提交
    6. x,y坐标转换
   -->
  <div class="reservoir-config container">
    <!-- 编辑类型 -->
    <div class="tools-inner d-flex">
      <div class="header d-flex j-center a-center"> 组件库 </div>
      <div class="tools d-flex j-sb a-center flex-1 mx-2">
        <el-button-group>
          <el-button v-for="item in mapTypeFilterObj" :key="item.value" :data-type="item.value" @mousedown.native="startDrag">{{ item.label }}</el-button>
        </el-button-group>
        <el-tag>x: {{ coordinates.x }}, y: {{ coordinates.y }}</el-tag>
      </div>
    </div>

    <div class="edit-inner d-flex">
      <!-- 画布 -->
      <div class="canvas-inner">
        <div id="canvas"></div>
      </div>

      <!-- 表单编辑区 -->
      <div class="config-inner px-2">
        <h3 class="header">组件信息</h3>
        <hr />
        <!-- 选中要编辑的rect，才显示表单 -->
        <el-form v-if="curRect" ref="form" :model="curForm" :rules="rules" label-position="top" size="mini">
          <el-form-item label="名称" prop="name">
            <el-input v-model="curForm.name"></el-input>
          </el-form-item>
          <el-form-item label="x坐标" prop="x">
            <el-input v-model.number="curForm.x"></el-input>
          </el-form-item>
          <el-form-item label="y坐标" prop="y">
            <el-input v-model.number="curForm.y"></el-input>
          </el-form-item>
          <el-form-item label="宽" prop="width">
            <el-input v-model.number="curForm.width"></el-input>
          </el-form-item>
          <el-form-item label="高" prop="height">
            <el-input v-model.number="curForm.height"></el-input>
          </el-form-item>
          <!-- 是物料类型，才可展示 -->
          <el-form-item v-if="curRect.getData().type === 'area'" label="物料类型">
            <el-radio-group v-model="curForm.areaType">
              <el-radio v-for="item in areaTypeObj" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit(false)">预览</el-button>
            <el-button type="success" :disabled="haveCollision" @click="onSubmit(true)">保存</el-button>
            <!-- 没有id的，就算是新拖拽下来的 -->
            <el-button v-if="curRect.getData().id" type="info" @click="onReset">还原</el-button>
            <el-button type="danger" @click="onDelete">删除</el-button>
          </el-form-item>
        </el-form>
        <p v-else>请点击画布中对象进行编辑</p>
        <hr />
        <el-form v-if="curRect" ref="ruleForm" :model="ruleForm[curRect.store.data.shape]" :rules="formRules" label-position="top" size="mini">
          <el-form-item v-for="([key, value], idx) in Object.entries(ruleForm[curRect.store.data.shape]).filter(v => v[1].show)" :key="idx" :label="value.label" :prop="key">
            <el-input v-model="value.value"></el-input>
          </el-form-item>
          <!-- 是物料类型，才可展示 -->
          <el-form-item v-if="curRect.getData().type === mapTypeObj.area.field" label="可抓区域">
            <el-switch v-model="ruleForm[curRect.store.data.shape].isGrab.value" active-text="可抓" inactive-text="不可抓"> </el-switch>
          </el-form-item>
          <el-form-item v-if="curRect.getData().type === mapTypeObj.area.field" label="可放区域">
            <el-switch v-model="ruleForm[curRect.store.data.shape].isPlace.value" active-text="可放" inactive-text="不可放"> </el-switch>
          </el-form-item>

          <!-- 表单操作 -->
          <el-form-item>
            <el-button type="primary" @click="onSave(true)">预览</el-button>
            <el-button type="success" :disabled="haveCollision" @click="onSave(false)">保存</el-button>
            <!-- 没有id的，就算是新拖拽下来的 -->
            <el-button v-if="curRect.getData().id" type="info" @click="onReset">还原</el-button>
            <el-button type="danger" @click="onDelete">删除</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
// x6库
import { Graph, Addon } from "@antv/x6";
import "./utils/rect";
const { Dnd } = Addon; // 拖拽插件
// 接口
import $reservoir from "@/api/reservoir";
// 枚举
import enums from "@/utils/enum/index";

const mapEnum = enums.mapEnum;
const areaEnum = enums.areaEnum;

// 通用表单
const basicForm = type => {
  return {
    groupId: {
      label: "",
      value: "",
      show: false, // 是否展示在表单上
    }, // 类型矩阵分组
    name: {
      label: "名称",
      value: mapEnum.getLabelByValue(type),
      show: true, // 是否展示在表单上
    }, // 名称
    isGrab: {
      label: "可抓区",
      value: false,
      show: false, // 是否展示在表单上
    }, // 是否为可抓区域
    isPlace: {
      label: "可放区",
      value: false,
      show: false, // 是否展示在表单上
    }, // 是否为可放区域
    type: {
      label: "类型",
      value: type,
      show: false, // 是否展示在表单上
    }, // 区分类型 0:墙 1:物料 2:进料口 3:出料口 4:维修
    typeId: {
      label: "",
      value: null,
      show: false, // 是否展示在表单上
    }, // 类型对应的id（新增时不需要传递，后端生成）
    typeName: {
      label: "",
      value: null,
      show: false, // 是否展示在表单上
    }, // 类型名称（新增时不需要传递，后端生成）
    xpos: {
      label: "x坐标",
      value: 0,
      show: true, // 是否展示在表单上
    }, // x轴坐标
    ypos: {
      label: "y轴坐标",
      value: 0,
      show: true, // 是否展示在表单上
    }, // y轴坐标
    xlength: {
      label: "x轴长度",
      value: 0,
      show: true, // 是否展示在表单上
    }, // x轴长度
    ylength: {
      label: "y轴长度",
      value: 0,
      show: true, // 是否展示在表单上
    }, // y轴长度
  };
};

const warehouseForm = () => {
  return { ...basicForm(mapEnum.warehouse.value) }; // 总库区表单
};
const areaForm = () => {
  return { ...basicForm(mapEnum.area.value) }; // 物料表单
};
const inputForm = () => {
  return { ...basicForm(mapEnum.input.value) }; // 进料口表单
};
const outputForm = () => {
  return { ...basicForm(mapEnum.output.value) }; // 出料口表单
};
const wallForm = () => {
  return { ...basicForm(mapEnum.wall.value) }; // 墙表单
};
const maintainForm = () => {
  return { ...basicForm(mapEnum.maintain.value) }; // 检查口表单
};

export default {
  name: "ReservoirConfig",
  data() {
    return {
      // NOTE: 画布相关
      graph: null, // 画布实例
      dnd: null, // 拖拽实例
      canvas: {
        width: 0,
        height: 0,
      }, // 响应式画布宽度
      isDraw: false, // 是否正在绘制
      factor: 1, // 比例系数
      coordinates: {
        x: 0,
        y: 0,
      }, // 坐标
      position: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }, // 位置
      curRect: null, // 当前选中的矩形
      curForm: {
        name: "", // 对象名称
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        areaType: areaEnum.Material.value, // 物料区类型 (null: 非物料区，0: 物料区, 1:可抓, 2: 可放)
      },
      ruleForm: {
        [mapEnum.warehouse.field]: warehouseForm(),
        [mapEnum.area.field]: areaForm(),
        [mapEnum.input.field]: inputForm(),
        [mapEnum.output.field]: outputForm(),
        [mapEnum.wall.field]: wallForm(),
        [mapEnum.maintain.field]: maintainForm(),
      }, // 当前 form 表单
      haveCollision: true, // 是否还有碰撞的情况
      // NOTE: 库区数据
      playground: {}, // 库区数据
    };
  },
  computed: {
    // map类型选择
    mapTypeObj() {
      return mapEnum;
    },
    // 可绘制类型选择
    mapTypeFilterObj() {
      return this.$utils.objFilter(mapEnum, attr => attr.ext.typeShow === true);
    },
    // 抓料区放料区还是物料区
    areaTypeObj() {
      return areaEnum;
    },
    // 校验
    rules() {
      // 检查是否碰撞
      const checkCollision = (rule, value, callback) => {
        if (value === "") {
          return callback(new Error("不能为空"));
        }
        if (!Number.isInteger(value)) {
          callback(new Error("请输入数字值"));
        } else {
          if (value % 500 !== 0) {
            callback(new Error("必须是500的整数倍"));
          } else {
            callback();
          }
        }
      };
      return {
        name: [{ required: true, message: "请输入名称", trigger: "change" }],
        x: [{ required: true, validator: checkCollision, trigger: "change" }],
        y: [{ required: true, validator: checkCollision, trigger: "change" }],
        width: [{ required: true, validator: checkCollision, trigger: "change" }],
        height: [{ required: true, validator: checkCollision, trigger: "change" }],
      };
    },
    // 表单验证
    formRules() {
      // 检查是否碰撞
      const checkCollision = (rule, value, callback) => {
        const val = Number(value.value);
        console.log(value, val);
        if (val === "") {
          return callback(new Error("不能为空"));
        }
        if (!Number.isInteger(val)) {
          callback(new Error("请输入数字值"));
        } else {
          if (val % 500 !== 0) {
            callback(new Error("必须是500的整数倍"));
          } else {
            callback();
          }
        }
      };
      return {
        name: [{ required: true, message: "请输入名称", trigger: "change" }],
        xpos: [{ required: true, validator: checkCollision, trigger: "change" }],
        ypos: [{ required: true, validator: checkCollision, trigger: "change" }],
        xlength: [{ required: true, validator: checkCollision, trigger: "change" }],
        ylength: [{ required: true, validator: checkCollision, trigger: "change" }],
      };
    },
  },
  watch: {
    canvas: {
      deep: true,
      immediate: false,
      handler(newVal) {
        if (this.graph) {
          console.log(newVal);
          this.graph.resize(newVal.width, newVal.height);
          this.graph.centerContent();
        }
      },
    },
  },
  async mounted() {
    // 获取画布数据
    await this.getPlayground();
    this.observe();
    this.init();
    this.addEvent();
  },
  methods: {
    // NOTE: 库区图绘制相关
    init() {
      const { area, input, output, wall, warehouse, maintain } = this.playground;

      // 初始化画布
      this.graph = new Graph({
        container: document.getElementById("canvas"),
        width: this.canvas.width,
        height: this.canvas.height,
        background: {
          color: "#fffbe6",
        },
        grid: {
          size: this.playground.warehouse.minCarScale, // 网格大小
          visible: true, // 渲染网格背景
          type: "mesh", // 'dot' | 'fixedDot' | 'mesh'
        },
        // scroller: true, // 可滚动
        panning: {
          enabled: true,
          modifiers: "shift",
        },
        mousewheel: {
          enabled: true,
          modifiers: ["ctrl", "meta"],
        }, // 背景缩放
        interacting: function (cellView) {
          // 设置当前节点能否移动
          if (cellView.cell.getData().disableMove) {
            return { nodeMovable: false };
          }
          return true;
        },
        resizing: {
          enabled: function (Node) {
            if (!Node.getData().disableMove) {
              return true;
            }
            return false;
          },
        },
      });

      // 实例化拖拽插件
      this.dnd = new Dnd({
        target: this.graph,
        scaled: true,
        animation: true,
        getDropNode: newNode => {
          // 拖拽结束后，检查碰撞
          setTimeout(() => {
            this.checkAllCollision();
          }, 0);
          return newNode.clone();
        },
      });

      // 库区
      this.graph.addNode({
        shape: mapEnum.warehouse.field,
        rawData: warehouse,
      });

      // 物料区
      area.forEach(item => {
        // 抓料区
        if (item.parentId === 0) {
          this.graph.addNode({
            shape: mapEnum.area.field,
            rawData: item,
            data: {
              disableMove: false,
            },
          });
        }
      });

      // 进料口
      input.forEach(item => {
        this.graph.addNode({
          shape: mapEnum.input.field,
          rawData: item,
          data: {
            disableMove: false,
          },
        });
      });

      // 出料口
      output.forEach(item => {
        this.graph.addNode({
          shape: mapEnum.output.field,
          rawData: item,
          data: {
            disableMove: false,
          },
        });
      });

      // 墙
      wall.forEach(item => {
        this.graph.addNode({
          shape: mapEnum.wall.field,
          rawData: item,
          data: {
            disableMove: false,
          },
        });
      });

      // 检查口
      maintain.forEach(item => {
        this.graph.addNode({
          shape: mapEnum.maintain.field,
          rawData: item,
          data: {
            disableMove: false,
          },
        });
      });

      this.graph.centerContent();
      this.graph.zoom(-this.playground.warehouse.minCarScale);
      this.checkAllCollision();
    },
    /**
     * @description 检测两个 rect 是否碰撞（重叠）
     * @param {Rect} 当前rect
     * @param {Rect} 目标rect
     * @returns {Boolean} 是否碰撞
     */
    checkCollision(curRect, targetRect) {
      return curRect.x < targetRect.x + targetRect.width &&
        curRect.x + curRect.width > targetRect.x &&
        curRect.y < targetRect.y + targetRect.height &&
        curRect.y + curRect.height > targetRect.y
        ? true
        : false;
    },
    /**
     * @description 检测当前对象和其他对象是否有碰撞
     */
    checkAllCollision() {
      const nodes = this.graph.getNodes();
      for (let i = 0; i < nodes.length; i++) {
        const curNode = nodes[i];
        // 如果当前node类型是warehouse，或者isCollision本就是碰撞的状态，则忽略本次循环
        if (curNode.store.data.shape === mapEnum.warehouse.field) continue;
        const {
          position: { x, y },
          size: { width, height },
        } = curNode.store.data;
        const curRect = { x, y, width, height };

        for (let j = 0; j < nodes.length; j++) {
          const inner = nodes[j];
          const {
            position: { x, y },
            size: { width, height },
          } = inner.store.data;
          const innerRect = { x, y, width, height };
          // 如果id不同，且检测到碰撞，则设置为碰撞
          if (curNode.id !== inner.id && inner.store.data.shape !== mapEnum.warehouse.field && this.checkCollision(curRect, innerRect)) {
            curNode.setData({
              isCollision: true,
            });
            curNode.setAttrs({
              body: {
                fill: "rgba(255, 0, 0, 0.55)",
              },
            });
            break;
          }
          curNode.setData({
            isCollision: false,
          });
          curNode.setAttrs({
            body: {
              fill: mapEnum[curNode.store.data.shape].ext.fill,
            },
          });
        }
      }

      // 判断当前是否还有碰撞的情况
      this.haveCollision = this.graph
        .getNodes()
        .filter(node => node.store.data.shape !== mapEnum.warehouse.field)
        .some(node => node.getData().isCollision === true);
    },
    // NOTE: 网络请求
    /**
     * @description 请求画布数据
     */
    async getWareHouseInfo() {
      const [err, data] = await $reservoir.getBaseWareHouse();
      console.log("请求画布数据", data);
      if (err) return;
      return data;
    },
    /**
     * @description 请求画布内部组件数据
     */
    async getPlayground() {
      // 获取画布数据
      const [outerErr, outerData] = await $reservoir.getBaseWareHouse();
      console.log("请求画布数据", outerData);
      if (outerErr) return;
      // 获取画布内部组件数据
      const [innerErr, innerData] = await $reservoir.selectArea();
      console.log("请求画布内部组件数据", innerData);
      if (innerErr) return;

      // 合并画布
      const mergeData = {
        warehouse: outerData,
        ...innerData,
      };

      for (const [key, value] of Object.entries(mergeData)) {
        if (!Array.isArray(value)) {
          // 库区
          value.type = key;
        } else {
          // 其他对象
          value.forEach(v => {
            v.type = key;
          });
        }
      }
      this.playground = mergeData;
      console.log(this.playground);
    },
    /**
     * @description 更新数据
     */
    onSubmit(isPreview = false) {
      this.$refs["form"].validate(valid => {
        if (valid && this.curRect) {
          const { x, y, width, height, name, areaType } = this.curForm;
          this.curRect
            .position(x, y)
            .resize(width, height)
            .attr({
              label: {
                text: name,
              },
            })
            .setData({
              areaType, // 是物料类型，才有区域类型，否则为null
            });

          if (isPreview) {
            console.log("更新");
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    /**
     * @description 更新数据
     */
    onSave(isPreview = true) {
      this.$refs["ruleForm"].validate(async valid => {
        if (valid && this.curRect) {
          const { xpos, ypos, xlength, ylength, name } = this.ruleForm[this.curRect.store.data.shape];
          this.curRect
            .position(Math.floor(xpos.value), Math.floor(ypos.value))
            .resize(Math.floor(xlength.value), Math.floor(ylength.value))
            .attr({
              label: {
                text: name.value,
              },
            });
          // .setData({
          //   areaType, // 是物料类型，才有区域类型，否则为null
          // });

          if (!isPreview) {
            console.log(
              "更新",
              Object.entries(this.ruleForm[this.curRect.store.data.shape]).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
            );
            const params = Object.entries(this.ruleForm[this.curRect.store.data.shape]).reduce((obj, cur) => {
              obj[cur[0]] = cur[1].value;
              return obj;
            }, {});
            const [err, data] = await $reservoir.save(params);
            if (!err) {
              console.log("更新成功", data);
            }
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    // 删除某个rect
    onDelete() {
      this.$confirm("此删除操作将永久删除该组件，是否继续？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.$message({
          type: "success",
          message: "删除成功！",
        });
      });
    },
    // NOTE: 事件处理
    /**
     * @description 监听 画布 宽度的变化
     */
    observe() {
      const container = document.querySelector(".reservoir-config");
      const toolsRect = document.querySelector(".tools-inner").getBoundingClientRect();
      const configRect = document.querySelector(".config-inner").getBoundingClientRect();
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          this.canvas.width = cr.width - configRect.width;
          this.canvas.height = cr.height - toolsRect.height - 1;
        }
      });
      ro.observe(container);
    },
    /**
     * @description 给画布添加事件
     */
    addEvent() {
      // 鼠标点击
      this.graph.on("node:click", data => {
        this.setCurRectAndCurForm(data, "node:click");
      });
      // 鼠标抬起
      this.graph.on("node:mouseup", data => {
        this.setCurRectAndCurForm(data, "node:mouseup");
        this.checkAllCollision(); // 鼠标抬起和rect重设大小时，检测
      });
      // 缩放
      this.graph.on("node:resized", data => {
        this.setCurRectAndCurForm(data, "node:resized");
        this.checkAllCollision(); // 鼠标抬起和rect重设大小时，检测
      });
      // 右键
      this.graph.on("node:contextmenu", data => {
        console.log(data);
      });
    },
    /**
     * @description 设置 curRect 和 curForm
     */
    setCurRectAndCurForm({ e, x, y, cell, view }, type) {
      this.coordinates = { x, y };
      this.curRect = cell;
      console.log("addEvent - " + type, { e, cell, view, curRect: this.curRect });
      const {
        store: {
          data: { attrs, position, size, data: selfData },
        },
      } = this.curRect;
      this.curForm = {
        name: attrs.label.text,
        x: Math.floor(position.x),
        y: Math.floor(position.y),
        width: size.width,
        height: size.height,
        areaType: selfData.areaType,
      };
      for (const [key, value] of Object.entries(this.curRect.getData().rawData)) {
        // eslint-disable-next-line no-prototype-builtins
        if (this.ruleForm[this.curRect.store.data.shape].hasOwnProperty(key)) {
          this.ruleForm[this.curRect.store.data.shape][key].value = value;
        }
      }
      this.ruleForm[this.curRect.store.data.shape].xpos.value = Math.floor(position.x);
      this.ruleForm[this.curRect.store.data.shape].ypos.value = Math.floor(position.y);
      this.ruleForm[this.curRect.store.data.shape].xlength.value = Math.floor(size.width);
      this.ruleForm[this.curRect.store.data.shape].ylength.value = Math.floor(size.height);
    },
    /**
     * @description 开始拖拽
     */
    startDrag(e) {
      const target = e.currentTarget;
      const value = Number(target.getAttribute("data-type"));

      let node = null;
      switch (value) {
        case mapEnum.area.value: // 物料区
          node = this.graph.createNode({
            shape: mapEnum.area.field,
            createData: {
              width: 20000,
              height: 10000,
              formData: Object.entries(areaForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
            },
          });
          break;
        case mapEnum.input.value: // 进料口
          node = this.graph.createNode({
            shape: mapEnum.input.field,
            createData: {
              width: 5000,
              height: 2500,
              formData: Object.entries(inputForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
            },
          });
          break;
        case mapEnum.output.value: // 出料口
          node = this.graph.createNode({
            shape: mapEnum.output.field,
            createData: {
              width: 5000,
              height: 2500,
              formData: Object.entries(outputForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
            },
          });
          break;
        case mapEnum.wall.value: // 墙
          node = this.graph.createNode({
            shape: mapEnum.wall.field,
            createData: {
              width: 500,
              height: 20000,
              formData: Object.entries(wallForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
            },
          });
          break;
        case mapEnum.maintain.value: // 检查口
          node = this.graph.createNode({
            shape: mapEnum.maintain.field,
            createData: {
              width: 5000,
              height: 5000,
              formData: Object.entries(maintainForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
            },
          });
          break;
        default:
          break;
      }
      console.log("startDrag", { node });
      this.dnd.start(node, e);
    },
    /**
     * @description 还原节点
     */
    onReset() {
      const type = this.curRect.getData().type;
      console.log(this.curRect, type);
      const origRectData = type === mapEnum.warehouse.field ? this.playground[type] : this.playground[type].find(v => v.name + "-" + v.id === this.curRect.getData().id);
      console.log("onReset", { origRectData, curRect: this.curRect, type, field: mapEnum.area.field });

      // 库区的 pos 和 size 跟其他类型不同
      const pos = {
        x: type === mapEnum.area.field ? origRectData.totalX : origRectData.maxCar,
        y: type === mapEnum.area.field ? origRectData.totalY : origRectData.minCar,
      };
      const s = {
        width: type === mapEnum.area.field ? origRectData.totalLength : origRectData.length,
        height: type === mapEnum.area.field ? origRectData.totalWidth : origRectData.width,
      };
      this.curRect
        .position(pos.x, pos.y)
        .resize(s.width, s.height)
        .attr({
          label: {
            text: origRectData.name,
          },
        })
        .setData({
          areaType: origRectData.type === mapEnum.area.field ? origRectData.isVirtual : null, // 是物料类型，才有区域类型，否则为null
        });

      const {
        store: {
          data: { attrs, position, size, data: selfData },
        },
      } = this.curRect;
      this.curForm = {
        name: attrs.label.text,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        areaType: selfData.areaType,
      };

      this.checkAllCollision();
    },
  },
};
</script>
<style lang="scss" scoped>
// 侧边栏宽度
$configW: 300px;
// 顶部工具栏高度（带下边框1px）
$toolsH: 51px;

.reservoir-config {
  width: 100%;
  height: calc(100vh - 84px);

  .tools-inner {
    width: 100%;
    height: 50px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);

    .header {
      display: flex;
      flex-basis: 200px;
      width: 200px;
      font-size: 14px;
      font-weight: bolder;
      color: #1890ff;
      background: #f7f9fb;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
    }
  }

  .edit-inner {
    width: 100%;
    height: calc(100vh - 84px - #{$toolsH});

    .canvas-inner {
      flex: 1;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      border-left: 1px solid rgba(0, 0, 0, 0.08);
    }

    .config-inner {
      flex-basis: $configW;
      width: $configW;
      flex-shrink: 0;
      overflow-y: auto;
    }
  }
}
</style>
