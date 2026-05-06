const foods = {
  protein: {
    name: "肉蛋奶",
    unit: "g",
    defaultAmount: 0,
    color: "#bc604a",
    visualClass: "protein",
    items: [
      { name: "鸡胸肉", kcalPerUnit: 1.65 },
      { name: "鸡蛋", kcalPerUnit: 1.55 },
      { name: "牛奶", kcalPerUnit: 0.62 },
      { name: "牛肉", kcalPerUnit: 2.5 },
      { name: "豆腐", kcalPerUnit: 0.85 },
    ],
  },
  vegetable: {
    name: "蔬菜",
    unit: "g",
    defaultAmount: 0,
    color: "#5e8f68",
    visualClass: "vegetable",
    items: [
      { name: "黄瓜", kcalPerUnit: 0.16 },
      { name: "西兰花", kcalPerUnit: 0.34 },
      { name: "番茄", kcalPerUnit: 0.18 },
      { name: "生菜", kcalPerUnit: 0.15 },
      { name: "胡萝卜", kcalPerUnit: 0.41 },
    ],
  },
  fruit: {
    name: "水果",
    unit: "g",
    defaultAmount: 0,
    color: "#d75d48",
    visualClass: "fruit",
    items: [
      { name: "苹果", kcalPerUnit: 0.52 },
      { name: "香蕉", kcalPerUnit: 0.89 },
      { name: "橙子", kcalPerUnit: 0.47 },
      { name: "草莓", kcalPerUnit: 0.32 },
      { name: "葡萄", kcalPerUnit: 0.69 },
    ],
  },
  grain: {
    name: "主食",
    unit: "g",
    defaultAmount: 0,
    color: "#d8a744",
    visualClass: "grain",
    items: [
      { name: "米饭", kcalPerUnit: 1.16 },
      { name: "面条", kcalPerUnit: 1.38 },
      { name: "馒头", kcalPerUnit: 2.23 },
      { name: "全麦面包", kcalPerUnit: 2.47 },
      { name: "红薯", kcalPerUnit: 0.86 },
    ],
  },
  drink: {
    name: "水与饮品",
    unit: "ml",
    defaultAmount: 0,
    color: "#4b89a8",
    visualClass: "drink",
    items: [
      { name: "白水", kcalPerUnit: 0 },
      { name: "黑咖啡", kcalPerUnit: 0.02 },
      { name: "拿铁", kcalPerUnit: 0.55 },
      { name: "奶茶", kcalPerUnit: 0.75 },
      { name: "无糖茶", kcalPerUnit: 0.01 },
    ],
  },
};

const state = {
  person: {
    age: 28,
    sex: "female",
    height: 168,
    weight: 58,
  },
  intake: {},
};

const els = {
  age: document.querySelector("#ageInput"),
  sex: document.querySelector("#sexInput"),
  height: document.querySelector("#heightInput"),
  weight: document.querySelector("#weightInput"),
  avatar: document.querySelector("#personAvatar"),
  beam: document.querySelector("#scaleBeam"),
  foodPan: document.querySelector("#foodPan"),
  foodList: document.querySelector("#foodList"),
  balanceButton: document.querySelector("#balanceButton"),
  clearButton: document.querySelector("#clearButton"),
  balanceLabel: document.querySelector("#balanceLabel"),
  balanceScore: document.querySelector("#balanceScore"),
  statusDot: document.querySelector("#statusDot"),
  statusTitle: document.querySelector("#statusTitle"),
  statusText: document.querySelector("#statusText"),
  needCalories: document.querySelector("#needCalories"),
  intakeCalories: document.querySelector("#intakeCalories"),
  weekForecast: document.querySelector("#weekForecast"),
};

function createIntakeCategory(key) {
  const food = foods[key];
  const share = Math.floor(100 / food.items.length);
  const remainder = 100 - share * food.items.length;

  return {
    amount: food.defaultAmount,
    shares: food.items.map((item, index) => ({
      name: item.name,
      percent: share + (index === 0 ? remainder : 0),
    })),
  };
}

function getNeedCalories() {
  const base =
    state.person.sex === "male"
      ? 10 * state.person.weight + 6.25 * state.person.height - 5 * state.person.age + 5
      : 10 * state.person.weight + 6.25 * state.person.height - 5 * state.person.age - 161;

  return Math.round(base * 1.45);
}

function getCategoryCalories(key, entry) {
  const food = foods[key];
  const weightedKcal = entry.shares.reduce((sum, share, index) => {
    return sum + (share.percent / 100) * food.items[index].kcalPerUnit;
  }, 0);

  return entry.amount * weightedKcal;
}

function getIntakeCalories() {
  return Math.round(
    Object.entries(state.intake).reduce((sum, [key, entry]) => {
      return sum + getCategoryCalories(key, entry);
    }, 0),
  );
}

function getRatio() {
  const need = getNeedCalories();
  return need ? getIntakeCalories() / need : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function addFood(key) {
  if (!(key in state.intake)) {
    state.intake[key] = createIntakeCategory(key);
  }
  render(true);
}

function updatePersonFromInputs() {
  state.person.age = Number(els.age.value) || state.person.age;
  state.person.sex = els.sex.value;
  state.person.height = Number(els.height.value) || state.person.height;
  state.person.weight = Number(els.weight.value) || state.person.weight;
  render(true);
}

function setShare(key, index, value) {
  const shares = state.intake[key].shares;
  const nextValue = clamp(Number(value) || 0, 0, 100);
  const remaining = 100 - nextValue;
  const others = shares.filter((_, itemIndex) => itemIndex !== index);
  const currentOtherTotal = others.reduce((sum, item) => sum + item.percent, 0);

  shares[index].percent = nextValue;

  if (!others.length) {
    render(true);
    return;
  }

  let used = 0;
  others.forEach((item, otherIndex) => {
    const isLast = otherIndex === others.length - 1;
    const nextPercent = currentOtherTotal
      ? Math.round((item.percent / currentOtherTotal) * remaining)
      : Math.floor(remaining / others.length);
    item.percent = isLast ? remaining - used : nextPercent;
    used += item.percent;
  });

  render(true);
}

function renderFoodList() {
  const entries = Object.entries(state.intake);
  els.foodList.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "把下方卡片拖到这里";
    els.foodList.append(empty);
    return;
  }

  entries.forEach(([key, entry]) => {
    const food = foods[key];
    const row = document.createElement("div");
    const totalShare = entry.shares.reduce((sum, item) => sum + item.percent, 0);
    row.className = "food-row category-row";
    row.innerHTML = `
      <div class="category-main">
        <span class="food-visual ${food.visualClass}" aria-hidden="true"></span>
        <div>
          <strong>${food.name}</strong>
          <small>${Math.round(getCategoryCalories(key, entry))} kcal · 占比 ${totalShare}%</small>
        </div>
        <label class="amount-control">
          <input type="number" min="0" step="10" value="${entry.amount}" aria-label="${food.name}总量，单位${food.unit}" />
          <span>${food.unit}</span>
        </label>
        <button class="remove-food" type="button" aria-label="移除${food.name}">×</button>
      </div>
      <div class="subfood-list"></div>
    `;

    row.querySelector(".amount-control input").addEventListener("input", (event) => {
      entry.amount = Number(event.target.value) || 0;
      row.querySelector(".category-main small").textContent =
        `${Math.round(getCategoryCalories(key, entry))} kcal · 占比 ${totalShare}%`;
      renderDockValues();
      renderStatus();
      renderTilt(true);
    });

    row.querySelector(".remove-food").addEventListener("click", () => {
      delete state.intake[key];
      render(true);
    });

    const subfoodList = row.querySelector(".subfood-list");
    entry.shares.forEach((share, index) => {
      const item = food.items[index];
      const sub = document.createElement("label");
      sub.className = "subfood-row";
      sub.innerHTML = `
        <span>${item.name}</span>
        <input type="range" min="0" max="100" step="5" value="${share.percent}" aria-label="${item.name}占比" />
        <input type="number" min="0" max="100" step="5" value="${share.percent}" aria-label="${item.name}占比数字" />
        <em>%</em>
      `;

      sub.querySelector('input[type="range"]').addEventListener("input", (event) => {
        setShare(key, index, event.target.value);
      });

      sub.querySelector('input[type="number"]').addEventListener("input", (event) => {
        setShare(key, index, event.target.value);
      });

      subfoodList.append(sub);
    });

    els.foodList.append(row);
  });
}

function renderDockValues() {
  document.querySelectorAll(".food-card").forEach((card) => {
    const key = card.dataset.key;
    const entry = state.intake[key];
    const amount = entry ? entry.amount : 0;
    const unit = foods[key].unit;
    card.querySelector("small").textContent = `${amount} ${unit}`;
  });
}

function renderBodyShape() {
  const bmi = state.person.weight / (state.person.height / 100) ** 2;
  const width = clamp(58 + (bmi - 18.5) * 3.6, 58, 112);
  els.avatar.style.setProperty("--body-width", `${width}px`);
}

function renderStatus() {
  const ratio = getRatio();
  const diff = ratio - 1;
  const percent = Math.round(ratio * 100);
  const weeklyKg = ((getIntakeCalories() - getNeedCalories()) * 7) / 7700;
  const direction = weeklyKg >= 0 ? "+" : "";

  els.balanceScore.textContent = `${percent}%`;
  els.needCalories.textContent = `${getNeedCalories()} kcal`;
  els.intakeCalories.textContent = `${getIntakeCalories()} kcal`;
  els.weekForecast.textContent = `${direction}${weeklyKg.toFixed(2)} kg`;

  if (Math.abs(diff) <= 0.08) {
    els.balanceLabel.textContent = "接近平衡";
    els.statusTitle.textContent = "营养协会建议区间";
    els.statusText.textContent = "摄入与身体需求基本匹配";
    els.statusDot.style.background = "#5e8f68";
    els.statusDot.style.boxShadow = "0 0 0 8px rgba(94,143,104,.18)";
  } else if (diff < 0) {
    els.balanceLabel.textContent = "摄入不足";
    els.statusTitle.textContent = "左低右高";
    els.statusText.textContent = "今天的摄入还撑不起身体需求";
    els.statusDot.style.background = "#4b89a8";
    els.statusDot.style.boxShadow = "0 0 0 8px rgba(75,137,168,.18)";
  } else {
    els.balanceLabel.textContent = "摄入过量";
    els.statusTitle.textContent = "左高右低";
    els.statusText.textContent = "摄入超过了当前身体消耗";
    els.statusDot.style.background = "#c7644f";
    els.statusDot.style.boxShadow = "0 0 0 8px rgba(199,100,79,.18)";
  }
}

function renderTilt(animate = false) {
  const diff = clamp(getRatio() - 1, -0.55, 0.55);
  const tilt = diff * 18;
  els.beam.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);

  if (animate) {
    els.beam.classList.remove("shake");
    requestAnimationFrame(() => {
      els.beam.classList.add("shake");
    });
  }
}

function render(animate = false, rebuildFoodList = true) {
  if (rebuildFoodList) {
    renderFoodList();
  }
  renderDockValues();
  renderBodyShape();
  renderStatus();
  renderTilt(animate);
}

function dayBalance() {
  const surplus = getIntakeCalories() - getNeedCalories();

  if (Math.abs(getRatio() - 1) <= 0.08) {
    els.balanceButton.classList.add("pulse");
    window.setTimeout(() => els.balanceButton.classList.remove("pulse"), 780);
    return;
  }

  const weeklyKg = (surplus * 7) / 7700;
  const nextWeight = clamp(state.person.weight + weeklyKg * 0.42, 25, 180);
  state.person.weight = Number(nextWeight.toFixed(1));
  els.weight.value = state.person.weight;
  els.balanceButton.classList.add("pulse");
  window.setTimeout(() => els.balanceButton.classList.remove("pulse"), 780);
  render(true);
}

document.querySelectorAll(".food-card").forEach((card) => {
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", card.dataset.key);
    event.dataTransfer.effectAllowed = "copy";
  });

  card.addEventListener("click", () => addFood(card.dataset.key));
});

els.avatar.addEventListener("dragstart", (event) => {
  event.dataTransfer.setData("text/plain", "person");
});

els.foodPan.addEventListener("dragover", (event) => {
  event.preventDefault();
  els.foodPan.classList.add("drag-over");
});

els.foodPan.addEventListener("dragleave", () => {
  els.foodPan.classList.remove("drag-over");
});

els.foodPan.addEventListener("drop", (event) => {
  event.preventDefault();
  els.foodPan.classList.remove("drag-over");
  const key = event.dataTransfer.getData("text/plain");
  if (foods[key]) {
    addFood(key);
  }
});

[els.age, els.sex, els.height, els.weight].forEach((input) => {
  input.addEventListener("input", updatePersonFromInputs);
});

els.clearButton.addEventListener("click", () => {
  state.intake = {};
  render(true);
});

els.balanceButton.addEventListener("click", dayBalance);

render();
