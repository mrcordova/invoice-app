const newInvoiceDialog = document.getElementById("new-invoice-dialog");
const newInvoiceBtn = document.querySelector(".new-invoice-btn");

// console.log(newInvoiceBtn);
newInvoiceBtn.addEventListener("click", (e) => {
  newInvoiceDialog.showModal();
});
