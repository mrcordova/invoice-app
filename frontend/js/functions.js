export const URL = "https://invoice-backend.noahprojects.work";
export const perferredColorScheme = "perferredColorScheme";

function generateCustomId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetters =
    letters.charAt(Math.floor(Math.random() * letters.length)) +
    letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNumbers = Math.floor(1000 + Math.random() * 9000).toString();
  return `${randomLetters}${randomNumbers}`;
}

// const dataResponse = await fetch(`${URL}/health-check`);
// console.log(await dataResponse.json());

function createdAt() {
  const currentDate = new Date(Date.now());
  return new Intl.DateTimeFormat("en-CA").format(currentDate);
}

export function themeUpdate(e, themeInputs) {
  const checked = !e.target.closest("label").querySelector("input").checked;
  // console.log(checked);
  for (const themeInput of themeInputs) {
    const input = themeInput.querySelector("input");
    input.checked = checked;
    // console.log(input);
    localStorage.setItem(perferredColorScheme, input.checked ? true : "");
  }
}
export function formatDate(date) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(date));
}
export function resetForm(invoiceDialog) {
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

export function addItemRow(addItemBtn) {
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
                      step="any"
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
                       step="any"
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
}
export function saveInvoice(invoiceDialog, status, id = null) {
  const invoiceItems = invoiceDialog.querySelectorAll(
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
  const date = invoiceDialog.querySelector("form label > input#date").value;
  // console.log(date);
  // date = new Date(`${date}T00:00:00`).toLocaleDateString("en-CA", {
  //   year: "numeric",
  //   month: "numeric",
  //   day: "numeric",
  // });
  // console.log(date);
  // console.log(new Intl.DateTimeFormat("en-CA").format(`${date}T00:00:00`));

  // console.log(formatDate(date));
  const createdAtVal = date === "" ? createdAt() : date;
  // console.log(date);
  let paymentDue = new Date(`${createdAtVal}T00:00:00`);
  // let paymentDue =
  //   date == "Invalid Date" ? "No Due Date" : new Date(`${date}T00:00:00`);
  // console.log(paymentDue);
  const paymentTerms = parseInt(
    invoiceDialog
      .querySelector("[data-payment-terms-value")
      .getAttribute("data-payment-terms-value")
  );
  paymentDue.setDate(paymentDue.getDate() + paymentTerms);
  paymentDue = paymentDue.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  // if (paymentDue != "No Due Date") {
  //   paymentDue.setDate(paymentDue.getDate() + paymentTerms);

  //   paymentDue = paymentDue.toLocaleDateString("en-CA", {
  //     year: "numeric",
  //     month: "numeric",
  //     day: "numeric",
  //   });
  // }

  const invoice = {
    id: id ?? generateCustomId(),
    senderAddress: {
      street: invoiceDialog.querySelector("form label > input#addy").value,
      city: invoiceDialog.querySelector("form label > input#city").value,
      postCode: invoiceDialog.querySelector("form label > input#zipcode").value,
      country: invoiceDialog.querySelector("form label > input#country").value,
    },
    clientName: invoiceDialog.querySelector("form label > input#name").value,
    clientEmail: invoiceDialog.querySelector("form label > input#email").value,
    clientAddress: {
      street: invoiceDialog.querySelector("form label > input#client-addy")
        .value,
      city: invoiceDialog.querySelector("form label > input#client-city").value,
      postCode: invoiceDialog.querySelector("form label > input#client-zipcode")
        .value,
      country: invoiceDialog.querySelector("form label > input#client-country")
        .value,
    },
    createdAt: `${createdAtVal}T00:00:00`,
    description: invoiceDialog.querySelector("form label > input#description")
      .value,
    paymentTerms: paymentTerms,
    status: status,
    items: invoiceItemsArry,
    total,
    paymentDue: `${paymentDue}T00:00:00`,
  };

  // console.log(invoice);

  resetForm(invoiceDialog);
  return invoice;
}
export function updatePaymentTerms(paymentTermsBtn) {
  const parentDiv = paymentTermsBtn.closest("div.net");
  const inputSpan = parentDiv.querySelector('span:has(input[type="checkbox"])');
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
}

export function showPaymentTermsMenu(paymentTermInput) {
  const input = paymentTermInput.querySelector("input");
  input.checked = !input.checked;
}
