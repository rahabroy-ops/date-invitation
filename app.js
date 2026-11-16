/*
  НАСТРОЙКИ САЙТА. Отредактируй доступные даты и реальные места.
*/
const CONFIG = {
  googleClientId: "12739828419-og463a6ikhsm07qhr5dl047jb6lpvlcd.apps.googleusercontent.com",
  calendarTimeZone: "Asia/Almaty",
  reminderMinutes: [1440, 30],
  telegramWebAppUrl: "https://script.google.com/macros/s/AKfycbwffe3kDNQCEE4aqVVyBZvl20TtymiAjFOl96j8LkETCBcWs4WcH6Loibs7eabWo1J-Iw/exec",
  // Впиши сюда ТОЛЬКО даты, когда ты точно свободен.
  // Формат: ГГГГ-ММ-ДД. Сейчас в примере стоят даты после 10 декабря 2026.
  availableDates: [
    "2026-12-14",
    "2026-12-15",
    "2026-12-20",
    "2026-12-21"
  ],
  places: [
    { id: "park", name: "Центральный парк", type: "Парк для прогулки", emoji: "🌳", address: "Центральный парк, Астана, Казахстан" },
    { id: "coffee1", name: "Любимая кофейня", type: "Кофе и уютная атмосфера", emoji: "☕", address: "Master coffee Кабанбай батыра 56а, Астана, Казахстан" },
    { id: "coffee2", name: "Ещё одна кофейня", type: "Десерт и разговоры", emoji: "🍰", address: "Hani Туркестан 20, Астана, Казахстан" }
  ]
};

const $ = (id) => document.getElementById(id);
let selectedPlace = null;
let tokenClient = null;

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.toggle("active", screen.id === id);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Кнопка «Нет» убегает и от мышки, и от касания на телефоне.
function moveNoButton() {
  const button = $("no-button");
  const area = $("answer-area");
  const maxX = Math.max(0, area.clientWidth - button.offsetWidth);
  const maxY = Math.max(0, area.clientHeight - button.offsetHeight);
  button.style.position = "absolute";
  button.style.left = `${Math.floor(Math.random() * (maxX + 1))}px`;
  button.style.top = `${Math.floor(Math.random() * (maxY + 1))}px`;
  button.textContent = ["Не-а 😜", "Поймай меня!", "Мимо! 🙈"][Math.floor(Math.random() * 3)];
}
$("no-button").addEventListener("pointerenter", moveNoButton);
$("no-button").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  moveNoButton();
});
$("no-button").addEventListener("click", (event) => {
  event.preventDefault();
  moveNoButton();
});
$("yes-button").addEventListener("click", () => showScreen("screen-date"));
document.querySelectorAll("[data-back]").forEach(button => {
  button.addEventListener("click", () => showScreen(button.dataset.back));
});

// Заполняем select только датами из CONFIG, не раньше 10 декабря 2026.
const dateInput = $("date-input");
const timeInput = $("time-input");
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const firstAllowedDate = "2026-12-10";

function populateDates() {
  dateInput.innerHTML = '<option value="">Выбери удобную дату</option>';
  const dates = CONFIG.availableDates
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .filter(date => date >= firstAllowedDate && date >= localDate)
    .sort();

  dates.forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = new Intl.DateTimeFormat("ru-RU", {
      weekday: "long", day: "numeric", month: "long"
    }).format(new Date(`${date}T12:00:00`));
    dateInput.appendChild(option);
  });

  if (dates.length === 0) {
    dateInput.innerHTML = '<option value="">Пока нет доступных дат</option>';
  }
}
populateDates();

function mapsUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
}
function selectPlace(place) {
  selectedPlace = place;
  [...$("place-list").children].forEach((element, index) => {
    element.classList.toggle("selected", CONFIG.places[index].id === place.id);
  });
  const query = encodeURIComponent(place.address);
  $("map-frame").src = `https://www.google.com/maps?q=${query}&output=embed`;
  $("map-link").href = mapsUrl(place);
}
function renderPlaces() {
  $("place-list").innerHTML = "";
  CONFIG.places.forEach(place => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "place-option";
    item.innerHTML = `<span class="place-emoji">${place.emoji}</span><span class="place-info"><strong>${place.name}</strong><small>${place.type}</small></span><span class="radio-dot"></span>`;
    item.addEventListener("click", () => selectPlace(place));
    $("place-list").appendChild(item);
  });
  if (CONFIG.places.length) selectPlace(CONFIG.places[0]);
}
renderPlaces();

$("date-next").addEventListener("click", () => {
  $("date-error").textContent = "";
  const chosenDate = dateInput.value;
  if (!chosenDate || !timeInput.value) {
    $("date-error").textContent = "Сначала выбери дату и время 💗";
    return;
  }
  if (!CONFIG.availableDates.includes(chosenDate) || chosenDate < firstAllowedDate || chosenDate < localDate) {
    $("date-error").textContent = "Эта дата недоступна. Выбери дату из списка 💗";
    return;
  }
  showScreen("screen-place");
});

function sendTelegramNotification(data) {
  if (!CONFIG.telegramWebAppUrl) return;

  fetch(CONFIG.telegramWebAppUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(data)
  }).catch(error => {
    console.error("Ошибка отправки в Telegram:", error);
  });
}

$("place-next").addEventListener("click", () => {
  if (!selectedPlace) {
    $("place-error").textContent = "Выбери одно местечко 💗";
    return;
  }
  $("place-error").textContent = "";
  const date = new Date(`${dateInput.value}T12:00:00`);
  const dateText = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric", month: "long", year: "numeric"
  }).format(date);
  $("summary").innerHTML = `<div>🗓️ <strong>Когда:</strong> ${dateText}</div><div>🕰️ <strong>Во сколько:</strong> ${timeInput.value}</div><div>📍 <strong>Где:</strong> ${selectedPlace.name}</div><div>💌 <strong>Адрес:</strong> ${selectedPlace.address}</div>`;
  sendTelegramNotification({
  date: dateText,
  time: timeInput.value,
  place: selectedPlace.name,
  address: selectedPlace.address
});
  showScreen("screen-finish");
});

function setCalendarStatus(message, isError = false) {
  $("calendar-status").textContent = message;
  $("calendar-status").style.color = isError ? "#c34e6e" : "#6c987d";
}
function loadGoogleIdentity() {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - started > 10000) return reject(new Error("Не удалось загрузить Google Sign-In. Проверь интернет."));
      setTimeout(check, 150);
    };
    check();
  });
}
async function requestCalendarAccess() {
  if (!CONFIG.googleClientId || CONFIG.googleClientId.startsWith("ВСТАВЬТЕ")) {
    setCalendarStatus("Сначала настрой Google OAuth Client ID по инструкции в README.", true);
    return;
  }
  try {
    await loadGoogleIdentity();
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.googleClientId,
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback: async response => {
        if (response.error) {
          setCalendarStatus("Google не выдал разрешение. Можно попробовать ещё раз.", true);
          return;
        }
        await createCalendarEvent(response.access_token);
      }
    });
    tokenClient.requestAccessToken({ prompt: "consent" });
  } catch (error) {
    setCalendarStatus(error.message || "Не получилось подключиться к Google.", true);
  }
}
async function createCalendarEvent(accessToken) {
  setCalendarStatus("Добавляем ваше свидание в календарь…");
  // Казахстан: UTC+05:00. Время берётся из выбранной даты и времени.
  const start = new Date(`${dateInput.value}T${timeInput.value}:00+05:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const event = {
    summary: "Свидание 💗",
    description: `Наше свидание!\nМесто: ${selectedPlace.name}\nАдрес: ${selectedPlace.address}\nКарта: ${mapsUrl(selectedPlace)}`,
    location: selectedPlace.address,
    start: { dateTime: start.toISOString(), timeZone: CONFIG.calendarTimeZone },
    end: { dateTime: end.toISOString(), timeZone: CONFIG.calendarTimeZone },
    reminders: {
      useDefault: false,
      overrides: CONFIG.reminderMinutes.map(minutes => ({ method: "popup", minutes }))
    }
  };
  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Google Calendar не смог создать событие.");
    setCalendarStatus("Готово! Свидание добавлено в Google Calendar с напоминаниями. 💗");
    $("calendar-button").textContent = "Событие добавлено ✓";
    $("calendar-button").disabled = true;
  } catch (error) {
    setCalendarStatus(`${error.message} Проверь настройки Google Calendar API и OAuth.`, true);
  }
}
$("calendar-button").addEventListener("click", requestCalendarAccess);
$("restart-button").addEventListener("click", () => {
  dateInput.value = "";
  timeInput.value = "18:00";
  $("calendar-status").textContent = "";
  $("calendar-button").disabled = false;
  $("calendar-button").textContent = "Разрешить Google Calendar";
  showScreen("screen-question");
});
