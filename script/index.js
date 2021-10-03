// import data from "./data.js";
// import * as handles from "./handle-selector.js";

const log = console.log;
const oneHr = 5 * 1000; // 60 * 60 * 1000;
const icon_dir = "./Assets/Weather Icons/";
const cities_dir = "./Assets/Cities/";
const general_dir = "./Assets/General/";
let cities_arr = [];

const city_all_data_url = "http://localhost:3000/all-timezone-cities"; // "https://soliton.glitch.me/all-timezone-cities";
const city_time_url = "http://localhost:3000/time?city="; // "https://soliton.glitch.me?city=";
const city_forecast_url = "http://localhost:3000/hourly-forecast"; // "https://soliton.glitch.me/hourly-forecast";

// Prototype for City
class City {
  constructor({ cityName, dateAndTime, timeZone, temperature, humidity, precipitation }) {
    Object.assign(this, { cityName, dateAndTime, timeZone, temperature, humidity, precipitation });
    this.nextFiveHrs = [];
    this.conti = this.timeZone.split("/")[0];
    this.temp = parseInt(this.temperature);
    this.humid = parseInt(this.humidity);
    this.prcp = parseInt(this.precipitation);
  }
  async forecast() {
    let response_time = await fetch(city_time_url + this.cityName);
    let time = await response_time.json();
    let myHeaders = { "Content-Type": "application/json" };
    let body = { ...time, hours: 5 };
    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(body),
      redirect: "follow",
    };
    let response_forecast = await fetch(city_forecast_url, requestOptions);
    let data_forecast = await response_forecast.json();
    this.nextFiveHrs = data_forecast.temperature;
    return this.nextFiveHrs;
  }
}

city_selector.addEventListener("input", cityChange);
sunny_btn.addEventListener("click", handle_weather);
snowy_btn.addEventListener("click", handle_weather);
rainy_btn.addEventListener("click", handle_weather);
top_count.addEventListener("change", handleTopCount);
conti_sort.addEventListener("click", sort_handler);
temp_sort.addEventListener("click", sort_handler);
conti_sort.order = true;
temp_sort.order = true;

async function refresh_cities() {
  // cities_arr = Object.values(data).map((c) => new City(c));
  let response = await fetch(city_all_data_url);
  let data = await response.json();
  cities_arr = data.map((c) => new City(c));
}

window.onload = () => {
  drawUI((random = true));

  setInterval(() => {
    let sec = new Date().getSeconds();
    time_sec.textContent = `:${sec}`;
    if (sec == 0) {
      updateTime();
      updateCardTime();
    }
  }, 1000);

  setInterval(async () => {
    drawUI();
  }, 4 * oneHr);
};

async function drawUI(random = false) {
  await refresh_cities();
  refresh_city_list();
  if (random) {
    let rnd_idx = Math.floor(cities_arr.length * Math.random());
    city_selector.dispatchEvent(new CustomEvent("input", { detail: { index: rnd_idx } }));
  } else {
    city_selector.dispatchEvent(new Event("input"));
  }
  sunny_btn.dispatchEvent(new Event("click"));
  conti_sort.dispatchEvent(new CustomEvent("click", { detail: { value: true } }));
}

function refresh_city_list() {
  let current_city_idx = city_selector.selectedIndex;
  city_selector.replaceChildren();
  cities_arr.forEach((city) => {
    let opt = document.createElement("option");
    opt.setAttribute("value", city.cityName.toLowerCase());
    opt.textContent = city.cityName;
    city_selector.appendChild(opt);
  });
  city_selector.selectedIndex = current_city_idx;
}

// -------------
function getCurrentDate(city_name) {
  let tz = getTimeZone(city_name);
  let date_opt = {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return new Date().toLocaleString("en-IN", date_opt).split(" ").join("-").toUpperCase();
}
function getCurrentTime(city_name) {
  let tz = getTimeZone(city_name);
  let time_opt = {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
  };
  let [timeString, am] = new Date().toLocaleString("en-IN", time_opt).split(" ");
  return [timeString, am];
}
function getTimeZone(city_name) {
  if (!city_name) {
    city_name = city_selector.value;
  }
  let current_city = cities_arr.filter((c) => c.cityName.toLowerCase() === city_name)[0];
  let tz = current_city.timeZone;
  return tz;
}

function updateTime() {
  let [timeString, am] = getCurrentTime();
  time.textContent = timeString;
  if (am.toLowerCase() == "am") {
    am_pm.setAttribute("src", `./Assets/General/amState.svg`);
    let [hh, mm] = timeString.split(":");
    if (hh == 12 && mm == 0) {
      date.textContent = getCurrentDate();
    }
  } else {
    am_pm.setAttribute("src", `./Assets/General/pmState.svg`);
  }
}
function updateTimeline() {
  let tz = getTimeZone();
  let time_opt = {
    timeZone: tz,
    hour: "numeric",
  };
  let time_values = ["NOW"];
  for (let i = 1; i < 6; i++) {
    time_values.push(new Date(Date.now() + oneHr * i).toLocaleString("en-IN", time_opt));
  }
  for (let i of forecast_time.keys()) {
    forecast_time[i].innerText = time_values[i];
  }
}
function updateDateTime() {
  date.textContent = getCurrentDate();
  updateTime();
  updateTimeline();
}

function cityChange(e) {
  if (e.detail) {
    e.target.selectedIndex = e.detail.index;
    log(`${e.target.selectedIndex} : ${e.target.value}`);
  }

  let city_name = e.target.value;
  // let current_city = cities_arr.filter((c) => c.cityName.toLowerCase() === city_name)[0];
  let current_city = cities_arr[e.target.selectedIndex];
  updateDateTime();

  city_img.setAttribute("src", `./Assets/Cities/${current_city.cityName}.svg`);

  let readings = [
    parseInt(current_city.temperature),
    parseInt(current_city.humidity),
    Math.floor(parseInt(current_city.temperature) * 1.8 + 32),
    parseInt(current_city.precipitation),
  ];
  for (let i of values.keys()) {
    values[i].innerText = readings[i];
  }

  current_city.forecast().then((forecast_values) => {
    forecast_values.unshift(current_city.temperature);
    forecast_values = forecast_values.map((x) => parseInt(x));

    for (let [i, temp] of forecast_values.entries()) {
      forecast_temp[i].innerText = temp;
      if (temp < 18) {
        forecast_img[i].setAttribute("src", icon_dir + "cloudyIcon.svg");
      } else if (18 <= temp && temp <= 22) {
        forecast_img[i].setAttribute("src", icon_dir + "rainyIcon.svg");
      } else if (23 <= temp && temp <= 29) {
        forecast_img[i].setAttribute("src", icon_dir + "windyIcon.svg");
      } else if (temp > 29) {
        forecast_img[i].setAttribute("src", icon_dir + "sunnyIcon.svg");
      }
    }
  });
}

function handle_weather(evt) {
  let btn = evt.currentTarget;
  for (let elt of btn.parentElement.children) {
    elt.classList.remove("selected");
  }
  btn.classList.add("selected");
  let filtered_cities = [];
  switch (btn.getAttribute("id")) {
    case "pref-sunny":
      filtered_cities = filterBySunny();
      break;
    case "pref-snowy":
      filtered_cities = filterBySnowy();
      break;
    case "pref-rainy":
      filtered_cities = filterByRainy();
      break;
  }
  top_cities.replaceChildren();
  filtered_cities = filtered_cities.slice(0, top_count.value);
  filtered_cities.forEach((c) => top_cities.appendChild(constructCard(c)));
  updateCardTime();
}

function filterBySunny() {
  let sunny_cities = cities_arr.filter((c) => c.temp >= 29 && c.humid < 50 && c.prcp >= 50);
  sunny_cities.sort((a, b) => (a.temp > b.temp ? -1 : 0));
  sunny_cities.forEach((c) => {
    c.weatherIcon = "sunnyIcon.svg";
  });
  return sunny_cities;
}
function filterBySnowy() {
  let snowy_cities = cities_arr.filter((c) => c.temp > 20 && c.temp <= 28 && c.humid > 50 && c.prcp < 50);
  snowy_cities.sort((a, b) => (a.prcp > b.prcp ? -1 : 0));
  snowy_cities.forEach((c) => {
    c.weatherIcon = "snowflakeIcon.svg";
  });
  return snowy_cities;
}
function filterByRainy() {
  let rainy_cities = cities_arr.filter((c) => c.temp <= 20 && c.humid >= 50);
  rainy_cities.sort((a, b) => (a.humid > b.humid ? -1 : 0));
  rainy_cities.forEach((c) => {
    c.weatherIcon = "rainyIcon.svg";
  });
  return rainy_cities;
}

function updateCardTime() {
  [...top_cities.children].forEach((card) => {
    let time = card.getElementsByClassName("time")[0];
    let date = card.getElementsByClassName("date")[0];
    let city_name = card.getElementsByClassName("city-name")[0].textContent.toLowerCase();

    time.textContent = getCurrentTime(city_name).join(" ").toUpperCase();
    date.textContent = getCurrentDate(city_name);
  });
}

function constructCard(city_data) {
  const card = document.createElement("div");
  const city_img = document.createElement("div");
  const city_head = document.createElement("div");
  const city_time = document.createElement("p");
  const city_date = document.createElement("p");
  const city_humid = document.createElement("div");
  const city_prcp = document.createElement("div");

  const city_name = document.createElement("h3");
  const city_icon_w = document.createElement("img");
  const city_temp = document.createElement("p");

  const city_icon_h = document.createElement("img");
  const city_pct_h = document.createElement("p");
  const city_icon_p = document.createElement("img");
  const city_pct_p = document.createElement("p");

  city_img.classList.add("bg-city");
  city_img.style.backgroundImage = `url(${cities_dir}${city_data.cityName.toLowerCase()}.svg)`;

  city_head.classList.add("city-head");
  city_name.textContent = city_data.cityName;
  city_name.classList.add("city-name");
  city_icon_w.setAttribute("src", `${icon_dir}${city_data.weatherIcon}`);
  city_icon_w.setAttribute("alt", city_data.weather);
  city_icon_w.classList.add("weather-icon");
  city_temp.classList.add("temp");
  city_temp.textContent = city_data.temperature;

  city_time.textContent = getCurrentTime().join(" ").toUpperCase(); // "10:00 AM"
  city_time.classList.add("time");
  city_date.textContent = getCurrentDate().toUpperCase(); // "02-MAR-2020"
  city_date.classList.add("date");

  city_humid.classList.add("icon-value");
  city_icon_h.setAttribute("src", `${icon_dir}humidityIcon.svg`);
  city_icon_h.setAttribute("alt", "Humidity");
  city_icon_h.classList.add("humidity-icon");
  city_pct_h.classList.add("pct");
  city_pct_h.textContent = city_data.humidity;

  city_prcp.classList.add("icon-value");
  city_icon_p.setAttribute("src", `${icon_dir}precipitationIcon.svg`);
  city_icon_p.setAttribute("alt", "Precipitation");
  city_icon_p.classList.add("precipitation-icon");
  city_pct_p.classList.add("pct");
  city_pct_p.textContent = city_data.precipitation;

  city_head.appendChild(city_name);
  city_head.appendChild(city_icon_w);
  city_head.appendChild(city_temp);

  city_humid.appendChild(city_icon_h);
  city_humid.appendChild(city_pct_h);

  city_prcp.appendChild(city_icon_p);
  city_prcp.appendChild(city_pct_p);

  card.appendChild(city_img);
  card.appendChild(city_head);
  card.appendChild(city_time);
  card.appendChild(city_date);
  card.appendChild(city_humid);
  card.appendChild(city_prcp);

  card.classList.add("card");
  return card;
}

function handleTopCount() {
  let x = top_count.value;
  if (isNaN(x) || x < 3) {
    top_count.value = 3;
  } else if (x > 10) {
    top_count.value = 10;
  }
  document.querySelector(".selected").dispatchEvent(new Event("click"));
}

function addCityToTable(city_data) {
  let city_card = document.createElement("div");
  let card_continent = document.createElement("p");
  let card_temperature = document.createElement("p");
  let card_cityName = document.createElement("p");
  let card_div = document.createElement("div");
  let card_img = document.createElement("img");
  let card_pct = document.createElement("p");

  city_card.classList.add("city-card");
  card_continent.classList.add("continent");
  card_temperature.classList.add("temp");
  card_cityName.classList.add("city");
  card_div.classList.add("icon-value");
  card_img.classList.add("humidity-icon");
  card_pct.classList.add("pct");

  card_continent.append(city_data.timeZone.split("/")[0]);
  card_temperature.append(city_data.temperature);
  card_cityName.append(city_data.cityName);
  card_img.setAttribute("src", icon_dir + "humidityIcon.svg");
  card_img.setAttribute("alt", "humidity icon");
  card_pct.append(city_data.humidity);

  card_div.appendChild(card_img);
  card_div.appendChild(card_pct);
  [card_continent, card_temperature, card_cityName, card_div].forEach((elt) => {
    city_card.appendChild(elt);
  });

  city_card.setAttribute("id", city_data.cityName);
  cities_table.appendChild(city_card);
}

function sort_order(c_a = 1, t_a = 1) {
  let mySort = function (a, b) {
    if (a.conti < b.conti) {
      return -1 * c_a;
    } else if (a.conti === b.conti) {
      if (a.temp < b.temp) {
        return -1 * t_a;
      } else {
        return 1 * t_a;
      }
    } else {
      return 1 * c_a;
    }
  };
  return mySort;
}

function sort_handler(evt) {
  let tgt = evt.currentTarget;
  if (evt.detail.value) {
    tgt.order = evt.detail.value;
  } else {
    tgt.order = !evt.currentTarget.order;
  }
  tgt.setAttribute("src", `${general_dir}${tgt.order ? "arrowUp" : "arrowDown"}.svg`);
  updateTable();
}

function updateTable() {
  let c_a = conti_sort.order ? 1 : -1;
  let t_a = temp_sort.order ? 1 : -1;
  let cities_copy = [...cities_arr];
  cities_copy.sort(sort_order(c_a, t_a));
  cities_table.replaceChildren();
  // while (cities_table.firstElementChild) {
  //   cities_table.removeChild(cities_table.lastElementChild);
  // }
  cities_copy.forEach((c) => addCityToTable(c));
}

// ----------  TOP SECTION  ----------
// ----------  TOP SECTION-END  ----------

// ----------  MIDDLE SECTION  ----------
// ----------  MIDDLE SECTION-END  ----------

// ----------  BOTTOM SECTION  ----------
// ----------  BOTTOM SECTION-END  ----------
