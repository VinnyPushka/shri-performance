function quantile(arr, q) {
    const sorted = arr.sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sorted[base + 1] !== undefined) {
        return Math.floor(
            sorted[base] + rest * (sorted[base + 1] - sorted[base])
        );
    } else {
        return Math.floor(sorted[base]);
    }
}

function prepareData(result) {
    return result.data.map((item) => {
        item.date = item.timestamp.split("T")[0];

        return item;
    });
}

// TODO: реализовать
// показать значение метрики за несколько дней
function showMetricByPeriod(data, page, name, startDate, endDate, device) {
    let start = new Date(startDate),
        end = new Date(endDate);

    let sampleData = data.filter((item) => {
        let date = new Date(item.date);
        return (
            item.page == page &&
            item.name == name &&
            date >= start &&
            date <= end
        );
    });

    if (device)
        sampleData = sampleData.filter(
            (item) => item["additional"]["device"] == device
        );
    sampleData = sampleData.map((item) => item.value);

    let result = {};

    result.hits = sampleData.length;
    result.p25 = quantile(sampleData, 0.25);
    result.p50 = quantile(sampleData, 0.5);
    result.p75 = quantile(sampleData, 0.75);
    result.p95 = quantile(sampleData, 0.95);

    return result;
}

function calcMetricsByPeriod(data, page, startDate, endDate) {
    console.log(
        `%cAll metrics from ${startDate} to ${endDate}:`,
        "color:red;font-weight:bold;font-size: 16px"
    );

    let table = {};
    table.connect = showMetricByPeriod(
        data,
        page,
        "connect",
        startDate,
        endDate
    );
    table.ttfb = showMetricByPeriod(data, page, "ttfb", startDate, endDate);
    table.load = showMetricByPeriod(data, page, "load", startDate, endDate);
    table.square = showMetricByPeriod(data, page, "square", startDate, endDate);
    table.load = showMetricByPeriod(data, page, "load", startDate, endDate);
    table.generate = showMetricByPeriod(
        data,
        page,
        "generate",
        startDate,
        endDate
    );
    table.draw = showMetricByPeriod(data, page, "draw", startDate, endDate);

    console.table(table);
    console.log("\t");
}

// показать сессию пользователя
function showSession(data, id, name, date) {
    let sampleData = data
        .filter(
            (item) =>
                item.requestId == id && item.name == name && item.date == date
        )
        .map((item) => item.value);

    let result = {};

    result.hits = sampleData.length;
    result.p25 = quantile(sampleData, 0.25);
    result.p50 = quantile(sampleData, 0.5);
    result.p75 = quantile(sampleData, 0.75);
    result.p95 = quantile(sampleData, 0.95);

    return result;
}

function getSessionPlatform(data, id, date) {
    return data.filter((item) => item.requestId == id && item.date == date)[0][
        "additional"
    ]["platform"];
}

function calcSession(data, id, date) {
    console.log(
        `%cMetrics of ${id} session for ${date}:`,
        "color:red;font-weight:bold;font-size: 16px"
    );
    let platform = getSessionPlatform(data, id, date);
    let table = {};
    table.connect = showSession(data, id, "connect", date);
    table.ttfb = showSession(data, id, "ttfb", date);
    table.load = showSession(data, id, "load", date);
    table.square = showSession(data, id, "square", date);
    table.load = showSession(data, id, "load", date);
    table.generate = showSession(data, id, "generate", date);
    table.draw = showSession(data, id, "draw", date);

    console.info(
        `%cPlatform - ${platform}`,
        "color:Black;font-weight:bold;font-size: 15px"
    );
    console.table(table);

    console.log("\t");
}

// сравнить метрику в разных срезах
function compareMetrics(data, page, startDate, endDate) {
    console.log(
        `%cDevices metrics from ${startDate} to ${endDate}:`,
        "color:red;font-weight:bold;font-size: 16px"
    );

    let table = getMetric(data, page, startDate, endDate, "table");
    let mobile = getMetric(data, page, startDate, endDate, "touch");
    let compareDevices = compare(table, mobile);

    function compare(obj1, obj2) {
        let res = {};
        for (let i in obj1) {
            res[i] = {};
            for (let j in obj1[i]) {
                res[i][j] = +(
                    ((obj1[i][j] - obj2[i][j]) / obj1[i][j]) *
                    100
                ).toFixed(1);
                if (Number.isNaN(res[i][j])) res[i][j] = "-";
            }
        }
        return res;
    }

    function getMetric(data, page, startDate, endDate, device) {
        let res = {};
        res.connect = showMetricByPeriod(
            data,
            page,
            "connect",
            startDate,
            endDate,
            device
        );
        res.ttfb = showMetricByPeriod(
            data,
            page,
            "ttfb",
            startDate,
            endDate,
            device
        );
        res.load = showMetricByPeriod(
            data,
            page,
            "load",
            startDate,
            endDate,
            device
        );
        res.square = showMetricByPeriod(
            data,
            page,
            "square",
            startDate,
            endDate,
            device
        );
        res.load = showMetricByPeriod(
            data,
            page,
            "load",
            startDate,
            endDate,
            device
        );
        res.generate = showMetricByPeriod(
            data,
            page,
            "generate",
            startDate,
            endDate,
            device
        );
        res.draw = showMetricByPeriod(
            data,
            page,
            "draw",
            startDate,
            endDate,
            device
        );
        return res;
    }

    console.group(
        "%cTable devices:",
        "color:green;font-weight:bold;font-size: 14px"
    );
    console.table(table);
    console.groupEnd();
    console.group(
        "%cMobile devices:",
        "color:green;font-weight:bold;font-size: 14px"
    );
    console.table(mobile);
    console.groupEnd();
    console.group(
        "%cCompare (%):",
        "color:green;font-weight:bold;font-size: 14px"
    );
    console.table(compareDevices);
    console.groupEnd();
    console.log("\t");
}

// Пример
// добавить метрику за выбранный день
function addMetricByDate(data, page, name, date) {
    let sampleData = data
        .filter(
            (item) =>
                item.page == page && item.name == name && item.date == date
        )
        .map((item) => item.value);

    let result = {};

    result.hits = sampleData.length;
    result.p25 = quantile(sampleData, 0.25);
    result.p50 = quantile(sampleData, 0.5);
    result.p75 = quantile(sampleData, 0.75);
    result.p95 = quantile(sampleData, 0.95);

    return result;
}
// рассчитывает все метрики за день
function calcMetricsByDate(data, page, date) {
    console.log(
        `%cAll metrics for ${date}:`,
        "color:red;font-weight:bold;font-size: 16px"
    );

    let table = {};
    table.connect = addMetricByDate(data, page, "connect", date);
    table.ttfb = addMetricByDate(data, page, "ttfb", date);
    table.load = addMetricByDate(data, page, "load", date);
    table.square = addMetricByDate(data, page, "square", date);
    table.load = addMetricByDate(data, page, "load", date);
    table.generate = addMetricByDate(data, page, "generate", date);
    table.draw = addMetricByDate(data, page, "draw", date);

    console.table(table);
    console.log("\t");
}

fetch(
    "https://shri.yandex/hw/stat/data?counterId=2096D283-F9BD-42CE-B2A9-9C428D040C1F"
)
    .then((res) => res.json())
    .then((result) => {
        let data = prepareData(result);

        calcMetricsByDate(data, "send test", "2021-10-26");
        calcMetricsByPeriod(data, "send test", "2021-10-23", "2021-10-28");
        compareMetrics(data, "send test", "2021-10-23", "2021-10-28");
        calcSession(data, "006018005881", "2021-10-26");
    });
