// 할 일 목록: 추가 / 고치기 / 날짜 / 별표 / 체크 / 삭제 / 완료 항목 지우기 / 필터 / 남은 개수
// 할 일(글, 완료 여부, 날짜, 별표)은 Supabase의 todos 표에 저장한다. 새로고침해도 표에서 다시 읽어 온다.
// 아래 두 값은 공개해도 되는 주소와 공개 키다 (비밀 키는 절대 여기에 넣지 않는다).
const SUPABASE_URL = "https://pnmivezqsljfptgxqgqi.supabase.co";
const SUPABASE_KEY = "sb_publishable_xx3jUDsEDjocSgjYyPuuIg_J1P59QhD";

const input = document.getElementById("item");
const addButton = document.getElementById("add");
const list = document.getElementById("list");
const count = document.getElementById("count");
const dateInput = document.getElementById("date");
const filterButtons = document.querySelectorAll("#filters button");
const clearDoneButton = document.getElementById("clear-done");

// ---------- Supabase 주고받기 ----------

// 표에 요청을 보내고 결과를 돌려준다. 잘못되면 오류를 던진다.
async function request(path, options) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    method: options.method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    throw new Error("Supabase 오류 " + response.status + ": " + (await response.text()));
  }
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

function idFilter(item) {
  return "todos?id=eq." + encodeURIComponent(item.id);
}

// 저장이나 불러오기가 안 됐을 때 알려 준다
function showError(error) {
  console.error(error);
  alert("저장소(Supabase)와 주고받지 못했어요. 인터넷과 Supabase 설정을 확인해 주세요.");
}

// ---------- 날짜 ----------

// 오늘 날짜를 "2026-10-26" 모양으로 돌려준다 (이 기기의 시간 기준)
function dateText(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

function today() {
  return dateText(new Date());
}

// "2026-10-26" -> "10/26"
function showDate(date) {
  const parts = date.split("-");
  return Number(parts[1]) + "/" + Number(parts[2]);
}

dateInput.value = today();

// 표에서 읽은 한 줄을 화면용 할 일로 만든다
// 날짜(due_date)가 비어 있는 줄은 만든 날(created_at)을 날짜로 쓴다
function toItem(row) {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    date: row.due_date || (row.created_at ? dateText(new Date(row.created_at)) : today()),
    starred: row.starred === true,
  };
}

// ---------- 목록 ----------

let items = [];

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
  async function finish(save) {
    if (finished) {
      return;
    }
    finished = true;
    const newText = editInput.value.trim();
    if (save && newText !== "" && newText !== item.text) {
      try {
        await request(idFilter(item), { method: "PATCH", body: { text: newText } });
        item.text = newText;
      } catch (error) {
        showError(error);
      }
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
    checkbox.addEventListener("change", async function () {
      try {
        await request(idFilter(item), { method: "PATCH", body: { done: checkbox.checked } });
        item.done = checkbox.checked;
      } catch (error) {
        showError(error);
      }
      render();
    });

    const starButton = document.createElement("button");
    starButton.type = "button";
    starButton.className = item.starred ? "star on" : "star";
    starButton.textContent = "★";
    starButton.setAttribute("aria-label", "별표");
    starButton.setAttribute("aria-pressed", item.starred ? "true" : "false");
    starButton.addEventListener("click", async function () {
      try {
        await request(idFilter(item), { method: "PATCH", body: { starred: !item.starred } });
        item.starred = !item.starred;
      } catch (error) {
        showError(error);
      }
      render();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", async function () {
      try {
        await request(idFilter(item), { method: "DELETE" });
        items.splice(items.indexOf(item), 1);
      } catch (error) {
        showError(error);
      }
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
clearDoneButton.addEventListener("click", async function () {
  try {
    await request("todos?done=eq.true", { method: "DELETE" });
    items = items.filter(function (item) {
      return !item.done;
    });
  } catch (error) {
    showError(error);
  }
  render();
});

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    filter = button.dataset.filter;
    render();
  });
});

// 입력칸의 글을 할 일로 더한다
async function addItem() {
  const text = input.value.trim();
  if (text === "") {
    input.value = "";
    input.focus();
    return; // 빈 칸이나 띄어쓰기만 있으면 추가하지 않는다
  }
  const date = dateInput.value || today();
  try {
    const rows = await request("todos", {
      method: "POST",
      body: { text: text, done: false, starred: false, due_date: date },
    });
    items.push(toItem(rows[0]));
    input.value = "";
    dateInput.value = today();
  } catch (error) {
    showError(error);
  }
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

// 처음 열 때: 표에서 할 일을 읽어 와서 보여 준다
async function loadItems() {
  try {
    const rows = await request("todos?select=id,text,done,created_at,starred,due_date&order=created_at.asc", {
      method: "GET",
    });
    items = rows.map(toItem);
  } catch (error) {
    showError(error);
  }
  render();
}

render();
loadItems();
