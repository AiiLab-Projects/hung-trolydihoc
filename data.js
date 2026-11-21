window.schoolPlannerData = {
  subjects: [
    { name: "Toán", icon: "📐", items: ["Thước kẻ", "Máy tính"] },
    { name: "Ngữ văn", icon: "📖", items: ["Sách Ngữ văn"] },
    { name: "Tiếng Anh", icon: "🔤", items: ["Sách Tiếng Anh"] },
    { name: "Khoa học", icon: "🔬", items: ["Vở bài tập Khoa học"] },
    { name: "Lịch sử", icon: "🏛️", items: ["Sách Lịch sử"] },
    { name: "Địa lý", icon: "🌍", items: ["Sách Địa lý"] },
    { name: "Mỹ thuật", icon: "🎨", items: ["Hộp bút màu"] },
    { name: "Thể dục", icon: "⚽", items: ["Đồ thể dục"] },
    { name: "Âm nhạc", icon: "🎵", items: ["Vở nhạc"] },
  ],
  weatherOptions: [
    { id: "sunny", label: "Nắng đẹp", icon: "☀️" },
    { id: "rainy", label: "Có mưa", icon: "🌧️" },
    { id: "cold", label: "Trời lạnh", icon: "🧣" },
  ],
  baseItems: [
    { id: "books", name: "Sách theo thời khóa biểu", icon: "📚" },
    { id: "notebook", name: "Vở ghi bài", icon: "📓" },
    { id: "pencil-case", name: "Hộp bút", icon: "✏️" },
    { id: "water", name: "Bình nước", icon: "💧" },
    { id: "homework", name: "Bài tập / bài cần nộp", icon: "📝" },
  ],
  storageKey: "di-hoc-thoi-v1",
  weatherAdvice: {
    sunny: "Mũ / áo chống nắng",
    rainy: "Áo mưa hoặc ô",
    cold: "Áo khoác ấm",
  },
};

const ruleSubjects = window.schoolPlannerData.subjects;
const ruleWeatherOptions = window.schoolPlannerData.weatherOptions;
const ruleBaseItems = window.schoolPlannerData.baseItems;
const ruleWeatherAdvice = window.schoolPlannerData.weatherAdvice;

window.schoolPlannerData.ruleDefinitions = [
  {
    id: "nested-sports-rain",
    label: "Luật lồng 1",
    description: "NẾU chọn Thể dục, thì TRONG đó NẾU trời mưa",
  },
  {
    id: "subjects",
    label: "Luật môn học",
    description: "Thêm đồ dùng theo từng môn đã chọn",
  },
  {
    id: "weather",
    label: "Luật thời tiết",
    description: "Thêm đồ dùng theo từng loại thời tiết",
  },
  {
    id: "fallback",
    label: "Luật còn lại",
    description: "Nếu không có lựa chọn riêng, giữ danh sách đồ cơ bản",
  },
];

window.schoolPlannerData.evaluateRules = ({
  selectedSubjects = [],
  customSubjects = [],
  selectedWeather = [],
} = {}) => {
  const items = ruleBaseItems.map((item) => ({ ...item }));
  const matchedRules = [];

  if (
    selectedSubjects.includes("Thể dục")
    && selectedWeather.includes("rainy")
  ) {
    const umbrella = {
      id: "umbrella",
      name: ruleWeatherAdvice.rainy,
      icon: "☔",
    };
    if (!items.some((item) => item.id === umbrella.id)) items.push(umbrella);
    matchedRules.push({
      id: "nested-sports-rain",
      label: "Luật lồng 1",
      detail: "Thể dục + trời mưa → Áo mưa hoặc ô",
    });
  }

  const subjectMatches = ruleSubjects.filter((subject) =>
    selectedSubjects.includes(subject.name)
  );
  if (subjectMatches.length > 0) {
    subjectMatches.forEach((subject) => {
      subject.items.forEach((item) => {
        const id = `subject-${item}`;
        if (!items.some((existing) => existing.id === id)) {
          items.splice(1, 0, { id, name: item, icon: subject.icon });
        }
      });
    });
    matchedRules.push({
      id: "subjects",
      label: "Luật môn học",
      detail: subjectMatches.map((subject) => subject.name).join(", "),
    });
  }

  selectedSubjects
    .filter((name) => customSubjects.includes(name))
    .forEach((name) => {
      const id = `custom-${name}`;
      if (!items.some((item) => item.id === id)) {
        items.splice(1, 0, {
          id,
          name: `Sách / tài liệu ${name}`,
          icon: "📘",
        });
      }
    });

  const weatherMatches = ruleWeatherOptions.filter((option) =>
    selectedWeather.includes(option.id)
  );
  weatherMatches.forEach((option) => {
    const id = option.id === "rainy" ? "umbrella" : option.id;
    const name = ruleWeatherAdvice[option.id];
    if (!items.some((item) => item.id === id)) {
      items.push({
        id,
        name,
        icon: option.id === "sunny" ? "🧢" : option.id === "rainy" ? "☔" : "🧣",
      });
    }
  });
  if (weatherMatches.length > 0) {
    matchedRules.push({
      id: "weather",
      label: "Luật thời tiết",
      detail: weatherMatches.map((option) => option.label).join(", "),
    });
  }

  if (matchedRules.length === 0) {
    matchedRules.push({
      id: "fallback",
      label: "Luật còn lại",
      detail: "Không chọn môn hoặc thời tiết riêng → dùng đồ cơ bản",
    });
  }

  return { items, matchedRules };
};
