import moment from "moment";
// import parseTime, formatTime and set to filter
export { parseTime, formatTime } from "@/utils";
import Enums from "@/utils/enum";
/**
 * Show plural label if time is plural number
 * @param {number} time
 * @param {string} label
 * @return {string}
 */
function pluralize(time, label) {
  if (time === 1) {
    return time + label;
  }
  return time + label + "s";
}

/**
 * @param {number} time
 */
export function timeAgo(time) {
  const between = Date.now() / 1000 - Number(time);
  if (between < 3600) {
    return pluralize(~~(between / 60), " minute");
  }
  if (between < 86400) {
    return pluralize(~~(between / 3600), " hour");
  }
  return pluralize(~~(between / 86400), " day");
}

/**
 * Number formatting
 * like 10000 => 10k
 * @param {number} num
 * @param {number} digits
 */
export function numberFormatter(num, digits) {
  const si = [
    { value: 1e18, symbol: "E" },
    { value: 1e15, symbol: "P" },
    { value: 1e12, symbol: "T" },
    { value: 1e9, symbol: "G" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "k" },
  ];
  for (let i = 0; i < si.length; i++) {
    if (num >= si[i].value) {
      return (num / si[i].value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + si[i].symbol;
    }
  }
  return num.toString();
}

/**
 * 10000 => "10,000"
 * @param {number} num
 */
export function toThousandFilter(num) {
  return (+num || 0).toString().replace(/^-?\d+/g, m => m.replace(/(?=(?!\b)(\d{3})+$)/g, ","));
}

/**
 * Upper case first char
 * @param {String} string
 */
export function uppercaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * @description 保留n位小数并格式化输出（不足的部分补0）
 * @param {String, Number} value 数值
 * @param {Number} n 保留位数
 */
export function formatFloat(value, n) {
  let f = Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
  let s = f.toString();
  let rs = s.indexOf(".");
  if (rs < 0) {
    s += ".";
  }
  for (let i = s.length - s.indexOf("."); i <= n; i++) {
    s += "0";
  }
  return s;
}

// 指令类型
export const commandType = value => {
  return Enums.commandEnum.getLabelByValue(value);
};
// 任务状态类型
export const taskStatusType = value => {
  return Enums.taskStatusEnum.getLabelByValue(value);
};

// 格式化日期
export const parseShortDate = value => {
  if (!value) return "";
  return moment(value).format("YYYY-MM-DD");
};

// 格式化日期为年月日
export const parseTextDate = value => {
  if (!value) return "";
  return moment(value).format("YYYY年MM月DD日");
};

// 格式化月份
export const date2month = value => {
  if (!value) return "";
  return moment(value).format("YYYY-MM");
};

// 格式化时间
export const parseHHmmSS = value => {
  if (!value) return "";
  return moment(value).format("HH:mm:ss");
};

// 格式化日期 + 时间
export const parseDateTime = value => {
  if (!value) return "";
  return moment(value).format("YYYY-MM-DD HH:mm");
};

/**
 * @description 不要年份的时间
 * @param {String} value 时间字符串
 */
export const parseIgnoreYearDateTime = value => {
  if (!value) return "";
  return moment(value).format("MM-DD HH:mm");
};

// 格式化星期
export const parseShortWeek = value => {
  if (!value) return "";
  let week = moment(value).format("d");
  if (week == "1") {
    return "周 一";
  }
  if (week == "2") {
    return "周二";
  }
  if (week == "3") {
    return "周三";
  }
  if (week == "4") {
    return "周四";
  }
  if (week == "5") {
    return "周五";
  }
  if (week == "6") {
    return "周六";
  }
  return "周日";
};

// 格式化货币
export const formatMoney = s => {
  if (/[^0-9]\./.test(s)) return "invalid value";
  if (s == null) return "invalid value";
  s = s.toString();
  s = s.replace(/^(\d*)$/, "$1.");
  s = (s + "00").replace(/(\d*\.\d\d)\d*/, "$1");
  s = s.replace(".", ",");
  let re = /(\d)(\d{3},)/;
  while (re.test(s)) {
    s = s.replace(re, "$1,$2");
  }
  s = s.replace(/,(\d\d)$/, ".$1");
  return s.replace(/^\./, "0.").toString();
};

// 格式化
export const currency = value => {
  if (!value) return 0;
  return formatCurrency(value);
};

// 币格式化带 带万的
export const currencyW = value => {
  if (!value) return 0;
  value /= 10000;
  return formatCurrency(value) + "万";
};

// 百分号格式化
export const percent = (value, fixPoint = 2, unit = "%") => {
  if (!value) return `0.${new Array(fixPoint).fill(0).join("")}${unit}`;
  value = (value * 100).toFixed(fixPoint);
  let result = value.toString() + `${unit}`;
  return result;
};

/**
 * 将数值四舍五入(保留2位小数)后格式化成金额形式
 *
 * @param num 数值(Number或者String)
 * @return 金额格式的字符串,如'1,234,567.45'
 * @type String
 */
export const formatCurrency = num => {
  // eslint-disable-next-line no-useless-escape
  num = num.toString().replace(/\$|\,/g, "");
  if (isNaN(num)) {
    num = "0";
  }
  const sign = num == (num = Math.abs(num));
  num = Math.floor(num * 100 + 0.50000000001);
  let cents = num % 100;
  num = Math.floor(num / 100).toString();
  if (cents < 10) {
    cents = "0" + cents;
  }
  for (let i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
    num = num.substring(0, num.length - (4 * i + 3)) + "," + num.substring(num.length - (4 * i + 3));
  }
  return (sign ? "" : "-") + num + "." + cents;
};

/**
 * @description 手机号码中间四位打※
 * @param {String} phone 电话号码
 */
export const formatPhone = phone => {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
};

// 转成大写
export const uppercase = value => {
  if (!value) return "";
  // 返回处理后的值
  return value.toUpperCase();
};

// 转成小写
export const lowercase = value => {
  if (!value) return "";
  // 返回处理后的值
  return value.toLowerCase();
};

// 首字母大写
export const capitalize = value => {
  if (!value) return "";
  value = value.toString();
  return value.charAt(0).toUpperCase() + value.slice(1);
};

// 去除值为null
export const delNull = value => {
  if (value == null || value == undefined) return "";
};
