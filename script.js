// 할 일 목록: 추가 / 고치기 / 날짜 / 별표 / 체크 / 삭제 / 완료 항목 지우기 / 필터 / 남은 개수 / 새로고침해도 남기기
const STORAGE_KEY = "todo-nini-items";

const input = document.getElementById("item");
const addButton = document.getElementById("add");
const list = document.getElementById("list");
const count = document.getElementById("count");
const dateInput = document.getElementById("date");
const filterButtons = document.querySelectorAll("#filters button");
const clearDoneButton = document.getElementById("clear-done");

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

// 어떤 할 일을 보여 줄지: all(전체) / remaining(남은 것) / done(완료) / starred(별표만)
let filter = "all";

function matchesFilter(item) {
  if (filter === "remaining") {
    return !item.done;
  }
  if (filter === "done") {
    return item.done;
  }
  if (filter === "starred") {
    return item.starred;
  }
  return true;
}

// 글을 두 번 누르면 그 자리에 입력칸이 나와서 고칠 수 있다
// Enter나 다른 곳을 누르면 저장, Esc는 취소, 비우면 원래 글 그대로
function startEditing(item, li, textLabel) {
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "edit";
  editInput.value = item.text;
  editInput.setAttribute("aria-label", "할 일 고치기");

  let finished = false;
  function finish(save) {
    if (finished) {
      return;
    }
    finished = true;
    const newText = editInput.value.trim();
    if (save && newText !== "") {
      item.text = newText;
      saveItems();
    }
    render();
  }

  editInput.addEventListener("keydown", function (event) {
    if (event.isComposing) {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      finish(false);
    }
  });
  editInput.addEventListener("blur", function () {
    finish(true);
  });

  li.replaceChild(editInput, textLabel);
  editInput.focus();
  editInput.select();
}

// items 배열을 화면에 그린다 (별표 한 할 일이 맨 위, 나머지는 더한 순서 그대로)
function render() {
  list.textContent = "";

  const shown = items.filter(matchesFilter);
  const starredFirst = shown.filter(function (item) {
    return item.starred;
  }).concat(shown.filter(function (item) {
    return !item.starred;
  }));

  starredFirst.forEach(function (item) {
    const li = document.createElement("li");
    li.className = item.done ? "done" : "";
    if (!item.done && item.date && item.date < today()) {
      li.className = "overdue"; // 끝내지 못했는데 날짜가 지났다
    }

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
    textLabel.title = "두 번 누르면 고칠 수 있어요";
    textLabel.addEventListener("dblclick", function () {
      startEditing(item, li, textLabel);
    });

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

  clearDoneButton.disabled = !items.some(function (item) {
    return item.done;
  });

  filterButtons.forEach(function (button) {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("on", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

// 체크한 할 일을 모두 지운다 (어떤 필터를 보고 있어도 완료한 것 전부)
clearDoneButton.addEventListener("click", function () {
  items = items.filter(function (item) {
    return !item.done;
  });
  saveItems();
  render();
});

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    filter = button.dataset.filter;
    render();
  });
});

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
