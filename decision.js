const { subjects, weatherOptions, baseItems, weatherAdvice } = window.schoolPlannerData;
const decisionTableBody = document.querySelector("#decision-table-body");
const decisionCoverage = document.querySelector("#decision-coverage");
const decisionPageStatus = document.querySelector("#decision-page-status");
const decisionPrevious = document.querySelector("#decision-previous");
const decisionNext = document.querySelector("#decision-next");
const decisionPageSize = 25;
const decisionRows = [];
let decisionPage = 0;

for (let subjectMask = 0; subjectMask < 2 ** subjects.length; subjectMask += 1) {
  const selectedSubjects = subjects.filter((_, index) => subjectMask & (1 << index));
  for (let weatherMask = 0; weatherMask < 2 ** weatherOptions.length; weatherMask += 1) {
    const selectedWeather = weatherOptions.filter((_, index) => weatherMask & (1 << index));
    const advice = [
      ...baseItems.map((item) => item.name),
      ...selectedSubjects.flatMap((subject) => subject.items),
      ...selectedWeather.map((option) => weatherAdvice[option.id]),
    ];
    const hasRule = baseItems.length > 0
      && selectedSubjects.every((subject) => Array.isArray(subject.items))
      && selectedWeather.every((option) => typeof weatherAdvice[option.id] === "string");
    decisionRows.push({
      subjects: selectedSubjects.map((subject) => subject.name),
      weather: selectedWeather.map((option) => option.label),
      advice,
      hasRule,
    });
  }
}

function renderDecisionTable() {
  decisionTableBody.replaceChildren();
  const start = decisionPage * decisionPageSize;
  const pageRows = decisionRows.slice(start, start + decisionPageSize);
  pageRows.forEach((row, index) => {
    const tableRow = document.createElement("tr");
    const values = [
      String(start + index + 1),
      row.subjects.length ? row.subjects.join(", ") : "Không chọn môn",
      row.weather.length ? row.weather.join(", ") : "Không chọn thời tiết",
      row.advice.join(", "),
      row.hasRule ? "Đủ luật" : "Thiếu luật",
    ];
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      tableRow.append(cell);
    }
    decisionTableBody.append(tableRow);
  });
  const missingRules = decisionRows.filter((row) => !row.hasRule).length;
  decisionCoverage.textContent = missingRules
    ? `Đã kiểm tra ${decisionRows.length} tổ hợp: có ${missingRules} dòng chưa có đủ luật.`
    : `Đã kiểm tra đủ ${decisionRows.length} tổ hợp: chưa tìm thấy dòng nào thiếu luật.`;
  decisionPageStatus.textContent = `Dòng ${start + 1}–${Math.min(start + decisionPageSize, decisionRows.length)} / ${decisionRows.length}`;
  decisionPrevious.disabled = decisionPage === 0;
  decisionNext.disabled = start + decisionPageSize >= decisionRows.length;
}

decisionPrevious.addEventListener("click", () => {
  decisionPage -= 1;
  renderDecisionTable();
});
decisionNext.addEventListener("click", () => {
  decisionPage += 1;
  renderDecisionTable();
});

renderDecisionTable();
