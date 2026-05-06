const foods = {
  protein: {
    name: "肉蛋奶",
    unit: "g",
    defaultAmount: 220,
    kcalPerUnit: 1.9,
    color: "#bc604a",
    visualClass: "protein",
  },
  vegetable: {
    name: "蔬菜",
    unit: "g",
    defaultAmount: 500,
    kcalPerUnit: 0.28,
    color: "#5e8f68",
    visualClass: "vegetable",
  },
  fruit: {
    name: "水果",
    unit: "g",
    defaultAmount: 300,
    kcalPerUnit: 0.55,
    color: "#d75d48",
    visualClass: "fruit",
  },
  grain: {
    name: "主食",
    unit: "g",
    defaultAmount: 300,
    kcalPerUnit: 2.35,
    color: "#d8a744",
    visualClass: "grain",
  },
  drink: {
    name: "水与饮品",
    unit: "ml",
    defaultAmount: 1600,
    kcalPerUnit: 0.04,
    color: "#4b89a8",
    visualClass: "drink",
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

function getNeedCalories() {
  const base =
    state.person.sex === "male"
      ? 10 * state.person.weight + 6.25 * state.person.height - 5 * state.person.age + 5
      : 10 * state.person.weight + 6.25 * state.person.height - 5 * state.person.age - 161;

  return Math.round(base * 1.45);
}

function getIntakeCalories() {
  return Math.round(
    Object.entries(state.intake).reduce((sum, [key, amount]) => {
      return sum + amount * foods[key].kcalPerUnit;
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
  const food = foods[key];
  state.intake[key] = (state.intake[key] || 0) + food.defaultAmount;
  render(true);
}

function updatePersonFromInputs() {
  state.person.age = Number(els.age.value) || state.person.age;
  state.person.sex = els.sex.value;
  state.person.height = Number(els.height.value) || state.person.height;
  state.person.weight = Number(els.weight.value) || state.person.weight;
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

  entries.forEach(([key, amount]) => {
    const food = foods[key];
    const row = document.createElement("div");
    row.className = "food-row";
    row.innerHTML = `
      <span class="food-visual ${food.visualClass}" aria-hidden="true"></span>
      <strong>${food.name}</strong>
      <input type="number" min="0" step="10" value="${amount}" aria-label="${food.name}重量，单位${food.unit}" />
      <small>${food.unit}</small>
      <button class="remove-food" type="button" aria-label="移除${food.name}">×</button>
    `;

    row.querySelector("input").addEventListener("input", (event) => {
      state.intake[key] = Number(event.target.value) || 0;
      render(true, false);
    });

    row.querySelector("button").addEventListener("click", () => {
      delete state.intake[key];
      render(true);
    });

    els.foodList.append(row);
  });
}

function renderDockValues() {
  document.querySelectorAll(".food-card").forEach((card) => {
    const key = card.dataset.key;
    const amount = state.intake[key] || 0;
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
