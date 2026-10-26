// 할 일 목록: 추가 / 날짜 / 별표 / 체크 / 삭제 / 남은 개수 / 새로고침해도 남기기
const STORAGE_KEY = "todo-nini-items";

const input = document.getElementById("item");
const addButton = document.getElementById("add");
const list = document.getElementById("list");
const count = document.getElementById("count");
const dateInput = document.getElementById("date");

// 오늘 날짜를 "2026-10-26" 모양으로 돌려준다 (이 기기의 시간 기준)
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// "2026-10-26" -> "10/26"
function showDate(date) {
  const parts = date.split("-");
  return Number(parts[1]) + "/" + Number(parts[2]);
}

dateInput.value = today();

// 화면에 처음 적혀 있던 할 일을 읽어 둔다 (저장된 게 없을 때 처음 목록으로 쓴다)
function readItemsFromScreen() {
  return Array.from(list.children).map(function (li) {
    return {
      text: li.textContent.replace("삭제", "").trim(),
      done: li.querySelector("input[type='checkbox']").checked,
      date: today(),
      starred: false,
    };
  });
}

function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // 저장소를 못 읽으면 화면에 있던 목록으로 시작한다
  }
  return readItemsFromScreen();
}

function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    // 저장이 안 되어도 화면은 계속 동작한다
  }
}

let items = loadItems();

// items 배열을 화면에 그린다 (별표 한 할 일이 맨 위, 나머지는 더한 순서 그대로)
function render() {
  list.textContent = "";

  const starredFirst = items.filter(function (item) {
    return item.starred;
  }).concat(items.filter(function (item) {
    return !item.starred;
  }));

  starredFirst.forEach(function (item) {
    const li = document.createElement("li");
    li.className = item.done ? "done" : "";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.done;
    checkbox.addEventListener("change", function () {
      item.done = checkbox.checked;
      saveItems();
      render();
    });

    const starButton = document.createElement("button");
    starButton.type = "button";
    starButton.className = item.starred ? "star on" : "star";
    starButton.textContent = "★";
    starButton.setAttribute("aria-label", "별표");
    starButton.setAttribute("aria-pressed", item.starred ? "true" : "false");
    starButton.addEventListener("click", function () {
      item.starred = !item.starred;
      saveItems();
      render();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", function () {
      items.splice(items.indexOf(item), 1);
      saveItems();
      render();
    });

    const textLabel = document.createElement("span");
    textLabel.className = "text";
    textLabel.textContent = item.text;

    li.append(checkbox, textLabel);

    if (item.date) {
      const dateLabel = document.createElement("span");
      dateLabel.className = "date";
      dateLabel.textContent = showDate(item.date);
      li.append(dateLabel);
    }

    li.append(starButton, deleteButton);
    list.appendChild(li);
  });

  count.textContent = items.filter(function (item) {
    return !item.done;
  }).length;
}

// 입력칸의 글을 할 일로 더한다
function addItem() {
  const text = input.value.trim();
  if (text === "") {
    input.value = "";
    input.focus();
    return; // 빈 칸이나 띄어쓰기만 있으면 추가하지 않는다
  }
  items.push({ text: text, done: false, starred: false, date: dateInput.value || today() });
  input.value = "";
  dateInput.value = today();
  saveItems();
  render();
}

addButton.addEventListener("click", addItem);

// 입력칸에서 Enter를 눌러도 추가한다 (한글을 쓰는 중에 누른 Enter는 건너뛴다)
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    addItem();
  }
});

render();
