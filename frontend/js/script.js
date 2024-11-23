const data = await (await fetch("data.json")).json();

console.log(data);
const themeInput = document.querySelector("#theme");
const perferredColorScheme = "perferredColorScheme";
if (!(perferredColorScheme in localStorage)) {
  localStorage.setItem(
    perferredColorScheme,
    window.matchMedia("(prefers-color-scheme: dark)").matches ? true : ""
  );
}
themeInput.checked = localStorage.getItem(perferredColorScheme);

const invoices = document.querySelector(".invoices");
const newInvoiceDialog = document.getElementById("new-invoice-dialog");
const invoiceTotal = document.querySelector("[data-invoice-total]");
invoiceTotal.textContent = data.length4;
// const newInvoiceBtn = document.querySelector(".new-invoice-btn");
const main = document.querySelector("main");
const header = document.querySelector("header");
const currencyOptions = { style: "currency", currency: "GBP" };
const dateOptions = { day: "numeric", month: "short", year: "numeric" };
const filterOptions = new Set();
function createInvoices() {
  for (const invoice of data) {
    // console.log(invoice);
    const { id, paymentDue, clientName, total, status } = invoice;
    invoices.insertAdjacentHTML(
      "beforeend",
      `<a href="./invoice.html?invoicd-id=${id}" tabindex="0" data-status="${status}" data-invoice>
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
function generateCustomId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetters =
    letters.charAt(Math.floor(Math.random() * letters.length)) +
    letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNumbers = Math.floor(1000 + Math.random() * 9000).toString();
  return `${randomLetters}${randomNumbers}`;
}
function updateTotalWithQty(e) {
  //   console.log(e.target.value);
  const invoiceItem = e.target.closest("div.invoice-item");
  const total = invoiceItem.querySelector(".total  input");
  const price = invoiceItem.querySelector(".price  input");
  total.value = (e.target.value * price.value).toFixed(2);
}
function updateTotalWithPrice(e) {
  const invoiceItem = e.target.closest("div.invoice-item");
  const total = invoiceItem.querySelector(".total > input");
  const qty = invoiceItem.querySelector(".qty > input");
  total.value = (e.target.value * qty.value).toFixed(2);
}
function resetForm(invoiceDialog) {
  invoiceDialog.close();
  const invoiceForm = invoiceDialog.querySelector("#invoice-form");
  const formInputs = invoiceDialog.querySelectorAll(
    "form label > input:not([id^='net'])"
  );
  const items = invoiceDialog.querySelectorAll(
    ".invoice-items > .invoice-item"
  );
  const netLabel = invoiceDialog.querySelector("[data-payment-terms-input]");
  netLabel.setAttribute("data-payment-terms-value", 30);
  const netMenuInput = netLabel.querySelector("#terms");
  const NetText = netMenuInput.parentElement.querySelector("span");
  netMenuInput.checked = false;
  NetText.textContent = "Net 30 days";

  for (const item of items) {
    item.remove();
  }
  for (const formInput of formInputs) {
    formInput.value = "";
  }
  invoiceForm.reset();
}
// newInvoiceBtn.addEventListener("click", (e) => {
//   newInvoiceDialog.showModal();
// });

function saveInvoice(status) {
  const invoiceItems = newInvoiceDialog.querySelectorAll(
    ".invoice-items > .invoice-item"
  );
  const invoiceItemsArry = [];
  let total = 0;

  // console.log(invoiceItems);
  for (const invoiceItem of invoiceItems) {
    const invoiceTotal = parseFloat(
      invoiceItem.querySelector(".total > input").value
    );
    invoiceItemsArry.push({
      name: invoiceItem.querySelector(".name > input").value,
      quantity: parseInt(invoiceItem.querySelector(".qty > input").value),
      price: parseFloat(invoiceItem.querySelector(".price > input").value),
      total: invoiceTotal,
    });
    total += invoiceTotal;
  }
  // const date = new Date(formInputs[10].value);
  const date = newInvoiceDialog.querySelector("form label > input#date").value;
  // console.log(date);
  let paymentDue = new Date(`${date}T00:00:00`);
  // console.log(paymentDue);
  const paymentTerms = parseInt(
    newInvoiceDialog
      .querySelector("[data-payment-terms-value")
      .getAttribute("data-payment-terms-value")
  );
  paymentDue.setDate(paymentDue.getDate() + paymentTerms);

  // console.log(new Date(Date.now()));
  // console.log(new Date(new Date(date).valueOf() + parseInt(paymentTerms)));
  const invoice = {
    id: generateCustomId(),
    senderAddress: {
      street: newInvoiceDialog.querySelector("form label > input#addy").value,
      city: newInvoiceDialog.querySelector("form label > input#city").value,
      postCode: newInvoiceDialog.querySelector("form label > input#zipcode")
        .value,
      country: newInvoiceDialog.querySelector("form label > input#country")
        .value,
    },
    clientName: newInvoiceDialog.querySelector("form label > input#name").value,
    clientEmail: newInvoiceDialog.querySelector("form label > input#email")
      .value,
    clientAddress: {
      street: newInvoiceDialog.querySelector("form label > input#client-addy")
        .value,
      city: newInvoiceDialog.querySelector("form label > input#client-city")
        .value,
      postCode: newInvoiceDialog.querySelector(
        "form label > input#client-zipcode"
      ).value,
      country: newInvoiceDialog.querySelector(
        "form label > input#client-country"
      ).value,
    },
    createdAt: date,
    description: newInvoiceDialog.querySelector(
      "form label > input#description"
    ).value,
    paymentTerms: paymentTerms,
    status: status,
    items: invoiceItemsArry,
    total,
    paymentDue: paymentDue.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }),
  };

  console.log(invoice);

  resetForm(newInvoiceDialog);
}

header.addEventListener("click", (e) => {
  e.preventDefault();
  const themeBtn = e.target.closest("[data-theme]");
  if (themeBtn) {
    const themeInput = themeBtn.querySelector("input");
    // console.log(themeInput.checked);
    themeInput.checked = !themeInput.checked;
    localStorage.setItem(perferredColorScheme, themeInput.checked ? true : "");
  }
});

main.addEventListener("click", (e) => {
  e.preventDefault();
  const statusFilterOption = e.target.closest("[data-filter-option]");
  const filterDropdown = e.target.closest("[data-filter-dropdown]");
  const dialog = e.target.closest("[data-show-dialog]");
  const invoiceEle = e.target.closest("[data-invoice]");
  //   console.log(e.target);
  //   console.log(e.target); console.log(invoiceEle);

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
    // console.log(invoiceEle);
    location.href = invoiceEle.getAttribute("href");
  }
});

newInvoiceDialog.addEventListener("click", (e) => {
  e.preventDefault();
  const cancelBtn = e.target.closest("[data-cancel]");
  const saveBtn = e.target.closest("[data-save]");
  const addItemBtn = e.target.closest("[data-add-item]");
  const paymentTermsBtn = e.target.closest("[data-payment-terms-option]");
  const paymentTermInput = e.target.closest("[data-payment-terms-input]");
  const deleteItemBtn = e.target.closest("[data-delete-item]");
  const draftBtn = e.target.closest("[data-draft]");
  const goBackBtn = e.target.closest("[data-go-back]");
  //   console.log(e.target);
  if (cancelBtn) {
    resetForm(newInvoiceDialog);
  } else if (goBackBtn) {
    resetForm(newInvoiceDialog);
  } else if (saveBtn) {
    const invoiceForm = newInvoiceDialog.querySelector("#invoice-form");
    if (invoiceForm.checkValidity()) {
      saveInvoice("pending");
    } else {
      invoiceForm.reportValidity();
      //   saveBtn.requestSubmit();
      invoiceForm.requestSubmit(saveBtn);
      //   console.log(saveBtn.click());
      //   saveBtn.click();
      //   console.log(invoiceForm.checkValidity());
    }
  } else if (addItemBtn) {
    if (!addItemBtn.previousElementSibling) {
      addItemBtn.parentElement.insertAdjacentHTML(
        "afterbegin",
        `<div class="invoice-item" data-qty=1 data-price="0.00" data-total="0.00">
                  <label class="name">
                    <span class="label-name">
                      Item name
                      <span class="error-text" aria-live="polite"></span>
                    </span>

                    <input
                      type="text"
                      name="items"
                    
                      required
                      autocomplete="off" />
                  </label>
                  <label class="qty">
                    <span class="label-name">Qty.</span>
                    <input
                      type="number"
                      name="items"
                      value="1"
                      min="1"
                      required
                      inputmode="numeric" />
                  </label>
                  <label class="price">
                    <span class="label-name">Price</span>
                    <input
                      type="number"
                      name="items"
                     step="any"
                      required
                      placeholder="0.00"
                      inputmode="numeric" />
                  </label>
                  <label class="total">
                    <span class="label-name">Total</span>
                    <input
                      type="number"
                      name="items"
                     
                      required
                      readonly
                      placeholder="0.00" />
                  </label>
                  <button class="delete" data-delete-item>
                    <svg
                      width="13"
                      height="16"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M11.583 3.556v10.666c0 .982-.795 1.778-1.777 1.778H2.694a1.777 1.777 0 01-1.777-1.778V3.556h10.666zM8.473 0l.888.889h3.111v1.778H.028V.889h3.11L4.029 0h4.444z"
                        fill="currentColor"
                        fill-rule="nonzero" />
                    </svg>
                  </button>
                </div>`
      );
    } else {
      addItemBtn.previousElementSibling.insertAdjacentHTML(
        "afterend",
        `<div class="invoice-item" data-qty=1 data-price="0.00" data-total="0.00">
                  <label class="name">
                    <span class="label-name">
                      Item name
                      <span class="error-text" aria-live="polite"></span>
                    </span>

                    <input
                      type="text"
                      name="items"
                     
                      required
                      autocomplete="off" />
                  </label>
                  <label class="qty">
                    <span class="label-name">Qty.</span>
                    <input
                      type="number"
                      name="items"
                      value="1"
                      min="1"
                      required
                      inputmode="numeric" />
                  </label>
                  <label class="price">
                    <span class="label-name">Price</span>
                    <input
                      type="number"
                      name="items"
                      step="any"
                      required
                      placeholder="0.00"
                      inputmode="numeric" />
                  </label>
                  <label class="total">
                    <span class="label-name">Total</span>
                    <input
                      type="number"
                      name="items"
                      required
                      readonly
                      placeholder="0.00" />
                  </label>
                  <button class="delete" data-delete-item>
                    <svg
                      width="13"
                      height="16"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M11.583 3.556v10.666c0 .982-.795 1.778-1.777 1.778H2.694a1.777 1.777 0 01-1.777-1.778V3.556h10.666zM8.473 0l.888.889h3.111v1.778H.028V.889h3.11L4.029 0h4.444z"
                        fill="currentColor"
                        fill-rule="nonzero" />
                    </svg>
                  </button>
                </div>`
      );
    }
    addItemBtn.previousElementSibling
      .querySelector(".qty")
      .addEventListener("input", updateTotalWithQty);
    addItemBtn.previousElementSibling
      .querySelector(".price")
      .addEventListener("input", updateTotalWithPrice);
  } else if (paymentTermsBtn) {
    const parentDiv = paymentTermsBtn.closest("div.net");
    const inputSpan = parentDiv.querySelector(
      'span:has(input[type="checkbox"])'
    );
    const labelPaymentTerm = parentDiv.querySelector(
      "[data-payment-terms-value]"
    );
    const input = labelPaymentTerm.querySelector("input");
    inputSpan.querySelector("span").textContent =
      paymentTermsBtn.querySelector("span").textContent;
    labelPaymentTerm.setAttribute(
      "data-payment-terms-value",
      paymentTermsBtn.dataset.paymentTermsOption
    );
    input.checked = !input.checked;
  } else if (paymentTermInput) {
    const input = paymentTermInput.querySelector("input");
    input.checked = !input.checked;
  } else if (deleteItemBtn) {
    deleteItemBtn.parentElement.remove();
  } else if (draftBtn) {
    // const formInputs = newInvoiceDialog.querySelectorAll(
    //   "form label > input:not([id^='net'])"
    // );
    saveInvoice("draft");
    // console.log(invoice);
  }
});
// newInvoiceDialog.addEventListener("input", (e) => {
//     console.log(e.target.value);
// });
createInvoices();
