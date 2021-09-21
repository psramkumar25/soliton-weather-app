// import data from "./data.js";
// import * as handles from "./handle-selector.js";

const log = console.log;
const oneHr = 60 * 60 * 1000;
const icon_dir = "./Assets/Weather Icons/";
const cities_dir = "./Assets/Cities/";
const general_dir = "./Assets/General/";

const city_info = document.getElementById("city-info");
const city_selector = document.getElementById("city-selector");
const city_img = document.getElementById("city-img");
const date = document.getElementById("date");
const time = document.getElementById("hh-mm");
const am_pm = document.getElementById("am-pm");
const time_sec = document.getElementById("sec");
const values = document.querySelectorAll("#readings #value");
const forecast_temp = document.querySelectorAll("#prediction-container p.temperature");
const forecast_time = document.querySelectorAll("#prediction-container p.time");
const forecast_img = document.querySelectorAll("#prediction-container img");
const sunny_btn = document.querySelector("button#pref-sunny");
const snowy_btn = document.querySelector("button#pref-snowy");
const rainy_btn = document.querySelector("button#pref-rainy");
const top_count = document.getElementById("top-count");
const top_cities = document.getElementById("top-cities");
const cities_table = document.getElementById("cities-table");
const conti_sort = document.getElementById("conti-sort");
const temp_sort = document.getElementById("temp-sort");

let cities_arr = Object.values(data);
cities_arr.forEach((c) => {
  c.conti = c.timeZone.split("/")[0];
  c.temp = parseInt(c.temperature);
  c.humid = parseInt(c.humidity);
  c.prcp = parseInt(c.precipitation);
});

const cities_list = Object.keys(data);

// ----------  TOP SECTION  ----------

window.onload = () => {
  // city_selector.selectedIndex = 0;
  let rnd_idx = Math.floor(Object.keys(data).length * Math.random());
  city_selector.dispatchEvent(new CustomEvent("input", { detail: { index: rnd_idx } }));
};

for (let city of cities_list) {
  let opt = document.createElement("option");
  opt.setAttribute("value", city);
  opt.textContent = data[city].cityName;
  city_selector.appendChild(opt);
}

setInterval(() => {
  let sec = new Date().getSeconds();
  time_sec.textContent = `:${sec}`;
  if (sec == 0) {
    updateTime();
    updateCardTime();
  }
}, 1000);

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
  let tz = data[city_name].timeZone;
  return tz;
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
  updateDateTime();

  city_img.setAttribute("src", `./Assets/Cities/${city_name}.svg`);

  let readings = [
    parseInt(data[city_name].temperature),
    parseInt(data[city_name].humidity),
    Math.floor(parseInt(data[city_name].temperature) * 1.8 + 32),
    parseInt(data[city_name].precipitation),
  ];
  for (let i of values.keys()) {
    values[i].innerText = readings[i];
  }

  let forecast_values = data[city_name].nextFiveHrs;
  forecast_values.unshift(data[city_name].temperature);
  // adding the current temp twice because incoming data only has 4 values
  // but 5 values is expected.
  forecast_values.unshift(data[city_name].temperature);
  forecast_values = forecast_values.map((x) => parseInt(x));

  for (let i of forecast_temp.keys()) {
    forecast_temp[i].innerText = forecast_values[i];
    if (forecast_values[i] < 18) {
      forecast_img[i].setAttribute("src", icon_dir + "cloudyIcon.svg");
    } else if (18 <= forecast_values[i] && forecast_values[i] <= 22) {
      forecast_img[i].setAttribute("src", icon_dir + "rainyIcon.svg");
    } else if (23 <= forecast_values[i] && forecast_values[i] <= 29) {
      forecast_img[i].setAttribute("src", icon_dir + "windyIcon.svg");
    } else if (forecast_values[i] > 29) {
      forecast_img[i].setAttribute("src", icon_dir + "sunnyIcon.svg");
    }
  }
}

city_selector.addEventListener("input", cityChange);

// ----------  TOP SECTION-END  ----------

// ----------  MIDDLE SECTION  ----------

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
sunny_btn.addEventListener("click", handle_weather);
snowy_btn.addEventListener("click", handle_weather);
rainy_btn.addEventListener("click", handle_weather);
sunny_btn.dispatchEvent(new Event("click"));

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

top_count.addEventListener("change", handleTopCount);

// ----------  MIDDLE SECTION-END  ----------

// ----------  BOTTOM SECTION  ----------

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

conti_sort.addEventListener("click", sort_handler);
temp_sort.addEventListener("click", sort_handler);

conti_sort.order = false;
temp_sort.order = true;
conti_sort.dispatchEvent(new Event("click"));

function sort_handler(evt) {
  let tgt = evt.currentTarget;
  let order = (tgt.order = !evt.currentTarget.order);
  tgt.setAttribute("src", `${general_dir}${order ? "arrowUp" : "arrowDown"}.svg`);
  updateTable();
}

function updateTable() {
  let c_a = conti_sort.order ? 1 : -1;
  let t_a = temp_sort.order ? 1 : -1;
  cities_arr.sort(sort_order(c_a, t_a));
  cities_table.replaceChildren();
  // while (cities_table.firstElementChild) {
  //   cities_table.removeChild(cities_table.lastElementChild);
  // }
  cities_arr.forEach((c) => addCityToTable(c));
}

// ----------  BOTTOM SECTION-END  ----------
