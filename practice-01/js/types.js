"use strict";

// Предсказания записаны до запуска: 82/string; 6/number; 10/number;
// false/boolean; false/boolean; 0/number; NaN/number; true/boolean;
// "object"/string; "number"/string.
const stringAddition = "8" + 2;
const subtraction = "8" - 2;
const numericAddition = Number("8") + 2;
const stringComparison = "12" > "3";
const strictComparison = 12 === "12";
const emptyConversion = Number("");
const invalidConversion = Number("text");
const booleanConversion = Boolean("false");
const nullType = typeof null;
const nanType = typeof NaN;

console.log('"8" + 2:', stringAddition, "| тип:", typeof stringAddition);
console.log('"8" - 2:', subtraction, "| тип:", typeof subtraction);
console.log('Number("8") + 2:', numericAddition, "| тип:", typeof numericAddition);
console.log('"12" > "3":', stringComparison, "| тип:", typeof stringComparison);
console.log('12 === "12":', strictComparison, "| тип:", typeof strictComparison);
console.log('Number(""):', emptyConversion, "| тип:", typeof emptyConversion);
console.log('Number("text"):', invalidConversion, "| тип:", typeof invalidConversion);
console.log('Boolean("false"):', booleanConversion, "| тип:", typeof booleanConversion);
console.log("typeof null:", nullType, "| тип:", typeof nullType);
console.log("typeof NaN:", nanType, "| тип:", typeof nanType);
