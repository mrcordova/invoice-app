const data = await (await fetch("data.json")).json();
const deleteDialog = document.querySelector("#delete-dialog");
const editDialog = document.querySelector("#edit-invoice-dialog");
const body = document.querySelector("body");
const statusBarEle = document.querySelector("[data-status-bar]");
const invoiceEle = document.querySelector("[data-invoice]");
const invoiceItemsTable = document.querySelector(".invoice-table-cont");
const amountDue = document.querySelector("[data-amount-due]");
const themeInput = document.querySelector("#theme");
const perferredColorScheme = "perferredColorScheme";
const currencyOptions = { style: "currency", currency: "GBP" };
// const dateOptions = { day: "numeric", month: "short", year: "numeric" };
if (!(perferredColorScheme in localStorage)) {
  localStorage.setItem(
    perferredColorScheme,
    window.matchMedia("(prefers-color-scheme: dark)").matches ? true : ""
  );
}
themeInput.checked = localStorage.getItem(perferredColorScheme);
let params = new URLSearchParams(document.location.search);
const invoiceId = params.get("invoice-id");
// console.log(invoiceId);
let invoice = data.find((invoiceObj) => invoiceObj.id === invoiceId);
console.log(invoice);
statusBarEle.insertAdjacentHTML(
  "afterbegin",
  `<div class="status-cont">
          <p class="league-spartan-medium">Status</p>
          <div class="status-token" data-status="${invoice.status}">
            <div class="status"></div>
            ${invoice.status}
          </div>
        </div>`
);
invoiceEle.insertAdjacentHTML(
  "afterbegin",
  `<div class="invoice-info league-spartan-medium">
          <div class="invoice-title">
            <div class="invoice-id league-spartan-bold">
              <span>#</span>
              ${invoice.id}
            </div>
            <p>${invoice.description}</p>
          </div>
          <address class="user-addy">
            <p>${invoice.senderAddress.street}</p>
            <p>${invoice.senderAddress.city}</p>
            <p>${invoice.senderAddress.postCode}</p>
            <p>${invoice.senderAddress.country}m</p>
          </address>
          <div class="invoice-date">
            Invoice Date
            <p class="league-spartan-bold">${new Date(
              `${invoice.createdAt}T00:00:00`
            ).toLocaleDateString("en-AU", { dateStyle: "medium" })}</p>
          </div>
          <div class="payment-due">
            Payment Due
            <p class="league-spartan-bold">${new Date(
              `${invoice.paymentDue}T00:00:00`
            ).toLocaleDateString("en-AU", { dateStyle: "medium" })}</p>
          </div>
          <div class="bill-to">
            Bill to
            <p class="league-spartan-bold">${invoice.clientName}</p>
            <address>
              <p>${invoice.clientAddress.street}</p>
              <p>${invoice.clientAddress.city}</p>
              <p>${invoice.clientAddress.postCode}</p>
              <p>${invoice.clientAddress.country}</p>
            </address>
          </div>
          <div class="email">
            Sent to
            <p class="league-spartan-bold">${invoice.clientEmail}</p>
          </div>
        </div>`
);
// console.log(invoiceItemsTable);
for (const item of invoice.items) {
  invoiceItemsTable.insertAdjacentHTML(
    "beforeend",
    ` <div class="invoice-item">
        <span class="name" aria-describedby="name">${item.name}</span>
        <span class="qty">
        ${item.quantity}
        <span>x</span>
        </span>
        <span class="price">${item.price.toLocaleString(
          "en",
          currencyOptions
        )}</span>
        <span class="total">${item.total.toLocaleString(
          "en",
          currencyOptions
        )}</span>
        </div>`
  );
}
// amountDue.insertAdjacentHTML('')
amountDue.textContent = invoice.total.toLocaleString("en", currencyOptions);
body.addEventListener("click", (e) => {
  //   e.preventDefault();
  const deleteDialogTarget = e.target.closest("[data-show-delete-dialog]");
  const editDialogTarget = e.target.closest("[data-show-edit-dialog]");

  if (deleteDialogTarget) {
    deleteDialog.showModal();
  } else if (editDialogTarget) {
    editDialog.showModal();
  }
});
