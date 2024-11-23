const data = await (await fetch("data.json")).json();

console.log(data);
const invoices = document.querySelector(".invoices");
const newInvoiceDialog = document.getElementById("new-invoice-dialog");
// const newInvoiceBtn = document.querySelector(".new-invoice-btn");
const main = document.querySelector("main");
const currencyOptions = { style: "currency", currency: "GBP" };
const filterOptions = new Set();
function createInvoices() {
  for (const invoice of data) {
    // console.log(invoice);
    const { id, paymentDue, clientName, total, status } = invoice;
    invoices.insertAdjacentHTML(
      "beforeend",
      `<a href="./invoice.html?invoicd-id=${id}" tabindex="0" data-status="${status}">
          <div class="invoice league-spartan-bold">
            <div class="invoice-id">
              <span>#</span>
              ${id}
            </div>
            <div class="invoice-user league-spartan-medium">${clientName}</div>
            <div class="due-date league-spartan-medium">Due ${paymentDue}</div>

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

function updateTotal(e) {
  console.log(e.target.value);
}

// newInvoiceBtn.addEventListener("click", (e) => {
//   newInvoiceDialog.showModal();
// });

main.addEventListener("click", (e) => {
  //   e.preventDefault();
  const statusFilterOption = e.target.closest("[data-filter-option]");
  const filterDropdown = e.target.closest("[data-filter-dropdown]");
  const dialog = e.target.closest("[data-show-dialog]");
  console.log(e.target);

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
  //   console.log(e.target);
  if (cancelBtn) {
    newInvoiceDialog.close();
  } else if (saveBtn) {
    const invoiceForm = newInvoiceDialog.querySelector("#invoice-form");
    if (invoiceForm.checkValidity()) {
    } else {
      invoiceForm.reportValidity();
      //   console.log(invoiceForm.checkValidity());
    }
  } else if (addItemBtn) {
    if (!addItemBtn.previousElementSibling) {
      addItemBtn.parentElement.insertAdjacentHTML(
        "afterbegin",
        `<div class="invoice-item">
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
        `<div class="invoice-item">
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
      .addEventListener("input", updateTotal);
    addItemBtn.previousElementSibling
      .querySelector(".price")
      .addEventListener("input", updateTotal);
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
  }
});
newInvoiceDialog.addEventListener("input", (e) => {
  //   console.log(e.target.value);
});
createInvoices();
