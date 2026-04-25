const STORAGE_KEY = "factoringSubmissions";

const intakeForm = document.getElementById("intake-form");
const formStatus = document.getElementById("form-status");
const submissionsTable = document.getElementById("submissions-table");
const metricsContainer = document.getElementById("metrics");
const metricTemplate = document.getElementById("metric-template");
const clearDataButton = document.getElementById("clear-data");
const seedDemoButton = document.getElementById("seed-demo");

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const readSubmissions = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeSubmissions = (submissions) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
};

const renderMetrics = (submissions) => {
  const total = submissions.reduce((sum, row) => sum + Number(row.invoiceAmount), 0);
  const avg = submissions.length ? total / submissions.length : 0;

  const dueSoonCount = submissions.filter((row) => {
    const due = new Date(row.dueDate);
    const now = new Date();
    const daysUntilDue = (due - now) / (1000 * 60 * 60 * 24);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  }).length;

  const metrics = [
    { label: "Total Submissions", value: String(submissions.length) },
    { label: "Total Invoice Amount", value: currency.format(total) },
    { label: "Average Invoice", value: currency.format(avg) },
    { label: "Due in 7 Days", value: String(dueSoonCount) },
  ];

  metricsContainer.innerHTML = "";

  metrics.forEach((metric) => {
    const metricNode = metricTemplate.content.cloneNode(true);
    metricNode.querySelector(".metric-label").textContent = metric.label;
    metricNode.querySelector(".metric-value").textContent = metric.value;
    metricsContainer.append(metricNode);
  });
};

const renderTable = (submissions) => {
  submissionsTable.innerHTML = "";

  if (!submissions.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.className = "empty-state";
    cell.textContent = "No submissions yet.";
    row.append(cell);
    submissionsTable.append(row);
    return;
  }

  submissions
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .forEach((submission) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(submission.submittedAt).toLocaleString()}</td>
        <td>${submission.companyName} <br /><small>MC: ${submission.mcNumber}</small></td>
        <td>${submission.invoiceNumber}</td>
        <td>${currency.format(Number(submission.invoiceAmount))}</td>
        <td>${submission.debtorName}</td>
        <td>${submission.dueDate}</td>
        <td>${submission.contactName}<br /><small>${submission.contactEmail}</small></td>
        <td>${submission.notes || "-"}</td>
      `;
      submissionsTable.append(row);
    });
};

const refreshDashboard = () => {
  const submissions = readSubmissions();
  renderMetrics(submissions);
  renderTable(submissions);
};

intakeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(intakeForm);
  const payload = {
    companyName: data.get("companyName").trim(),
    mcNumber: data.get("mcNumber").trim(),
    contactName: data.get("contactName").trim(),
    contactEmail: data.get("contactEmail").trim(),
    invoiceNumber: data.get("invoiceNumber").trim(),
    invoiceAmount: Number(data.get("invoiceAmount")),
    debtorName: data.get("debtorName").trim(),
    dueDate: data.get("dueDate"),
    notes: data.get("notes").trim(),
    submittedAt: new Date().toISOString(),
  };

  const submissions = readSubmissions();
  submissions.push(payload);
  writeSubmissions(submissions);
  intakeForm.reset();

  formStatus.textContent = `Invoice ${payload.invoiceNumber} submitted successfully.`;
  refreshDashboard();
});

seedDemoButton.addEventListener("click", () => {
  const now = new Date();
  const demoRows = [
    {
      companyName: "Atlas River Logistics",
      mcNumber: "MC-847511",
      contactName: "Maria Holt",
      contactEmail: "maria@atlasriver.com",
      invoiceNumber: "ARL-22051",
      invoiceAmount: 4850,
      debtorName: "Westline Brokerage",
      dueDate: new Date(now.getTime() + 5 * 86400000).toISOString().slice(0, 10),
      notes: "Reefer load Dallas to Denver",
      submittedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      companyName: "Blue Oak Carriers",
      mcNumber: "MC-224190",
      contactName: "Terrance Lee",
      contactEmail: "tleeboc@example.com",
      invoiceNumber: "BOC-99134",
      invoiceAmount: 7125.5,
      debtorName: "Pinnacle Shippers",
      dueDate: new Date(now.getTime() + 12 * 86400000).toISOString().slice(0, 10),
      notes: "Dry van dedicated lane",
      submittedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
  ];

  writeSubmissions(demoRows);
  formStatus.textContent = "Demo records loaded.";
  refreshDashboard();
});

clearDataButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  formStatus.textContent = "All submissions cleared.";
  refreshDashboard();
});

refreshDashboard();
