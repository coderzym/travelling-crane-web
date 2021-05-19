<template>
  <div class="app-container task-list">
    <!-- 标题 -->
    <MainHeader title="库区盘存" />
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchQuery" class="search-wrapper">
      <el-form-item class="widthToS" label="行车">
        <el-select v-model="searchQuery.CCode" placeholder="请选择" @change="queryWarehouseScan">
          <el-option v-for="item in queryCranesList" :key="item.name" :label="item.name" :value="item.code"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="widthToS" label="开始功能区">
        <el-select v-model="searchQuery.startDate" placeholder="请选择">
          <el-option v-for="item in startList" :key="item.key" :label="item.name" :value="item.key"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="widthToS" label="结束功能区">
        <el-select v-model="searchQuery.endData" placeholder="请选择">
          <el-option v-for="item in endList" :key="item.key" :label="item.name" :value="item.key"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button class="el-icon-search" type="primary" @click="onSearch">查询</el-button>
        <el-button type="warning" @click="onGetSum">计算库区</el-button>
        <el-button type="primary" plain @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 库区列表 -->
    <div class="list-wrapper">
      <div class="cards d-flex flex-wrap">
        <div v-for="item in list" :key="item.id" class="card d-flex flex-column">
          <div class="main-type d-flex pt-1 pb-2 px-3">
            <div class="bg"></div>
            <div class="info d-flex flex-column a-start j-center flex-1">
              <div class="name-wrapper d-flex j-start a-center">
                <div class="name pr-2">{{ item.factory }}</div>
                <div class="tag px-1">合计: {{ item.kqGetSum.toFixed(4) }}</div>
              </div>
              <div class="log-wrapper pl-1 d-flex a-center j-start">创建时间: {{ "2020-01-18 10:56:10" }}</div>
            </div>
          </div>
          <div class="kqBody pl-3 pr-3 pt-1">
            <div class="jlkBox">
              <div class="kqTitle">进料口</div>
              <div class="jlcBoxS pt-1">
                <div class="jlctext d-flex flex-wrap">
                  <div v-for="(item2, index) in item.inLet" :key="index" class="jlcData">
                    <span class="testStyle">{{ item2.type }}：</span>
                    <span class="numStyle">{{ item2.vol }}</span>
                    <span>；</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="clkBox">
              <div class="kqTitle">出料口</div>
              <div class="clkBoxS pt-1">
                <div class="clktext d-flex flex-wrap">
                  <div v-for="(item2, index) in item.materialLet" :key="index" class="clkData">
                    <span class="testStyle">{{ item2.type }}：</span>
                    <span class="numStyle">{{ item2.vol }}</span>
                    <span>；</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 分页 -->
    <div class="d-flex a-center j-center pt-5 pb-2">
      <span class="el-pagination__total"
        >共 <span>{{ totalPage }}</span> 条</span
      >
      <el-pagination
        background
        :current-page="searchQuery.current"
        :page-size="searchQuery.size"
        layout="prev, pager, next, jumper"
        :total="totalPage"
        @current-change="handleCurrentChange"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script>
// api
import $api from "@/api/warehouse-inventory";
import $zong from "@/api/reservoir";

export default {
  name: "WarehouseInventory",
  components: {},
  mixins: [],
  data() {
    return {
      queryCranesList: [], // 行车列表
      startList: [], // 开始功能区
      endList: [], // 结束功能区
      totalPage: 0, // 总页数
      list: [], // 库区列表
      searchQuery: {
        // 筛选条件
        CCode: "", // 行车code
        startDate: "", // 开始
        endData: "", // 结束
        current: 1, // 当前页
        size: 4, // 每页多少条
      },
    };
  },
  mounted() {
    this.pageStock();
    this.queryCranes();
  },
  methods: {
    // 通过行车查询开始结束功能区
    async queryWarehouseScan() {
      this.startList = [];
      this.endList = [];
      this.searchQuery.startDate = "";
      this.searchQuery.endData = "";
      const startData = await $api.queryWarehouseScan({ craneCode: this.searchQuery.CCode, type: "0" });
      startData.forEach(item => {
        this.startList.push({ name: item.name, key: item.maxCar });
      });
      const endData = await $api.queryWarehouseScan({ craneCode: this.searchQuery.CCode, type: "1" });
      endData.forEach(item => {
        this.endList.push({ name: item.name, key: item.maxCar });
      });
    },
    // 计算库存
    async onGetSum() {
      let getSumObj = {
        craneCode: this.searchQuery.CCode,
        startScan: this.searchQuery.startDate,
        endScan: this.searchQuery.endData,
      };
      await $api.countStock(getSumObj);
    },
    // 库存分页
    async pageStock() {
      let beforePage = await $zong.getReservoirList();
      let pageObj = {
        size: this.searchQuery.size,
        current: this.searchQuery.current,
      };
      const data = await $api.pageStock(pageObj);
      this.list = data.records;
      this.list.forEach(item => {
        item.factory = beforePage.records[0].remark;
        item.kqGetSum = 0;
        item.inLet.forEach(item2 => {
          item.kqGetSum += item2.vol;
        });
        item.materialLet.forEach(item3 => {
          item.kqGetSum += item3.vol;
        });
      });
      this.totalPage = data.total;
    },
    // 获取行车下拉列表
    async queryCranes() {
      const data = await $api.queryCranes();
      if (data) {
        this.queryCranesList = data || [];
      }
    },
    // 改变当前页
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`);
      this.searchQuery.current = val;
      this.pageStock();
    },
    // 搜索
    onSearch() {
      this.pageStock();
    },
    // 重置
    onReset() {
      this.searchQuery.CCode = "";
      this.searchQuery.startDate = "";
      this.searchQuery.endData = "";
    },
  },
};
</script>

<style lang="scss" scoped>
$cardWidth: 448px;
$cardHeight: 797px;
$cardXGap: 10px;
$cardYGap: 12px;
$containerPadding: 60px;
// 搜索
.search-wrapper {
  padding: 20px 0 0 0;
  // .widthToS {
  //   ::v-deep .el-form-item__content {
  //     width: 180px;
  //   }
  // }
}

// 列表
.list-wrapper {
  margin: 0 -10px;

  .cards {
    padding: 0;
    margin: 0;
    list-style: none;

    .card {
      display: inline-block;
      width: $cardWidth;
      margin: $cardYGap $cardXGap;
      overflow: hidden;
      // height: $cardHeight;
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 10px 10px 0 rgba(201, 201, 201, 0.1);
      transition: all 0.5s ease;

      &:hover {
        box-shadow: 1px 1px 10px 0 rgba(201, 201, 201, 0.7);
      }
      // 主类型
      .main-type {
        position: relative;
        background: #2580eb;

        .bg {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: url("~@/assets/common/maintain_card_bg.png") no-repeat;
          background-size: cover;
        }

        .info {
          position: relative;
          z-index: 1;

          .name-wrapper {
            .name {
              font-family: Microsoft YaHei;
              font-size: 18px;
              font-weight: 400;
              line-height: 40px;
              color: #fff;
            }

            .tag {
              font-family: Microsoft YaHei;
              font-size: 16px;
              font-weight: 400;
              line-height: 22px;
              color: #2580eb;
              background: #fff;
              border-radius: 2px 8px 2px 8px;
              opacity: 0.7;
            }
          }

          .log-wrapper {
            width: 254px;
            height: 26px;
            font-family: Microsoft YaHei;
            font-size: 16px;
            font-weight: 400;
            color: #e1efff;
            border: 1px solid #e1efff;
            border-radius: 5px;
          }
        }

        .tools {
          position: relative;
          z-index: 1;
          width: 50px;
        }
      }
      // 子类型
      .sub-type-wrapper {
        height: 209px;
        overflow-y: auto;

        .item {
          padding: 12px 0;
          line-height: 24px;
          border-bottom: 1px solid #e5e8ed;

          &:last-of-type {
            border-bottom: none;
          }

          .name {
            font-family: Microsoft YaHei;
            font-size: 16px;
            font-weight: 400;
            color: #333;
          }

          .tag {
            display: flex;
            height: 20px;
            padding: 3px 5px;
            font-family: Microsoft YaHei;
            font-size: 14px;
            font-weight: 400;
            color: #1888ff;
            border: 1px solid #1888ff;
            border-radius: 4px;
            justify-content: center;
            align-items: center;
          }

          .log {
            font-family: Microsoft YaHei;
            font-size: 16px;
            font-weight: 400;
            color: #888;
          }
        }
      }

      .kqBody {
        .jlkBox {
          padding: 15px 0 25px 0;

          .kqTitle {
            width: 80px;
            height: 24px;
            line-height: 24px;
            color: rgba(255, 255, 255, 1);
            text-align: center;
            background-color: rgba(37, 128, 235, 1);
            border-top-right-radius: 10px;
            border-bottom-left-radius: 10px;
          }

          .jlcBoxS {
            .jlctext {
              width: 100%;
              // border-bottom: 1px solid #e5e8ed;
              .jlcData {
                width: 33.33%;
                padding: 8px 0;
                font-size: 16px;
                border-bottom: 1px solid #e5e8ed;

                .testStyle {
                  color: rgba(51, 51, 51, 1);
                }

                .numStyle {
                  color: rgba(37, 128, 235, 1);
                }
              }
            }
          }
        }

        .clkBox {
          padding-bottom: 30px;

          .kqTitle {
            width: 80px;
            height: 24px;
            line-height: 24px;
            color: rgba(255, 255, 255, 1);
            text-align: center;
            background-color: rgba(37, 128, 235, 1);
            border-top-right-radius: 10px;
            border-bottom-left-radius: 10px;
          }

          .clkBoxS {
            .clktext {
              width: 100%;
              // border-bottom: 1px solid #e5e8ed;
              .clkData {
                width: 50%;
                padding: 8px 0;
                font-size: 16px;
                border-bottom: 1px solid #e5e8ed;

                .testStyle {
                  color: rgba(51, 51, 51, 1);
                }

                .numStyle {
                  color: rgba(37, 128, 235, 1);
                }
              }
            }
          }
        }
      }
    }
  }
}

// 响应式
@media (min-width: $sw-xs) {
  // 0+
  .app-container {
    width: 100%;
  }
}

@media (min-width: $sw-sm) {
  // 576+
  .app-container {
    width: calc((#{$cardWidth} + #{$cardXGap} * 2) * 1 + #{$containerPadding});
  }
}

@media (min-width: $sw-md) {
  // 768+
  .app-container {
    width: calc((#{$cardWidth} + #{$cardXGap} * 2) * 1 + #{$containerPadding});
  }
}

@media (min-width: $sw-lg) {
  // 992+
  .app-container {
    width: calc((#{$cardWidth} + #{$cardXGap} * 2) * 2 + #{$containerPadding});
  }
}

@media (min-width: $sw-xl) {
  // 1200+
  .app-container {
    width: calc((#{$cardWidth} + #{$cardXGap} * 2) * 2 + #{$containerPadding});
  }
}

@media (min-width: $sw-xxl) {
  // 1400+
  .app-container {
    width: calc((#{$cardWidth} + #{$cardXGap} * 2) * 3 + #{$containerPadding});
  }
}

@media (min-width: $sw-xxxl) {
  // 1920+
  .app-container {
    width: calc((#{$cardWidth} + #{$cardXGap} * 2) * 4 + #{$containerPadding});
  }
}
</style>
