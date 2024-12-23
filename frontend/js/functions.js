export const URL_WEBSITE = "https://iou.claims";
export const perferredColorScheme = "perferredColorScheme";

function generateCustomId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetters =
    letters.charAt(Math.floor(Math.random() * letters.length)) +
    letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNumbers = Math.floor(1000 + Math.random() * 9000).toString();
  return `${randomLetters}${randomNumbers}`;
}
export const acceptedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

export const currencyOptions = { style: "currency", currency: "USD" };
function createdAt() {
  const currentDate = new Date(Date.now());
  return new Intl.DateTimeFormat("en-CA").format(currentDate);
}
export async function fetchWithAuth(
  path,
  method,
  body = null,
  headers = { "Content-type": "application/json" }
) {
  return await fetch(`${URL_WEBSITE}${path}`, {
    method,
    headers: {
      ...headers,
      // "Access-Control-Allow-Origin": true,
    },
    body,
    credentials: "same-origin",
    cache: "reload",
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
export function showProgressCircle(btn) {
  const btnText = btn.textContent;
  btn.replaceChildren();
  btn.insertAdjacentHTML("beforeend", `<span class="progress-circle"></span>`);
  return btnText;
}

export function hideProgressCircle(btn, btnText) {
  btn.replaceChildren();
  btn.insertAdjacentText("beforeend", btnText);
}

export function showOverlayLoading(overlay) {
  overlay.style.visibility = "visible";
}
export function hideOverlayLoading(overlay) {
  overlay.style.visibility = "hidden";
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
export function updateStatus({ status }, statusBarEle) {
  statusBarEle.insertAdjacentHTML(
    "afterbegin",
    `<div class="status-cont">
    <p class="league-spartan-medium">Status</p>
    <div class="status-token" data-status="${status}">
    <div class="status"></div>
    <span data-status-text>${status}<span>
    </div>
    </div>
     <button
          class="edit-btn"
          data-show-edit-dialog
          aria-label="discard edit">
          Edit
        </button>
        <button class="delete-btn" data-show-delete-dialog>Delete</button>
        <button class="mark-btn" data-mark-status-paid="">Mark as Paid</button>
    `
  );
}
export function updateShareStatus({ status }, statusBarEle) {
  statusBarEle.insertAdjacentHTML(
    "afterbegin",
    `<div class="status-cont">
    <p class="league-spartan-medium">Status</p>
    <div class="status-token" data-status="${status}">
    <div class="status"></div>
    <span data-status-text>${status}<span>
    </div>
    </div>
     <button
          class="edit-btn"
          data-show-edit-dialog
          aria-label="discard edit">
          Edit
        </button>
        <button class="delete-btn" data-reject>Reject</button>
        <button class="mark-btn" data-approve="">Approve</button>
    `
  );
}
export function updateInvoice(
  invoice,
  invoiceEle,
  invoiceItemsTable,
  amountDue
) {
  const senderAddress = JSON.parse(invoice.senderAddress);
  const clientAddress = JSON.parse(invoice.clientAddress);
  const items = JSON.parse(invoice.items);

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
    <p>${senderAddress.street}</p>
    <p>${senderAddress.city}</p>
    <p>${senderAddress.postCode}</p>
    <p>${senderAddress.country}</p>
    </address>
    <div class="invoice-date">
    Invoice Date
    <p class="league-spartan-bold">${new Date(
      `${invoice.createdAt}`
    ).toLocaleDateString("en-AU", { dateStyle: "medium" })}</p>
    </div>
    <div class="payment-due">
    Payment Due
    <p class="league-spartan-bold">${new Date(
      `${invoice.paymentDue}`
    ).toLocaleDateString("en-AU", { dateStyle: "medium" })}</p>
    </div>
    <div class="bill-to">
    Bill to
    <p class="league-spartan-bold">${invoice.clientName}</p>
    <address>
    <p>${clientAddress.street}</p>
    <p>${clientAddress.city}</p>
    <p>${clientAddress.postCode}</p>
    <p>${clientAddress.country}</p>
    </address>
    </div>
    <div class="email">
    Sent to
    <p class="league-spartan-bold">${invoice.clientEmail}</p>
    </div>
    </div>`
  );

  for (const item of items) {
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
  amountDue.textContent = invoice.total.toLocaleString("en", currencyOptions);
}
export function setUpEditDialog(editDialog, invoice) {
  editDialog.showModal();

  const editId = editDialog.querySelector("[data-invoice-id]");
  const addItemBtn = editDialog.querySelector("[ data-add-item]");
  editId.textContent = `${invoice.id}`;
  const {
    senderAddress,
    clientAddress,
    clientName,
    clientEmail,
    createdAt,
    description,
    items,
    paymentTerms,
  } = invoice;
  const { street, city, postCode, country } = JSON.parse(senderAddress);
  const {
    street: clientStreet,
    city: clientCity,
    postCode: clientPostCode,
    country: clientCountry,
  } = JSON.parse(clientAddress);

  const itemsArry = JSON.parse(items).entries();
  const netEle = editDialog.querySelector("form [data-payment-terms-value]");
  netEle.setAttribute("data-payment-terms-value", paymentTerms);

  netEle.querySelector(".net-span > span").textContent =
    editDialog.querySelector(
      `form [data-payment-terms-option="${paymentTerms}"] > span`
    ).textContent;
  editDialog.querySelector("form label > input#street").value = street ?? "";
  editDialog.querySelector("form label > input#city").value = city ?? "";
  editDialog.querySelector("form label > input#postal-code").value =
    postCode ?? "";
  editDialog.querySelector("form label > input#country").value = country ?? "";

  editDialog.querySelector("form label > input#client-name").value =
    clientName ?? "";
  editDialog.querySelector("form label > input#client-email").value =
    clientEmail ?? "";

  editDialog.querySelector("form label > input#client-street").value =
    clientStreet ?? "";
  editDialog.querySelector("form label > input#client-city").value =
    clientCity ?? "";
  editDialog.querySelector("form label > input#client-postal-code").value =
    clientPostCode ?? "";
  editDialog.querySelector("form label > input#client-country").value =
    clientCountry ?? "";
  editDialog.querySelector("form label > input#date").value =
    formatDate(createdAt);
  editDialog.querySelector("form label > input#description").value =
    description ?? "";
  for (const [index, item] of itemsArry) {
    const { name, price, quantity, total } = item;
    addItemBtn.insertAdjacentHTML(
      "beforebegin",
      `<div class="invoice-item">
                  <label class="name">
                    <span class="label-name">
                      Item name
                      <span class="error-text" aria-live="polite"></span>
                    </span>

                    <input
                      type="text"
                      name="items"
                      
                      value="${name}"
                      required
                      autocomplete="off" />
                  </label>
                  <label class="qty">
                    <span class="label-name">Qty.</span>
                    <input
                      type="number"
                      name="items"
                      
                      value="${quantity}"
                      required
                      inputmode="numeric" />
                  </label>
                  <label class="price">
                    <span class="label-name">Price</span>
                    <input
                      type="number"
                      value="${price.toFixed(2)}"
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
                      value="${total.toFixed(2)}"
                      required
                      readonly
                      placeholder="0.00" />
                  </label>
                  <button class="delete" data-delete-item data-item-index="${index}">
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
    headers: {},
    cache: "reload",
    credentials: "same-origin",
  });
  const result = await response.json();

  localStorage.removeItem("img");
  localStorage.removeItem("username");
  location.href = "/login.html";
}

export async function getShortenUrl(link) {
  const URL = "https://tinyurl.com/api-create.php?url=";

  try {
    const urlResponse = await fetch(`${URL}${link}`);
    const shortenUrl = await urlResponse.text();
    return shortenUrl;
  } catch (error) {
    console.error(` getShortenUrl: ${error}`);
  }
}
export async function copyUrl(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error(error.message);
  }
}

export async function refreshAccessToken() {
  try {
    const tokenResponse = await fetch(`${URL_WEBSITE}/refresh-token`, {
      method: "POST",
      credentials: "same-origin",
    });

    if (tokenResponse.ok) {
      const { accessToken } = await tokenResponse.json();
    } else {
      console.error(await tokenResponse.json());
      await logout();
    }
  } catch (error) {
    console.error(error);
    await logout();
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
