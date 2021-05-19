<template>
  <!-- 标题 -->
  <header class="title">
    {{ title }}
  </header>
</template>

<script>
export default {
  name: "MainHeader",
  props: {
    title: {
      type: String,
      default: "标题",
    },
  },
};
</script>

<style lang="scss" scoped>
header.title {
  position: relative;
  padding-left: 6px;
  font-size: 20px;
  font-family: Microsoft YaHei;
  font-weight: bolder;
  font-style: italic;
  color: #000000;
  line-height: 40px;
  &::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 22px;
    height: 22px;
    content: "";
    background: url("~@/assets/common/title-circular.png") no-repeat;
    background-size: contain;
  }
}
</style>
