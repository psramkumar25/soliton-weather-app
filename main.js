import express from "express";
import Joi from "joi";
import fetch from "node-fetch";

const PORT = process.env.PORT || 3000;
const HOST = "127.0.0.1";

const city_all_data_url = "https://soliton.glitch.me/all-timezone-cities";
const city_time_url = "https://soliton.glitch.me?city=";
const city_forecast_url = "https://soliton.glitch.me/hourly-forecast";

const app = express();
app.use(express.json());
app.use("/", express.static("./"));

app.listen(PORT, HOST, () => console.log(`Express server listening on ${HOST}:${PORT}`));

app.get("/all-timezone-cities", async (req, res) => {
  // res.writeHead(200, { "Content-Type": "application/json" });
  // res.write(JSON.stringify(data));
  let response = await fetch(city_all_data_url);
  let data = await response.json();
  res.status(200).json(data);
  res.end();
});

app.post("/hourly-forecast", async (req, res) => {
  let result = validate_forecast(req.body);
  if (!result.error) {
    // res.writeHead(200, { "Content-Type": "application/json" });
    // res.send(JSON.stringify(forecast(result.value)));
    let myHeaders = { "Content-Type": "application/json" };
    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(req.body),
      redirect: "follow",
    };
    let response_forecast = await fetch(city_forecast_url, requestOptions);
    let data_forecast = await response_forecast.json();
    res.status(200).json(data_forecast);
    res.end();
  } else {
    res.status(400).json({ error: "Invalid Request !" });
    res.end();
  }
});

app.get("/time", async (req, res) => {
  let result = validate_city(req.query);
  // console.table(req.query);
  if (!result.error) {
    // res.writeHead(200, { "Content-Type": "application/json" });
    // res.send(JSON.stringify(get_time(result.value)));
    let response_time = await fetch(city_time_url + result.value.city);
    let time = await response_time.json();
    res.status(200).json(time);
    res.end();
  } else {
    res.status(400).json({ error: "Invalid Request !" });
    res.end();
  }
});

function validate_city(params) {
  const schema = Joi.object({
    city: Joi.string().required(),
    // .valid(...Object.keys(data).map((c) => c.toLowerCase())),
  });
  let result = schema.validate(params);
  // console.table(params);
  // console.table(result);
  return result;
}

function validate_forecast(body) {
  const schema = Joi.object({
    city_Date_Time_Name: Joi.string().required(),
    hours: Joi.number().required(),
  });
  let result = schema.validate(body);
  // console.table(params);
  // console.table(result);
  return result;
}
