export const URL_WEBSITE = "https://invoice-backend.noahprojects.work";
export const perferredColorScheme = "perferredColorScheme";
// export const accessToken = localStorage.getItem('accessToken');

function generateCustomId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetters =
    letters.charAt(Math.floor(Math.random() * letters.length)) +
    letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNumbers = Math.floor(1000 + Math.random() * 9000).toString();
  return `${randomLetters}${randomNumbers}`;
}
export const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];


function createdAt() {
  const currentDate = new Date(Date.now());
  return new Intl.DateTimeFormat("en-CA").format(currentDate);
}
export async function fetchWithAuth(path, method, body = null, headers = { "Content-type": "application/json" }) {
  return await fetch(`${URL_WEBSITE}${path}`, {
    method,
    headers: {
       ...headers,
      "Access-Control-Allow-Origin": true,
    },
    body,
    credentials: 'same-origin',
    cache: 'reload'
  });
}
export function themeUpdate(e, themeInputs) {
  const checked = !e.target.closest("label").querySelector("input").checked;
  for (const themeInput of themeInputs) {
    const input = themeInput.querySelector("input");
    input.checked = checked;
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
  const form = invoiceDialog.querySelector("form");
  const formData = new FormData(form);
  const formObj = Object.fromEntries(formData);
  const {
    date,
    city,
    "client-city": clientCity,
    "client-country": clientCountry,
    "client-street": clientStreet,
    "client-postal-code": clientPostCode,
    "client-email": clientEmail,
    description,
    "postal-code": postCode,
    street,
    country,
    "client-name": clientName,
  } = formObj;

  const createdAtVal = date === "" ? createdAt() : date;
  let paymentDue = new Date(`${createdAtVal}T00:00:00`);

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

  const invoice = {
    id: id ?? generateCustomId(),
    senderAddress: { street, city, postCode, country },
    clientName,
    clientEmail,
    clientAddress: {
      street: clientStreet,
      city: clientCity,
      country: clientCountry,
      postCode: clientPostCode,
    },
    status: status,
    createdAt: `${createdAtVal}T00:00:00`,
    description,
    paymentTerms,
    items: invoiceItemsArry,
    total,
    paymentDue: `${paymentDue}T00:00:00`,
  };

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

export async function logout() {
  const response = await fetch(`${URL_WEBSITE}/logout`, {
    method: "POST",
    headers: {
      "Access-Control-Allow-Origin": true,
    },
    cache: 'reload',
    credentials: "include",
  });
  location.href = '/login.html';
}

export async function refreshAccessToken() {
  try {
    const tokenResponse = await fetch(`${URL_WEBSITE}/refresh-token`, {
      method: "POST",
      credentials: "same-origin",
    });

    if (tokenResponse.ok) {
      const { accessToken } = await tokenResponse.json();
      console.log(accessToken);
    
    } else {

      console.error(await tokenResponse.text());
      location.href = "/login.html";
    }
  } catch (error) {
    console.error(error);
  }
}

export function showPaymentTermsMenu(paymentTermInput) {
  const input = paymentTermInput.querySelector("input");
  input.checked = !input.checked;
}
export function showFormErrors(e) {
  const form = e.closest("form");
  return form.reportValidity();
}
