// performance-analyzer.js
// 실적 자동 분석(추이, 목표 달성률, 성장률 등)
const { getGoals } = require('./goal-tracker');

function analyzePerformance() {
  const goals = getGoals();
  // 예시: 목표치(월 17건, 누적 50건) 대비 달성률
  const monthTarget = 17;
  const totalTarget = 50;
  const monthRate = ((goals.month / monthTarget) * 100).toFixed(1);
  const totalRate = ((goals.total / totalTarget) * 100).toFixed(1);
  return {
    month: goals.month,
    week: goals.week,
    total: goals.total,
    monthTarget,
    totalTarget,
    monthRate,
    totalRate,
    summary: `월간 달성률: ${monthRate}% / 누적 달성률: ${totalRate}%`
  };
}

module.exports = { analyzePerformance };