// import { socket } from "./auth.js";
import {
  addItemRow,
  resetForm,
  showPaymentTermsMenu,
  updatePaymentTerms,
  saveInvoice,
  themeUpdate,
  perferredColorScheme,
  URL,
  logout,
  refreshAccessToken,
} from "./functions.js";

const accessToken = localStorage.getItem("accessToken");

const themeInputs = document.querySelectorAll('label:has(input[name="theme"])');
const invoices = document.querySelector(".invoices");
const newInvoiceDialog = document.getElementById("new-invoice-dialog");
const invoiceTotal = document.querySelector("[data-invoice-total]");

const main = document.querySelector("main");
const header = document.querySelector("header");
const currencyOptions = { style: "currency", currency: "GBP" };
const dateOptions = { day: "numeric", month: "short", year: "numeric" };
const filterOptions = new Set();

window.addEventListener("DOMContentLoaded", async (e) => {
  let response;
  response = await fetch(`${URL}/getInvoices`, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Access-Control-Allow-Origin": true,
    },
    cache: "reload",
    credentials: "include",
  });
  // console.log(response.status);
  if (response.status === 403) {
    // console.log("here");
    const newAccessToken = await refreshAccessToken();
    localStorage.setItem("accessToken", newAccessToken);
    response = await fetch(`${URL}/getInvoices`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${newAccessToken}`,
        "Access-Control-Allow-Origin": true,
      },
      cache: "reload",
      credentials: "include",
    });
  }
  const { invoices } = await response.json();
  createInvoices(invoices);
  invoiceTotal.textContent = invoices.length;
});

if (!(perferredColorScheme in localStorage)) {
  localStorage.setItem(
    perferredColorScheme,
    window.matchMedia("(prefers-color-scheme: dark)").matches ? true : ""
  );
}
for (const themeInput of themeInputs) {
  const input = themeInput.querySelector("input");
  input.checked = localStorage.getItem(perferredColorScheme);
}

function createInvoices(data) {
  for (const invoice of data) {
    const { id, paymentDue, clientName, total, status } = invoice;
    invoices.insertAdjacentHTML(
      "beforeend",
      `<a href="./invoice.html?invoice-id=${id}" tabindex="0" data-status="${status}" data-invoice>
          <div class="invoice league-spartan-bold">
            <div class="invoice-id">
              <span>#</span>
              ${id}
            </div>
            <div class="invoice-user league-spartan-medium">${clientName}</div>
            <div class="due-date league-spartan-medium" >Due ${new Date(
              paymentDue
            ).toLocaleDateString("en-AU", { dateStyle: "medium" })}</div>

            <div class="amount" data-total="${total}">${parseFloat(
        total
      ).toLocaleString("en", currencyOptions)}</div>
            <div class="status-cont">
              <div class="status-token" data-status="${status}">
                <div class="status"></div>
                ${status}
              </div>
              <img
                class="hide-mobile"
                src="./assets/icon-arrow-right.svg"
                alt="right arrow" />
            </div>
          </div>
        </a>`
    );
  }
}

function searchInvoices() {
  for (const invoice of invoices.children) {
    // console.log(invoice);
    invoice.classList.toggle(
      "hide",
      !filterOptions.has(invoice.dataset.status) && filterOptions.size != 0
    );
  }
}
async function saveInvoiceToDB(invoice) {
  let response;
  try {
    response = await fetch(`${URL}/saveInvoice`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Access-Control-Allow-Origin": true,
      },
      body: JSON.stringify(invoice),
      credentials: "include",
    });
    if (response.status === 403) {
      //  console.log("here");
      const newAccessToken = await refreshAccessToken();
      localStorage.setItem("accessToken", newAccessToken);
      saveInvoiceToDB(invoice);
      //  response = await fetch(`${URL}/getInvoices`, {
      //    method: "GET",
      //    headers: {
      //      "Content-type": "application/json",
      //      Authorization: `Bearer ${newAccessToken}`,
      //      "Access-Control-Allow-Origin": true,
      //    },
      //    cache: "reload",
      //    credentials: "include",
      //  });
    }
  } catch (error) {
    console.error(error);
  }
}

function formatDueDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-AU", { dateStyle: "medium" });
}
function formatCurrency(totalStr) {
  return parseFloat(totalStr).toLocaleString("en", currencyOptions);
}
function addInvoice(invoice) {
  invoices.insertAdjacentHTML(
    "beforeend",
    `<a href="./invoice.html?invoice-id=${
      invoice.id
    }" tabindex="0" data-invoice>
          <div class="invoice league-spartan-bold">
            <div class="invoice-id">
              <span>#</span>
              ${invoice.id}
            </div>
            <div class="invoice-user league-spartan-medium">${
              invoice.clientName
            }</div>
            <div class="due-date league-spartan-medium">Due ${formatDueDate(
              invoice.paymentDue
            )}</div>

            <div class="amount">${formatCurrency(invoice.total)}</div>
            <div class="status-cont">
              <div class="status-token" data-status="${invoice.status}">
                <div class="status"></div>
               ${invoice.status}
              </div>
              <img
                class="hide-mobile"
                src="./assets/icon-arrow-right.svg"
                alt="right arrow" />
            </div>
          </div>
        </a>`
  );
  invoiceTotal.textContent = parseInt(invoiceTotal.textContent) + 1;
}

header.addEventListener("click", (e) => {
  e.preventDefault();
  const themeBtn = e.target.closest("[data-theme]");
  if (themeBtn) {
    themeUpdate(e, themeInputs);
  }
});

main.addEventListener("click", (e) => {
  e.preventDefault();
  const statusFilterOption = e.target.closest("[data-filter-option]");
  const filterDropdown = e.target.closest("[data-filter-dropdown]");
  const dialog = e.target.closest("[data-show-dialog]");
  const invoiceEle = e.target.closest("[data-invoice]");
  const themeBtn = e.target.closest("[data-theme]");

  if (statusFilterOption) {
    const input = statusFilterOption.querySelector('[type="checkbox"]');
    input.checked = !input.checked;
    if (input.checked) {
      filterOptions.add(statusFilterOption.dataset.filterOption);
    } else {
      filterOptions.delete(statusFilterOption.dataset.filterOption);
    }
    searchInvoices();
  } else if (filterDropdown) {
    const input = filterDropdown.querySelector('[name="filter"]');
    input.checked = !input.checked;
  } else if (dialog) {
    newInvoiceDialog.showModal();
  } else if (invoiceEle) {
    location.href = invoiceEle.getAttribute("href");
  }
});

newInvoiceDialog.addEventListener("click", async (e) => {
  e.preventDefault();
  const cancelBtn = e.target.closest("[data-cancel]");
  const saveBtn = e.target.closest("[data-save]");
  const addItemBtn = e.target.closest("[data-add-item]");
  const paymentTermsBtn = e.target.closest("[data-payment-terms-option]");
  const paymentTermInput = e.target.closest("[data-payment-terms-input]");
  const deleteItemBtn = e.target.closest("[data-delete-item]");
  const draftBtn = e.target.closest("[data-draft]");
  const goBackBtn = e.target.closest("[data-go-back]");
  const themeBtn = e.target.closest("[data-theme]");

  if (cancelBtn) {
    resetForm(newInvoiceDialog);
    // await logout();
    // location.href = "/frontend/login.html";
  } else if (goBackBtn) {
    resetForm(newInvoiceDialog);
  } else if (saveBtn) {
    const invoiceForm = newInvoiceDialog.querySelector("#invoice-form");
    if (invoiceForm.checkValidity()) {
      const pendingInvoice = saveInvoice(newInvoiceDialog, "pending");
      saveInvoiceToDB(pendingInvoice);
      addInvoice(pendingInvoice);
    } else {
      invoiceForm.reportValidity();
      invoiceForm.requestSubmit(saveBtn);
    }
  } else if (addItemBtn) {
    addItemRow(addItemBtn);
  } else if (paymentTermsBtn) {
    updatePaymentTerms(paymentTermsBtn);
  } else if (paymentTermInput) {
    showPaymentTermsMenu(paymentTermInput);
  } else if (deleteItemBtn) {
    deleteItemBtn.parentElement.remove();
  } else if (draftBtn) {
    const draftInvoice = saveInvoice(newInvoiceDialog, "draft");
    await saveInvoiceToDB(draftInvoice);

    addInvoice(draftInvoice);
  } else if (themeBtn) {
    themeUpdate(e, themeInputs);
  }
});
