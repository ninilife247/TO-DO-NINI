// 할 일 목록: 추가 / 체크 / 삭제 / 남은 개수 / 새로고침해도 남기기
const STORAGE_KEY = "todo-nini-items";

const input = document.getElementById("item");
const addButton = document.getElementById("add");
const list = document.getElementById("list");
const count = document.getElementById("count");

// 화면에 처음 적혀 있던 할 일을 읽어 둔다 (저장된 게 없을 때 처음 목록으로 쓴다)
function readItemsFromScreen() {
  return Array.from(list.children).map(function (li) {
    return {
      text: li.textContent.replace("삭제", "").trim(),
      done: li.querySelector("input[type='checkbox']").checked,
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

// items 배열을 화면에 그린다
function render() {
  list.textContent = "";

  items.forEach(function (item, index) {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.done;
    checkbox.addEventListener("change", function () {
      items[index].done = checkbox.checked;
      saveItems();
      render();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", function () {
      items.splice(index, 1);
      saveItems();
      render();
    });

    li.append(checkbox, " " + item.text + " ", deleteButton);
    list.appendChild(li);
  });

  count.textContent = items.filter(function (item) {
    return !item.done;
  }).length;
}

addButton.addEventListener("click", function () {
  const text = input.value.trim();
  if (text === "") {
    return; // 빈 칸은 추가하지 않는다
  }
  items.push({ text: text, done: false });
  input.value = "";
  saveItems();
  render();
});

render();
