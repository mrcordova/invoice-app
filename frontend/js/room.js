import {
  addItemRow,
  updateInvoice,
  updateShareStatus,
  perferredColorScheme,
  setUpEditDialog,
  saveInvoice,
  themeUpdate,
  URL_WEBSITE,
  showOverlayLoading,
  hideOverlayLoading,
  resetForm,
  showPaymentTermsMenu,
  updatePaymentTerms,
} from "./functions.js";

const parems = new URLSearchParams(document.location.search);
const loadingOverlay = document.getElementById("overlay");

const editDialog = document.querySelector("#edit-invoice-dialog");
const invoiceEle = document.querySelector("[data-invoice]");
const invoiceItemsTable = document.querySelector(".invoice-table-cont");
const amountDue = document.querySelector("[data-amount-due]");
const statusBarEle = document.querySelector("[data-status-bar]");
const body = document.querySelector("body");
const responseDialog = document.querySelector("#response-dialog");
const themeInputs = document.querySelectorAll('label:has(input[name="theme"])');
const responsePopover = document.querySelector("#response-popover");

const token = parems.get("token");
const status = localStorage.getItem("status");

await fetch(`${URL_WEBSITE}/guest-token`);

const socket = io({
  reconnection: true, // Enable reconnection
  reconnectionAttempts: 10, // Limit the number of attempts
  reconnectionDelay: 1000, // Delay between attempts in ms
  reconnectionDelayMax: 5000, // Max delay between attempts
  transports: ["websocket"],
  upgrade: true,
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

body.addEventListener("click", (e) => {
  const editDialogTarget = e.target.closest("[data-show-edit-dialog]");
  const saveBtn = e.target.closest("[data-save]");
  const approveBtn = e.target.closest("[data-approve]");
  const rejectBtn = e.target.closest("[data-reject]");
  const themeBtn = e.target.closest("[data-theme]");
  const goBackBtn = e.target.closest("[data-go-back-page]");

  const paymentTermsBtn = e.target.closest("[data-payment-terms-option]");
  const paymentTermInput = e.target.closest("[data-payment-terms-input]");

  const addItemBtn = e.target.closest("[data-add-item]");

  const deleteItemBtn = e.target.closest("[data-delete-item]");

  if (editDialogTarget) {
    const tempInvoice = JSON.parse(localStorage.getItem("invoice"));

    setUpEditDialog(editDialog, tempInvoice);
  } else if (goBackBtn) {
    resetForm(editDialog);
  } else if (paymentTermsBtn) {
    e.preventDefault();
    updatePaymentTerms(paymentTermsBtn);
  } else if (paymentTermInput) {
    e.preventDefault();
    showPaymentTermsMenu(paymentTermInput);
  } else if (addItemBtn) {
    e.preventDefault();
    addItemRow(addItemBtn);
  } else if (deleteItemBtn) {
    e.preventDefault();
    deleteItemBtn.parentElement.remove();
  } else if (saveBtn) {
    e.preventDefault();
    const invoice = JSON.parse(localStorage.getItem("invoice"));
    const tempInvoice = saveInvoice(
      editDialog,
      invoice.status === "draft" ? "pending" : invoice.status,
      invoice.id
    );

    const jsonInvoice = tempInvoice;

    socket.emit("updateInvoice", { room_id: token, invoice: jsonInvoice });
  } else if (approveBtn) {
    choiceBtn(approveBtn);
    const senderId = localStorage.getItem("senderId");
    if (senderId) {
      removeEditBtns();

      socket.emit("sendResponse", { room_id: token, approve: true });
      localStorage.removeItem("senderId");
      localStorage.setItem("status", "approve");
    } else {
      socket.emit("sendInvoiceMessage", { approve: true, room_id: token });
    }
  } else if (rejectBtn) {
    choiceBtn(rejectBtn);
    const senderId = localStorage.getItem("senderId");
    if (senderId) {
      removeEditBtns();

      socket.emit("sendResponse", { room_id: token, approve: false });
      localStorage.removeItem("senderId");
      localStorage.setItem("status", "reject");
    } else {
      socket.emit("sendInvoiceMessage", { approve: false, room_id: token });
    }
  } else if (themeBtn) {
    e.preventDefault();
    themeUpdate(e, themeInputs);
  }
});

socket.on("message", ({ invoice: newInvoice }) => {
  statusBarEle.replaceChildren();
  invoiceEle.childNodes[0].remove();
  invoiceItemsTable.replaceChildren();

  localStorage.setItem("invoice", newInvoice);
  const invoice = JSON.parse(newInvoice);
  updateShareStatus(invoice, statusBarEle);
  updateInvoice(invoice, invoiceEle, invoiceItemsTable, amountDue);
});

socket.on("invoice", ({ invoice, room_id }) => {
  statusBarEle.replaceChildren();
  invoiceEle.childNodes[0].remove();
  invoiceItemsTable.replaceChildren();
  const tempInvoice = invoice;

  tempInvoice.senderAddress = JSON.stringify(tempInvoice.senderAddress);
  tempInvoice.clientAddress = JSON.stringify(tempInvoice.clientAddress);
  tempInvoice.items = JSON.stringify(tempInvoice.items);

  updateShareStatus(tempInvoice, statusBarEle);
  updateInvoice(tempInvoice, invoiceEle, invoiceItemsTable, amountDue);

  localStorage.setItem("invoice", JSON.stringify(invoice));
});
socket.on("rejoined-room", (message) => {
  console.log(message);
});

socket.on("askForResponse", ({ approve, userId }) => {
  addEditBtns();
  editDialog.close();
  localStorage.setItem("senderId", userId);
  const responseStr = `User ${userId} has ${
    approve ? "approved" : "rejected"
  } invoice`;
  showResponsePopover(responseStr);
});

socket.on("waitingForResponse", ({ status, numOfGuests, approve }) => {
  console.log(status);
  localStorage.setItem("status", status);

  localStorage.setItem("numOfGuests", numOfGuests);
  localStorage.setItem(
    "responses",
    JSON.stringify([approve ? "approve" : "reject"])
  );
  responseDialog.showModal();
});

socket.on("responseReceived", ({ response }) => {
  const responseStr = `User  has ${response ? "approved" : "rejected"} invoice`;
  showResponsePopover(responseStr);
  const responses = JSON.parse(localStorage.getItem("responses"));
  responses.push(response ? "approve" : "reject");
  localStorage.setItem("responses", JSON.stringify(responses));
  const numOfGuests = localStorage.getItem("numOfGuests") - 1;
  if (!numOfGuests) {
    const approveResult =
      document.querySelector("[data-approve]").dataset.approve;
    localStorage.setItem("status", approveResult !== "" ? "approve" : "reject");
    responseDialog.close();
    localStorage.removeItem("numOfGuests");
    if (!responses.includes("reject")) {
      //save invoice to database
      socket.emit("saveInvoice", {
        invoice: localStorage.getItem("invoice"),
        room_id: token,
      });
      const message = "Invoice saved";
      socket.emit("informEveryUser", { message, room_id: token });
    } else {
      socket.emit("resetInvoice", { room_id: token });
      const message = "Invoice reset";
      socket.emit("informEveryUser", { message, room_id: token });
    }
    localStorage.removeItem("responses");
  } else {
    localStorage.setItem("numOfGuests", numOfGuests);
  }
});
socket.on("displayMessage", ({ message }) => {
  showResponsePopover(message);
});

socket.on("error", (message) => {
  console.error(message);
  const editBtns = document.querySelectorAll(".edit-btns");
  for (const editBtn of editBtns) {
    editBtn.style.display = "none";
  }
});

socket.on("checkStatus", ({ room_id }) => {
  const status = localStorage.getItem("status");
  if (status === "waiting") {
    const approveResult =
      document.querySelector("[data-approve]").dataset.approve;
    socket.emit("returnStatus", {
      status,
      room_id,
      approve: approveResult == "true" ? true : false,
    });
  }
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

window.addEventListener("beforeunload", () => {
  localStorage.removeItem("invoice");
  socket.emit("end", { token });
  localStorage.removeItem("token");
});
socket.on("connect", () => {
  console.log("Connected to server");

  showOverlayLoading(loadingOverlay);
  const tempToken = localStorage.getItem("token");
  if (status === "waiting") {
    responseDialog.showModal();
  }

  if (token === tempToken) {
    socket.emit("rejoinRoom", token);
  } else {
    socket.emit("joinRoom", { token });
    localStorage.setItem("token", token);
  }
  hideOverlayLoading(loadingOverlay);
});
socket.on("connect_error", (err) => {
  // the reason of the error, for example "xhr poll error"
  console.log(err.message);

  // some additional description, for example the status code of the initial HTTP response
  console.log(err.description);

  // some additional context, for example the XMLHttpRequest object
  console.log(err.context);
});

function addEditBtns() {
  const editBtns = document.querySelectorAll("[data-show-edit-dialog]");
  for (const editBtn of editBtns) {
    editBtn.classList.add("hide");
  }
}
function removeEditBtns() {
  const editBtns = document.querySelectorAll("[data-show-edit-dialog]");
  for (const editBtn of editBtns) {
    editBtn.classList.remove("hide");
  }
}

function choiceBtn(btn) {
  const rejectBtns = document.querySelectorAll("[data-reject]");
  const approveBtns = document.querySelectorAll("[data-approve]");
  for (const rejectBtn of rejectBtns) {
    rejectBtn.setAttribute(
      "data-reject",
      btn.hasAttribute("data-reject") ? true : ""
    );
  }
  for (const approveBtn of approveBtns) {
    approveBtn.setAttribute(
      "data-approve",
      btn.hasAttribute("data-approve") ? true : ""
    );
  }
}

function showResponsePopover(str) {
  const userResponse = responsePopover.querySelector("[data-response]");
  userResponse.textContent = `${str}`;
  responsePopover.showPopover();
  setTimeout(() => {
    responsePopover.hidePopover();
  }, 2000);
}
