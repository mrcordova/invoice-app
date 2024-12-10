import {
  updateInvoice,
  updateShareStatus,
  perferredColorScheme,
  setUpEditDialog,
  saveInvoice,
  themeUpdate,
  URL_WEBSITE,
  showOverlayLoading,
  hideOverlayLoading,
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
// localStorage.debug = "socket.io-client:socket";
localStorage.debug = "socket.io-client:socket,socket.io-client:manager";

// console.log(token);
const token = parems.get("token");
const room_id = localStorage.getItem("room_id");
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
  updateShareStatus(invoice, statusBarEle);
  updateInvoice(invoice, invoiceEle, invoiceItemsTable, amountDue);
}
if (room_id) {
  socket.emit("rejoinRoom", room_id);
} else {
  socket.emit("joinRoom", token);
}

if (status) {
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

  if (editDialogTarget) {
    // console.log(invoice);
    setUpEditDialog(editDialog, JSON.parse(localStorage.getItem("invoice")));
  } else if (saveBtn) {
    e.preventDefault();
    const invoice = JSON.parse(localStorage.getItem("invoice"));
    const tempInvoice = saveInvoice(
      editDialog,
      invoice.status === "draft" ? "pending" : invoice.status,
      invoice.id
    );
    // statusBarEle.replaceChildren();
    // invoiceEle.childNodes[0].remove();
    // invoiceItemsTable.replaceChildren();
    const jsonInvoice = JSON.stringify(tempInvoice);
    socket.emit("updateInvoice", { room_id, invoice: jsonInvoice });
  } else if (approveBtn) {
    console.log(approveBtn);
    // editDialog.showModal();
    const senderId = localStorage.getItem("senderId");
    if (senderId) {
      socket.emit("sendResponse", { room_id, approve: true });
      localStorage.removeItem("senderId");
    } else {
      // console.log(room_id);
      socket.emit("sendInvoiceMessage", { approve: true, room_id });
    }
  } else if (rejectBtn) {
    console.log("reject", rejectBtn);
    const senderId = localStorage.getItem("senderId");
    if (senderId) {
      socket.emit("sendResponse", { room_id, approve: false });
      localStorage.removeItem("senderId");
    } else {
      socket.emit("sendInvoiceMessage", { approve: false, room_id });
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

socket.on("message", ({ invoice: newInvoice }) => {
  localStorage.setItem("room_id", token);
  // if (!'invoice' in localStorage) {
  statusBarEle.replaceChildren();
  invoiceEle.childNodes[0].remove();
  invoiceItemsTable.replaceChildren();
  localStorage.setItem("invoice", newInvoice);
  const invoice = JSON.parse(newInvoice);
  updateShareStatus(invoice, statusBarEle);
  updateInvoice(invoice, invoiceEle, invoiceItemsTable, amountDue);
  // }
});

socket.on("invoice", ({ invoice }) => {
  // console.log('update', invoice);
  // invoice = newInvoice;
  // invoice = JSON.parse(newInvoice);
  // invoice = newInvoice;
  statusBarEle.replaceChildren();
  invoiceEle.childNodes[0].remove();
  invoiceItemsTable.replaceChildren();
  const tempInvoice = JSON.parse(invoice);
  // console.log();
  tempInvoice.senderAddress = JSON.stringify(tempInvoice.senderAddress);
  tempInvoice.clientAddress = JSON.stringify(tempInvoice.clientAddress);
  tempInvoice.items = JSON.stringify(tempInvoice.items);
  updateShareStatus(tempInvoice, statusBarEle);
  updateInvoice(tempInvoice, invoiceEle, invoiceItemsTable, amountDue);

  localStorage.setItem("invoice", JSON.stringify(tempInvoice));
  // console.log(localStorage.getItem('invoice'));
});
socket.on("rejoined-room", (message) => {
  console.log(message);
});

socket.on("askForResponse", ({ approve, userId }) => {
  // alert(`User has approved: ${approve}, waiting on your response`);
  localStorage.setItem("senderId", userId);
  showResponsePopover(approve);
});

socket.on("waitingForResponse", ({ status, numOfGuests }) => {
  console.log(status);
  localStorage.setItem("status", status);
  localStorage.setItem("numOfGuests", numOfGuests);
  responseDialog.showModal();
});

socket.on("responseReceived", ({ response }) => {
  console.log(response);
  showResponsePopover(response);
  const numOfGuests = localStorage.getItem("numOfGuests") - 1;
  if (!numOfGuests) {
    localStorage.removeItem("status");
    responseDialog.close();
    localStorage.removeItem("numOfGuests");
  } else {
    localStorage.setItem("numOfGuests", numOfGuests);
  }
});
socket.on("error", (message) => {
  console.error(message);
  localStorage.removeItem("room_id");
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
  // socket.emit("joinRoom", token);
  showOverlayLoading(loadingOverlay);
  console.log(loadingOverlay);
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
  socket.emit("rejoinRoom", parems.get("token"));
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
function showResponsePopover(approve) {
  const userResponse = responsePopover.querySelector("[data-response]");
  userResponse.textContent = `${approve ? "approved" : "rejected"}`;
  responsePopover.showPopover();
  setTimeout(() => {
    responsePopover.hidePopover();
  }, 2000);
}
