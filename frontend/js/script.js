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
  const cancelBtn = e.target.closest("[data-cancel]");
  const saveBtn = e.target.closest("[data-save]");
  console.log(e.target);
  if (cancelBtn) {
    newInvoiceDialog.close();
  } else if (saveBtn) {
    const invoiceForm = newInvoiceDialog.querySelector("#invoice-form");
    if (invoiceForm.checkValidity()) {
    } else {
      invoiceForm.reportValidity();
      //   console.log(invoiceForm.checkValidity());
    }
  }
});
createInvoices();
