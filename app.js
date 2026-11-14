const { subjects, weatherOptions, baseItems, storageKey } = window.schoolPlannerData;
const subjectList = document.querySelector("#subject-list");
const weatherList = document.querySelector("#weather-list");
const checklistCard = document.querySelector("#checklist-card");
const checklist = document.querySelector("#checklist");
const progress = document.querySelector("#progress");
const note = document.querySelector("#checklist-note");

function readSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      subjects: Array.isArray(saved.subjects) ? saved.subjects : [],
      customSubjects: Array.isArray(saved.customSubjects) ? saved.customSubjects : [],
      weather: Array.isArray(saved.weather) ? saved.weather : [],
      checkedItems: Array.isArray(saved.checkedItems) ? saved.checkedItems : [],
      checklist: Array.isArray(saved.checklist) ? saved.checklist : [],
      date: typeof saved.date === "string" ? saved.date : "",
    };
  } catch {
    return { subjects: [], customSubjects: [], weather: [], checkedItems: [], checklist: [], date: "" };
  }
}

let state = readSavedState();
const today = new Date();
const dateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

if (state.date !== dateKey) {
  state.checkedItems = [];
  state.checklist = [];
  state.date = dateKey;
}

document.querySelector("#today-date").textContent = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(today);

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function createChoice(label, icon, selected, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "choice";
  button.setAttribute("aria-pressed", String(selected));
  button.textContent = `${icon} ${label}`;
  button.addEventListener("click", onClick);
  return button;
}

function renderSubjects() {
  subjectList.replaceChildren();
  for (const subject of subjects) {
    subjectList.append(createChoice(subject.name, subject.icon, state.subjects.includes(subject.name), () => {
      state.subjects = state.subjects.includes(subject.name)
        ? state.subjects.filter((name) => name !== subject.name)
        : [...state.subjects, subject.name];
      saveState();
      renderSubjects();
    }));
  }
  for (const name of state.customSubjects) {
    subjectList.append(createChoice(name, "📘", state.subjects.includes(name), () => {
      state.subjects = state.subjects.includes(name)
        ? state.subjects.filter((subject) => subject !== name)
        : [...state.subjects, name];
      saveState();
      renderSubjects();
    }));
  }
}

function renderWeather() {
  weatherList.replaceChildren();
  for (const option of weatherOptions) {
    weatherList.append(createChoice(option.label, option.icon, state.weather.includes(option.id), () => {
      state.weather = state.weather.includes(option.id)
        ? state.weather.filter((id) => id !== option.id)
        : [...state.weather, option.id];
      saveState();
      renderWeather();
    }));
  }
}

function buildChecklist() {
  const items = [...baseItems];
  if (state.subjects.length > 0) {
    const subjectItems = subjects
      .filter((subject) => state.subjects.includes(subject.name))
      .flatMap((subject) => subject.items.map((item) => ({ id: `subject-${item}`, name: item, icon: subject.icon })));
    const customItems = state.customSubjects
      .filter((name) => state.subjects.includes(name))
      .map((name) => ({ id: `custom-${name}`, name: `Sách / tài liệu ${name}`, icon: "📘" }));
    items.splice(1, 0, ...subjectItems, ...customItems);
  }
  if (state.weather.includes("rainy")) {
    items.push({ id: "umbrella", name: "Áo mưa hoặc ô", icon: "☔" });
  }
  if (state.weather.includes("cold")) {
    items.push({ id: "jacket", name: "Áo khoác ấm", icon: "🧥" });
  }
  if (state.weather.includes("sunny")) {
    items.push({ id: "sunscreen", name: "Mũ / áo chống nắng", icon: "🧢" });
  }
  return items.filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index);
}

function renderChecklist(items = state.checklist) {
  checklist.replaceChildren();
  items.forEach((item) => {
    const label = document.createElement("label");
    label.className = "check-item";
    const input = document.createElement("input");
    input.className = "item-check";
    input.type = "checkbox";
    input.checked = state.checkedItems.includes(item.id);
    input.setAttribute("aria-label", item.name);
    const checkmark = document.createElement("span");
    checkmark.className = "checkmark";
    checkmark.setAttribute("aria-hidden", "true");
    checkmark.textContent = "✓";
    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = `${item.icon} ${item.name}`;
    input.addEventListener("change", () => {
      state.checkedItems = input.checked
        ? [...state.checkedItems, item.id]
        : state.checkedItems.filter((id) => id !== item.id);
      saveState();
      updateProgress(items);
    });
    label.append(input, checkmark, name);
    checklist.append(label);
  });
  updateProgress(items);
}

function updateProgress(items) {
  const done = items.filter((item) => state.checkedItems.includes(item.id)).length;
  progress.textContent = `${done}/${items.length} món`;
}

document.querySelector("#custom-subject-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#custom-subject");
  const name = input.value.trim();
  const exists = subjects.some((subject) => subject.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    || state.customSubjects.some((subject) => subject.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (!name || exists) {
    input.focus();
    return;
  }
  state.customSubjects.push(name);
  state.subjects.push(name);
  input.value = "";
  saveState();
  renderSubjects();
});

document.querySelector("#suggest-button").addEventListener("click", () => {
  state.checklist = buildChecklist();
  state.checkedItems = state.checkedItems.filter((id) => state.checklist.some((item) => item.id === id));
  note.textContent = state.subjects.length
    ? `Đã thêm đồ dùng cho ${state.subjects.join(", ")}${state.weather.length ? " và thời tiết hôm nay" : ""}.`
    : "Đây là những món cơ bản. Chọn môn học hoặc thời tiết để nhận gợi ý phù hợp hơn.";
  saveState();
  renderChecklist();
  checklistCard.hidden = false;
  checklistCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.querySelector("#reset-button").addEventListener("click", () => {
  state.checkedItems = [];
  saveState();
  renderChecklist();
});

renderSubjects();
renderWeather();
if (state.checklist.length > 0) {
  note.textContent = "Danh sách đã lưu trên thiết bị này. Tích vào từng món khi bạn cho vào cặp nhé.";
  checklistCard.hidden = false;
  renderChecklist();
}
