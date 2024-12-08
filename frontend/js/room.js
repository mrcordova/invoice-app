import {  updateInvoice, updateShareStatus, perferredColorScheme, setUpEditDialog, saveInvoice} from "./functions.js"; 

const parems = new URLSearchParams(document.location.search);
const deleteDialog = document.querySelector("#delete-dialog");
const editDialog = document.querySelector("#edit-invoice-dialog");
const invoiceEle = document.querySelector("[data-invoice]");
const invoiceItemsTable = document.querySelector(".invoice-table-cont");
const amountDue = document.querySelector("[data-amount-due]");
const statusBarEle = document.querySelector("[data-status-bar]");
const body = document.querySelector('body');
localStorage.debug = 'socket.io-client:socket';
// console.log(token);
const token = parems.get('token');
const room_id = localStorage.getItem('room_id');
let invoice;
let socket;
if (!socket) {
    socket = io();
};
if (!(perferredColorScheme in localStorage)) {
  localStorage.setItem(
    perferredColorScheme,
    window.matchMedia("(prefers-color-scheme: dark)").matches ? true : ""
  );
};
if ('invoice' in localStorage) {
    invoice = JSON.parse(localStorage.getItem('invoice'));
    updateShareStatus(invoice, statusBarEle);
    updateInvoice(invoice, invoiceEle, invoiceItemsTable, amountDue);
};
if (room_id) {
    socket.emit('rejoinRoom', room_id);
} else {
    socket.emit('joinRoom', token); 
};

body.addEventListener('click', (e) => {
    const editDialogTarget = e.target.closest("[data-show-edit-dialog]");
    const saveBtn = e.target.closest('[data-save]');
    
    if (editDialogTarget) {
        setUpEditDialog(editDialog, invoice);
    } else if (saveBtn) {
        e.preventDefault();
        const tempInvoice = saveInvoice(
          editDialog,
          invoice.status === "draft" ? "pending" : invoice.status,
          invoice.id
        );
         statusBarEle.replaceChildren();
        invoiceEle.childNodes[0].remove();
        invoiceItemsTable.replaceChildren();
        const jsonInvoice = JSON.stringify(tempInvoice);
        socket.emit('updateInvoice', {room_id, invoice: jsonInvoice});
      
    }
});

socket.on('message', ({ invoice }) => {
     localStorage.setItem('room_id', token);
    // if (!'invoice' in localStorage) {
        statusBarEle.replaceChildren();
        invoiceEle.childNodes[0].remove();
        invoiceItemsTable.replaceChildren();
        localStorage.setItem('invoice', invoice);
        invoice = JSON.parse(invoice);
        updateShareStatus(invoice, statusBarEle);
        updateInvoice(invoice, invoiceEle, invoiceItemsTable, amountDue);
    // }



});


socket.on('invoice', ({invoice}) => {
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
    tempInvoice.items = JSON.stringify(tempInvoice.items)
    updateStatus(tempInvoice, statusBarEle);
    updateInvoice(tempInvoice, invoiceEle, invoiceItemsTable, amountDue);
       
    localStorage.setItem('invoice', JSON.stringify(tempInvoice));
    // console.log(localStorage.getItem('invoice'));
});
socket.on('rejoined-room', (message) => {
    console.log(message);
});

socket.on('error', (message) => {
    console.error(message);
    localStorage.removeItem('room_id');
})
socket.on("connect_error", (err) => {
  // the reason of the error, for example "xhr poll error"
  console.log(err.message);

  // some additional description, for example the status code of the initial HTTP response
  console.log(err.description);

  // some additional context, for example the XMLHttpRequest object
  console.log(err.context);
});