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
const deleteDialog = document.querySelector("#delete-dialog");
const editDialog = document.querySelector("#edit-invoice-dialog");
const invoiceEle = document.querySelector("[data-invoice]");
const invoiceItemsTable = document.querySelector(".invoice-table-cont");
const amountDue = document.querySelector("[data-amount-due]");
const statusBarEle = document.querySelector("[data-status-bar]");
const body = document.querySelector("body");
const responseDialog = document.querySelector("#response-dialog");
const themeInputs = document.querySelectorAll('label:has(input[name="theme"])');
const responsePopover = document.querySelector("#response-popover");
// let responses = [];
// localStorage.debug = "socket.io-client:socket";
localStorage.debug = "socket.io-client:socket,socket.io-client:manager";

// console.log(token);
const token = parems.get("token");
// const room_id = localStorage.getItem("room_id");
const status = localStorage.getItem("status");
// let invoice;
// let socket;
// responsePopover.showPopover();

await fetch(`${URL_WEBSITE}/guest-token`);

// if (!socket) {
const socket = io({
  reconnection: true, // Enable reconnection
  reconnectionAttempts: 10, // Limit the number of attempts
  reconnectionDelay: 1000, // Delay between attempts in ms
  reconnectionDelayMax: 5000, // Max delay between attempts
  transports: ["websocket"],
  upgrade: true,
});
// }
// if (socket.disconnected) {
//   socket.connect();
// }
if (!(perferredColorScheme in localStorage)) {
  localStorage.setItem(
    perferredColorScheme,
    window.matchMedia("(prefers-color-scheme: dark)").matches ? true : ""
  );
}
if ("invoice" in localStorage) {
  const invoice = JSON.parse(localStorage.getItem("invoice"));
  // console.log(invoice);
  // invoice.senderAddress = JSON.stringify(invoice.senderAddress);
  // invoice.clientAddress = JSON.stringify(invoice.clientAddress);
  // invoice.items = JSON.stringify(invoice.items);
  updateShareStatus(invoice, statusBarEle);
  updateInvoice(invoice, invoiceEle, invoiceItemsTable, amountDue);
}

if (status === "waiting") {
  responseDialog.showModal();
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
    // e.preventDefault();
    // console.log(invoice);
    const tempInvoice = JSON.parse(localStorage.getItem("invoice"));
    // tempInvoice.senderAddress = JSON.stringify(tempInvoice.senderAddress);
    // tempInvoice.clientAddress = JSON.stringify(tempInvoice.clientAddress);
    // tempInvoice.items = JSON.stringify(tempInvoice.items);
    setUpEditDialog(editDialog, tempInvoice);
  } else if (goBackBtn) {
    // const form = document.querySelector("form#invoice-form");
    // editDialog.close();
    // e.preventDefault();
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
    // console.log(invoice);
    const tempInvoice = saveInvoice(
      editDialog,
      invoice.status === "draft" ? "pending" : invoice.status,
      invoice.id
    );
    // console.log(tempInvoice);
    // statusBarEle.replaceChildren();
    // invoiceEle.childNodes[0].remove();
    // invoiceItemsTable.replaceChildren();
    const jsonInvoice = tempInvoice;
    // console.log(jsonInvoice);
    // jsonInvoice.senderAddress = JSON.stringify(tempInvoice.senderAddress);
    // jsonInvoice.clientAddress = JSON.stringify(tempInvoice.clientAddress);
    // jsonInvoice.items = JSON.stringify(tempInvoice.items);
    // console.log(jsonInvoice);
    // socket.emit("updateInvoice", { room_id, invoice: jsonInvoice });
    socket.emit("updateInvoice", { room_id: token, invoice: jsonInvoice });
  } else if (approveBtn) {
    // console.log(approveBtn);
    choiceBtn(approveBtn);
    // editDialog.showModal();
    const senderId = localStorage.getItem("senderId");
    if (senderId) {
      // const editBtns = document.querySelectorAll("[data-show-edit-dialog]");
      removeEditBtns();
      // console.log(editBtns);
      // socket.emit("sendResponse", { room_id, approve: true });
      socket.emit("sendResponse", { room_id: token, approve: true });
      localStorage.removeItem("senderId");
      localStorage.setItem("status", "approve");
      // for (const editBtn of editBtns) {
      //   editBtn.classList.remove("hide");
      // }
    } else {
      // console.log(room_id);
      // socket.emit("sendResponse", { room_id, approve: true });
      socket.emit("sendInvoiceMessage", { approve: true, room_id: token });
    }
  } else if (rejectBtn) {
    // console.log("reject", rejectBtn);
    // const approveBtn = document.querySelector("[data-approve]");
    // rejectBtn.setAttribute("data-reject", true);
    // approveBtn.setAttribute("data-approve", "");
    choiceBtn(rejectBtn);
    // console.log(rejectBtn);
    const senderId = localStorage.getItem("senderId");
    if (senderId) {
      // const editBtns = document.querySelectorAll("[data-show-edit-dialog]");
      removeEditBtns();
      // console.log(editBtns);
      // socket.emit("sendResponse", { room_id, approve: false });
      socket.emit("sendResponse", { room_id: token, approve: false });
      localStorage.removeItem("senderId");
      localStorage.setItem("status", "reject");
      // for (const editBtn of editBtns) {
      //   editBtn.classList.remove("hide");
      // }
    } else {
      // socket.emit("sendInvoiceMessage", { approve: false, room_id });
      socket.emit("sendInvoiceMessage", { approve: false, room_id: token });
    }
  } else if (themeBtn) {
    e.preventDefault();
    themeUpdate(e, themeInputs);
  }
});

// document.addEventListener("visibilitychange", () => {
//   console.log("here");
//   if (document.visibilityState === "visible" && socket.disconnected) {
//     console.log("Reconnecting after wake-up...");
//     // socket.connect();
//     socket.emit("rejoinRoom", room_id);
//   }
// });

socket.on("message", ({ invoice: newInvoice, userId }) => {
  // localStorage.setItem("room_id", token);
  // if (!'invoice' in localStorage) {
  statusBarEle.replaceChildren();
  invoiceEle.childNodes[0].remove();
  invoiceItemsTable.replaceChildren();
  // console.log(newInvoice);
  localStorage.setItem("invoice", newInvoice);
  // console.log(userId);
  localStorage.setItem("userId", userId);
  const invoice = JSON.parse(newInvoice);
  updateShareStatus(invoice, statusBarEle);
  updateInvoice(invoice, invoiceEle, invoiceItemsTable, amountDue);
  // }
});

socket.on("invoice", ({ invoice }) => {
  // console.log("update", invoice);
  // invoice = newInvoice;
  // invoice = JSON.parse(newInvoice);
  // invoice = newInvoice;
  // console.log(invoice);
  statusBarEle.replaceChildren();
  invoiceEle.childNodes[0].remove();
  invoiceItemsTable.replaceChildren();
  // const tempInvoice = JSON.parse(invoice);
  const tempInvoice = invoice;
  // console.log(tempInvoice);
  // console.log(invoice);
  tempInvoice.senderAddress = JSON.stringify(tempInvoice.senderAddress);
  tempInvoice.clientAddress = JSON.stringify(tempInvoice.clientAddress);
  tempInvoice.items = JSON.stringify(tempInvoice.items);
  // console.log(JSON.parse(tempInvoice.items));
  updateShareStatus(tempInvoice, statusBarEle);
  updateInvoice(tempInvoice, invoiceEle, invoiceItemsTable, amountDue);

  localStorage.setItem("invoice", JSON.stringify(invoice));
  // console.log(localStorage.getItem('invoice'));
});
socket.on("rejoined-room", (message) => {
  // console.log(message);
});

socket.on("askForResponse", ({ approve, userId }) => {
  // alert(`User has approved: ${approve}, waiting on your response`);
  addEditBtns();
  editDialog.close();
  // console.log(editBtns);
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
  // localStorage.setItem("responses", JSON.stringify([]));
  responseDialog.showModal();
});

socket.on("responseReceived", ({ response }) => {
  // console.log(response);
  const responseStr = `User  has ${response ? "approved" : "rejected"} invoice`;
  showResponsePopover(responseStr);
  // showResponsePopover(response);
  const responses = JSON.parse(localStorage.getItem("responses"));
  responses.push(response ? "approve" : "reject");
  localStorage.setItem("responses", JSON.stringify(responses));
  const numOfGuests = localStorage.getItem("numOfGuests") - 1;
  if (!numOfGuests) {
    // localStorage.removeItem("status");
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
      // showResponsePopover("Invoice saved");
    } else {
      // tell all users invoice rejected
      // const { id } = JSON.parse(localStorage.getItem("invoice"));
      socket.emit("resetInvoice", { room_id: token });
      const message = "Invoice reset";
      socket.emit("informEveryUser", { message, room_id: token });
      // showResponsePopover("Invoice reset");
    }
    localStorage.removeItem("responses");
    // responses.push(localStorage.getItem("status"));
    // if (localStorage.getItem("status") === "approved") {
    //   removeEditBtns();
    // } else {
    //   addEditBtns();
    // }
    // save invoice to database
  } else {
    localStorage.setItem("numOfGuests", numOfGuests);
  }
  // console.log(responses);
});
socket.on("displayMessage", ({ message }) => {
  showResponsePopover(message);
});
socket.on("error", (message) => {
  console.error(message);
  // localStorage.removeItem("room_id");
});

socket.on("checkStatus", ({ room_id }) => {
  const status = localStorage.getItem("status");
  if (status === "waiting") {
    const userId = localStorage.getItem("userId");
    const approveResult =
      document.querySelector("[data-approve]").dataset.approve;
    // console.log(approveResult);
    socket.emit("returnStatus", {
      status,
      room_id,
      userId,
      approve: approveResult == "true" ? true : false,
    });
  }
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
  // socket.emit("joinRoom", token);
  showOverlayLoading(loadingOverlay);
  // console.log(loadingOverlay);
  // if (reason === "ping timeout") {
  //   // socket.connect();
  // }
  // if (
  //   reason === "io server disconnect" ||
  //   reason == "transport close" ||
  //   reason === "ping timeout"
  // ) {
  //   // Manual disconnect; prevent automatic reconnection
  //   // location.reload();
  //   // console.log("here");
  //   // socket.connect();
  //   socket.emit("rejoinRoom", room_id);
  // }
  // hideOverlayLoading(loadingOverlay);
});

socket.on("connect", () => {
  console.log("Connected to server");

  // const token = localStorage.getItem("room_id"); // Send token to identify client
  // showOverlayLoading(loadingOverlay);
  const userId = localStorage.getItem("userId");
  if (userId) {
    socket.emit("rejoinRoom", token);
  } else {
    socket.emit("joinRoom", token);
  }
  // socket.emit("rejoinRoom", token);
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
  // console.log(editBtns);
  for (const editBtn of editBtns) {
    // if (!editBtn.classList.has("hide")) {
    editBtn.classList.add("hide");
    // }
  }
  // console.log(editBtns);
}
function removeEditBtns() {
  const editBtns = document.querySelectorAll("[data-show-edit-dialog]");
  // console.log(editBtns);
  for (const editBtn of editBtns) {
    // if (!editBtn.classList.has("hide")) {
    editBtn.classList.remove("hide");
    // }
  }
  // console.log(editBtns);
}

function choiceBtn(btn) {
  const rejectBtns = document.querySelectorAll("[data-reject]");
  const approveBtns = document.querySelectorAll("[data-approve]");
  for (const rejectBtn of rejectBtns) {
    // console.log(rejectBtn.hasAttribute("data-reject"));
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
