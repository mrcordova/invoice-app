import {
  addItemRow,
  formatDate,
  resetForm,
  saveInvoice,
  showPaymentTermsMenu,
  updatePaymentTerms,
  perferredColorScheme,
  themeUpdate,
  URL,
} from "./functions.js";
let params = new URLSearchParams(document.location.search);
const invoiceId = params.get("invoice-id");

let invoice = await (
  await fetch(`${URL}/getInvoice/${invoiceId}`, {
    method: "GET",
    headers: { "Content-type": "application/json" },
    cache: "reload",
  })
).json();

console.log(invoice);
const deleteDialog = document.querySelector("#delete-dialog");
const editDialog = document.querySelector("#edit-invoice-dialog");
const body = document.querySelector("body");
const statusBarEle = document.querySelector("[data-status-bar]");
const invoiceEle = document.querySelector("[data-invoice]");
const invoiceItemsTable = document.querySelector(".invoice-table-cont");
const amountDue = document.querySelector("[data-amount-due]");
// const themeInput = document.querySelector("#theme");
// const perferredColorScheme = "perferredColorScheme";
const currencyOptions = { style: "currency", currency: "GBP" };
const homePage = "index.html";
const themeInputs = document.querySelectorAll('label:has(input[name="theme"])');

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

function updateStatus({ status }) {
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
function updateInvoice(invoice) {
  // console.log(invoice);
  const senderAddress = JSON.parse(invoice.senderAddress);
  const clientAddress = JSON.parse(invoice.clientAddress);
  const items = JSON.parse(invoice.items);
  // console.log(invoice.items);
  // console.log(invoice);
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
    // console.log(item);
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
updateStatus(invoice);
updateInvoice(invoice);
body.addEventListener("click", async (e) => {
  //   console.log(e.target);
  e.preventDefault();
  const deleteDialogTarget = e.target.closest("[data-show-delete-dialog]");
  const editDialogTarget = e.target.closest("[data-show-edit-dialog]");
  const goBackBtn = e.target.closest("[data-go-back]");
  const goBackPageBtn = e.target.closest("[data-go-back-page]");
  const markAsPaidBtn = e.target.closest("[data-mark-status-paid]");
  const themeBtn = e.target.closest("[data-theme]");
  const closeDeleteDialog = e.target.closest("[data-close-delete-dialog]");
  const deleteInvoiceBtn = e.target.closest("[delete-invoice]");
  const deleteItemBtn = e.target.closest("[data-delete-item]");
  const addItemBtn = e.target.closest("[data-add-item]");
  const paymentTermsBtn = e.target.closest("[data-payment-terms-option]");
  const paymentTermInput = e.target.closest("[data-payment-terms-input]");
  const saveChangesBtn = e.target.closest("[data-save]");
  // const themeBtn = e.target.closest('[data-theme]');
  //   console.log(goBackBtn);
  if (deleteDialogTarget) {
    deleteDialog.showModal();
    const deleteId = deleteDialog.querySelector("[data-invoice-id]");
    deleteId.textContent = `#${invoiceId}`;
  } else if (editDialogTarget) {
    editDialog.showModal();
    const editId = editDialog.querySelector("[data-invoice-id]");
    const addItemBtn = editDialog.querySelector("[ data-add-item]");
    editId.textContent = `${invoiceId}`;
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
    // console.log(editDialog.querySelector("form label > input#addy"));
    const netEle = editDialog.querySelector("form [data-payment-terms-value]");
    netEle.setAttribute("data-payment-terms-value", paymentTerms);

    netEle.querySelector(".net-span > span").textContent =
      editDialog.querySelector(
        `form [data-payment-terms-option="${paymentTerms}"] > span`
      ).textContent;
    editDialog.querySelector("form label > input#addy").value = street ?? "";
    editDialog.querySelector("form label > input#city").value = city ?? "";
    editDialog.querySelector("form label > input#zipcode").value =
      postCode ?? "";
    editDialog.querySelector("form label > input#country").value =
      country ?? "";

    editDialog.querySelector("form label > input#name").value =
      clientName ?? "";
    editDialog.querySelector("form label > input#email").value =
      clientEmail ?? "";

    editDialog.querySelector("form label > input#client-addy").value =
      clientStreet ?? "";
    editDialog.querySelector("form label > input#client-city").value =
      clientCity ?? "";
    editDialog.querySelector("form label > input#client-zipcode").value =
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
  } else if (goBackBtn) {
    history.back();
  } else if (markAsPaidBtn) {
    const statusEle = statusBarEle.querySelector("[data-status]");
    const statusText = statusEle.querySelector("[data-status-text]");
    const status =
      statusEle.dataset.status == "pending" ? "paid" : statusEle.dataset.status;
    if (status !== statusEle.dataset.status) {
      const response = await (
        await fetch(`${URL}/updateStatus/${invoice.id}`, {
          method: "PUT",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify({ status }),
        })
      ).json();
      invoice.status = status;
      // console.log(invoice);
    }
    statusEle.setAttribute("data-status", status);
    statusText.textContent = status;
  } else if (themeBtn) {
    themeUpdate(e, themeInputs);
  } else if (closeDeleteDialog) {
    deleteDialog.close();
  } else if (goBackPageBtn) {
    //   editDialog.close();
    resetForm(editDialog);
  } else if (deleteInvoiceBtn) {
    const response = await (
      await fetch(`${URL}/deleteInvoice/${invoiceId}`, {
        method: "DELETE",
        headers: { "Content-type": "application/json" },
      })
    ).json();
    // console.log(response);
    if (response.success) {
      history.back();
    }
    // const idxOfInvoice = data
    //   .map((invoice) => invoice.id)
    //   .indexOf(`${invoiceId}`);
    // data.splice(idxOfInvoice, 1);
    // console.log(data);
    // location.href = homePage;
  } else if (deleteItemBtn) {
    const deleteItemIndx = deleteItemBtn.dataset.itemIndex;
    // invoice.items.splice(deleteItemIndx, 1);

    deleteItemBtn.parentElement.remove();
  } else if (addItemBtn) {
    addItemRow(addItemBtn);
  } else if (paymentTermsBtn) {
    updatePaymentTerms(paymentTermsBtn);
  } else if (paymentTermInput) {
    showPaymentTermsMenu(paymentTermInput);
  } else if (saveChangesBtn) {
    const invoiceForm = editDialog.querySelector("#invoice-form");
    if (invoiceForm.checkValidity()) {
      const tempInvoice = saveInvoice(
        editDialog,
        invoice.status === "draft" ? "pending" : invoice.status,
        invoice.id
      );
      statusBarEle.replaceChildren();
      invoiceEle.childNodes[0].remove();
      invoiceItemsTable.replaceChildren();
      const response = await (
        await fetch(`${URL}/updateInvoice/${invoice.id}`, {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(tempInvoice),
        })
      ).json();
      tempInvoice.senderAddress = JSON.stringify(tempInvoice.senderAddress);
      tempInvoice.clientAddress = JSON.stringify(tempInvoice.clientAddress);
      tempInvoice.items = JSON.stringify(tempInvoice.items);
      updateStatus(tempInvoice);
      updateInvoice(tempInvoice);
      invoice = tempInvoice;
    } else {
      invoiceForm.reportValidity();
      invoiceForm.requestSubmit(saveChangesBtn);
    }
  }
});
